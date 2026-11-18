# REVIEW: quantum-3d reel (v2)

**Output**: `quantum-entanglement-3d.mp4`, 1080x1920, 30 fps, 36.0 s (1,080 frames), H.264 High CRF 17, 2-sample motion blur, ~26 MB. Rendered in ~41 min on 4 CPU cores (SwiftShader WebGL, 3 workers).

## Creative calls
- The real machine is the hook. A procedural dilution-refrigerator chandelier: gold plates, bolts, steel still stack, copper/steel coax with pigtail coils. The camera cranes down it, then pushes into the chip on the sample holder.
- Match cut at 8.6 s: the die's canvas texture is shared by both worlds, and the camera distance is matched by FOV. A 0.14 s blur swap hides the seam.
- The chip's two Xmon crosses light up and the qubits rise from them as glass Bloch spheres. Circuit wires become gold rails, gates become portals with their symbols on top, measurements become towers of instanced cubes.
- Physics is shown honestly. After CNOT both Bloch arrows shrink to zero (each qubit alone is maximally mixed) while a cobalt thread links them. Measurement uses real seeded samples (≈50/50), and 01/10 stay empty.

## Measured vs looked at
- Measured: duration and frame count via ffprobe, after an 18 s first render exposed a timestamp bug in `--shutter`, which is now fixed.
- Looked at: QA stills at ~25 timestamps across three iterations, plus a 16-frame contact sheet of the final MP4.
- Fixed in review:
  - Instanced cubes were frustum-culled and never drew.
  - Qubits were cropped in the narrow 9:16 frame (wider FOV, tighter wire spacing).
  - Gold-on-gold floor replaced with a silicon floor.
  - Towers too tall for the title band (6x6 footprint).
  - Fog washing out the match cut.
- Not checked: playback in the Instagram app; the sound (there is none).

## Weakest moments
- ~18.9-19.2 s: the camera passes close under the CNOT emblem, and its ring briefly fills the lower-left frame.
- The |00⟩ and |01⟩ floor labels sit close to the meter dials in the measurement shot.

## Kept on purpose
- Silent: designed to read muted. Add a bed with `ffmpeg -i quantum-entanglement-3d.mp4 -i music.mp3 -c:v copy -c:a aac -b:a 192k -shortest out.mp4`.

## Re-render
`npm install`, then `node ../../.claude/skills/video-reels/scripts/render.mjs index.html --out quantum-entanglement-3d.mp4 --workers 3 --shutter 2 --crf 17`
