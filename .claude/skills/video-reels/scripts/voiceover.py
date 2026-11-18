#!/usr/bin/env python3
"""ElevenLabs voiceover for the video-reels skill.

Reads a narration.json ({voice_id, model_id, lines:[{id,start,end,text}]}), synthesises each line,
fits it inside its [start, end) slot (re-requesting with a faster `speed` if it runs long),
and mixes everything into one track aligned to the film's clock.

  python3 voiceover.py narration.json --duration 36 --out voiceover.wav

The API key is never read here: in a Claude cloud session the network proxy injects the
`xi-api-key` header for api.elevenlabs.io. Elsewhere, set ELEVENLABS_API_KEY.
"""
import argparse, hashlib, json, os, subprocess, sys, time, urllib.request, urllib.error
from pathlib import Path

MAX_SPEED = 1.12  # faster than this sounds rushed: cut words instead
API = "https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_192"


def tts(voice, model, text, speed, prev_text, next_text):
    body = {"text": text, "model_id": model,
            "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.25, "speed": speed}}
    if prev_text: body["previous_text"] = prev_text
    if next_text: body["next_text"] = next_text
    headers = {"Content-Type": "application/json", "Accept": "audio/mpeg"}
    if os.environ.get("ELEVENLABS_API_KEY"):
        headers["xi-api-key"] = os.environ["ELEVENLABS_API_KEY"]
    for attempt in range(5):
        req = urllib.request.Request(API.format(voice=voice), data=json.dumps(body).encode(), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            msg = e.read()[:300]
            if e.code in (429, 500, 502, 503, 504) and attempt < 4:
                time.sleep(2 ** attempt); continue
            sys.exit(f"ElevenLabs {e.code}: {msg!r}")
        except (urllib.error.URLError, TimeoutError):
            if attempt < 4: time.sleep(2 ** attempt); continue
            raise


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def trimmed(src, dst):
    # trim leading/trailing silence so the slot timing is the speech itself
    f = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,areverse," \
        "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse," \
        "silenceremove=stop_periods=-1:stop_duration=0.3:stop_threshold=-45dB:stop_silence=0.28"  # cap inner pauses
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", f, "-ar", "48000", "-ac", "1", str(dst)], check=True)
    return duration(dst)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("narration"); ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--out", default="voiceover.wav"); ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    spec = json.loads(Path(a.narration).read_text())
    d = Path(a.narration).parent / "lines"; d.mkdir(exist_ok=True)
    lines = spec["lines"]
    placed = []
    for i, ln in enumerate(lines):
        slot = ln["end"] - ln["start"]
        speed = ln.get("speed", 1.0)
        prev_t = lines[i - 1]["text"] if i else None
        next_t = lines[i + 1]["text"] if i + 1 < len(lines) else None
        wav = d / f"{ln['id']}.wav"
        while True:
            key = hashlib.sha1(f"{spec['voice_id']}|{spec['model_id']}|{ln['text']}|{speed:.2f}".encode()).hexdigest()[:10]
            mp3 = d / f"{ln['id']}_{key}.mp3"
            if a.force or not mp3.exists():
                mp3.write_bytes(tts(spec["voice_id"], spec["model_id"], ln["text"], speed, prev_t, next_t))
            dur = trimmed(mp3, wav)
            if dur <= slot or speed >= MAX_SPEED:
                break
            speed = min(MAX_SPEED, round(speed * dur / slot + 0.02, 2))
        fit = "ok" if dur <= slot else f"OVER by {dur - slot:.2f}s"
        print(f"{ln['id']}: {dur:.2f}s in {slot:.2f}s slot @ speed {speed:.2f}  {fit}")
        placed.append((wav, ln["start"]))
    # mix: each line delayed to its start, padded to the film length
    inputs, chains = [], []
    for k, (wav, start) in enumerate(placed):
        inputs += ["-i", str(wav)]
        ms = int(round(start * 1000))
        chains.append(f"[{k}]adelay={ms}|{ms}[a{k}]")
    mix = "".join(f"[a{k}]" for k in range(len(placed)))
    fc = ";".join(chains) + f";{mix}amix=inputs={len(placed)}:normalize=0,apad,atrim=0:{a.duration}," \
         "loudnorm=I=-16:TP=-1.5:LRA=11[out]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", fc, "-map", "[out]", "-ar", "48000", "-ac", "2", a.out], check=True)
    print(f"wrote {a.out} ({duration(a.out):.2f}s)")


if __name__ == "__main__":
    main()
