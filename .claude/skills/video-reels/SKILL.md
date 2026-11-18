---
name: video-reels
description: Make, animate, review and render short videos with code - Instagram Reels / TikTok / Shorts (9:16), explainers, data and math animations, launch clips. Read before writing any video code. Merged from the strongest public video skills (HeyGen HyperFrames, Remotion's official agent skills, the Manim composer/best-practices skills) into one renderer-agnostic workflow, plus a built-in HTML -> MP4 pipeline that runs offline with Playwright + ffmpeg.
---

# Video reels (and other short videos)

This skill merges the best public video skills found in Nov 2026:

| Source | Stars | What it contributed |
| --- | --- | --- |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) `skills/hyperframes` (Apache-2.0) | ~86k | Render contract, vertical rules, motion craft, banned defaults, review loop |
| [remotion-dev/skills](https://github.com/remotion-dev/skills) (official) | ~7.5k | React/Remotion route, preserve user edits, render only on request |
| [adithya-s-k/manim_skill](https://github.com/adithya-s-k/manim_skill) `manim-composer` (MIT) | ~1.3k | 3Blue1Brown-style planning: hook, aha moment, scenes.md |
| [Yusuke710/manim-skill](https://github.com/Yusuke710/manim-skill) (MIT) | ~0.2k | narration -> TTS -> code -> render -> mux loop |

## 0. Pick the renderer

| Situation | Use |
| --- | --- |
| Default; sandbox / no account / offline | **Built-in pipeline** below: one HTML file + GSAP paused timeline -> `scripts/render.mjs` -> MP4 |
| Person wants a live editing studio, registry effects, HeyGen avatars/voice | HyperFrames (`npx hyperframes init`). Its skill fires a telemetry beacon (`events`); skip it unless the person opts in |
| Existing React codebase, `<Player>` in an app, Lambda rendering | Remotion (`npx create-video@latest`). Free for individuals and companies of up to 3 people, paid above that: say so |
| Equations, proofs, graphs morphing (3b1b look) | Manim CE (`pip install manim`, needs cairo/pango; LaTeX for `MathTex`) |

Whatever renders it, sections 1-6 apply.

## 1. Plan before code (write `SPEC.md`)

1. **One idea.** The viewer understands one thing by the end. Write it as one line, plus the "aha moment".
2. **Hook.** The question a viewer would actually ask. Ground it in something they know before the abstract device arrives.
3. **Spine = one worked example.** One concrete input travels through every step to the answer. Not a tour of facts or a slide of bullets.
4. **Storylines.** For anything over ~15 s, sketch three different films in words. Let the person pick, unless they said "no questions". Then commit.
5. **Turn adjectives into numbers.** Palette hexes, type sizes as % of frame height, eases, durations, shot list with timestamps.
6. **BANNED line.** Copy the defaults in §5 and add anything this film must not become.
7. **Check the science.** Verify every formula, state and number before you animate it. A beautiful wrong diagram is worse than none.

## 2. Render contract (determinism)

- The frame at time `t` is a pure function of `t`. Build **one paused timeline** and expose `window.__seek(t)` (seconds) and `window.__duration`. The renderer seeks; nothing plays by itself.
- No `Date.now()`, timers, `requestAnimationFrame` loops, network fetches, or `repeat: -1`. Randomness must be seeded (e.g. mulberry32).
- Animate transforms and opacity, not `left/top/width/height`. Don't put a CSS `transform` on an element GSAP also transforms.
- Bundle fonts locally (`@fontsource/*` or `@font-face` to a file) and `await document.fonts.ready` before the first frame.
- Frame 0 is the thumbnail: never black, never a logo.

## 3. Vertical / social (1080x1920, 30 fps)

- **Safe zone.** Nothing in the top 168 px. All words and the subject sit between 168 and 1330 px. Below 1330 px only decoration (the platform draws the caption, handle and buttons there). Keep text off the right ~140 px action rail.
- **First second.** The hook (one bold line or the result) is on screen at frame 0. Many viewers watch muted, so the pictures must carry it.
- **Type.** Nothing that must be read under 28 px. Titles 4-9% of frame height. About 5 words per line for a claim: cut words, never shrink type.
- **Pacing.** Something new every 2-4 s; shots of 1-2 s in montages. The payoff lands before the swipe. Total 20-45 s for an explainer reel.
- One subject, stacked vertically. Rebuild landscape layouts as a vertical sequence; never squeeze them.

## 4. Motion craft

- **Eases by role.** Arrivals use long-tail ease-outs (`expo.out`, `power4.out`). Camera moves and colour floods use `power2.inOut`. Exits accelerate (`power3.in`). Linear only for constant rotation or progress. Don't use `power2.out` 0.5 s on everything.
- **Exits** are 40-50% shorter than entrances. **Overlap**: start the next element when the previous is 30-50% done. **Stagger**: words 60-120 ms, list items 40-80 ms.
- **Holds.** A line to read holds 0.5 s + 0.3 s per word. The last line holds at least 2 s. A landed title is **dead still**: move the next thing instead.
- **Vary title entrances.** Mix per-word blur-in (6 px -> 0, 0.13 s each, 67 ms apart), grey -> ink per word, whole-line blur-in, a slot-machine word roll. Don't fade-and-slide-up every time.
- **Springs.** Damping 0.7-0.85 reads premium, 0.4-0.6 playful. Position and scale may bounce; opacity and colour never do.
- **Transitions with a cause** (3-5 kinds per film): object becomes the world, morph, colour flood, whip with blur, blur-swap on one stage, iris from a point. Worlds never crossfade.
- **Explainer devices** (3b1b + HyperFrames):
  - One diagram that grows, with each part appearing as it is named.
  - Continuous transformation: the next state morphs out of the last, so the viewer never loses the thread.
  - Labels sit on the part they name.
  - The same idea shown two ways (picture + symbol).

## 5. BANNED by default (the "AI-generated" look)

- A black or navy void with small things floating in the middle.
- Glow, bloom, neon, lens flares, orbs, floating particles.
- Purple or blue gradients, mesh gradients, glass cards.
- Cream paper + serif display + italic accents + "01/02" + mono caps labels + pill chips.
- Everything centred. Everything fading in at once. Every element fade-sliding up.
- Text moving while it's read. Titles drifting after they land.
- Breathing or pulsing loops standing in for motion.
- HUD corners and frame borders as decoration. Three cards in a row. KPI grids. A logo docked in a corner.

Build the look from **one medium's rules** instead, e.g. a risograph: flat paper, ink A for every word, one fluorescent ink B per frame, halftone instead of gradients.

## 6. Review before delivering

1. **Stills / contact sheet.** `node scripts/render.mjs page.html --sheet sheet.png` takes frames across the film. Also check the beat frames at phone width (360 px).
2. **Describe each beat frame in one sentence as a stranger would.** An object that needs explaining is a P0. With the words covered, do the frames still tell the story?
3. **Check every line**: on screen long enough to read? Inside the safe zone? ≥28 px? Any dead stretch over 3 s?
4. **Write notes** as `t=4.2s · where · problem -> exact change`. Rank them P0 (broken or unreadable), P1 (weak), P2 (polish). Fix every P0 and the worthwhile P1s, then re-check only what changed. Never score the film out of 10.
5. **Write `REVIEW.md`**: creative calls, what was measured vs only looked at, the weakest shot, kept warnings and why.

## 7. Sound

- A film over ~15 s that tells something wants a music bed plus a few effects with on-screen causes (whoosh on a cut, pop on a landing; peak one frame after the picture).
- Use the person's track or a licensed library.
- Don't write music in code or synthesise chimes. You can't hear the result. Without a music source, deliver silent, designed to read muted, and say so in one line with how to add a track: `ffmpeg -i reel.mp4 -i music.mp3 -c:v copy -c:a aac -b:a 192k -shortest out.mp4`.
- Narration, only when asked: the voice is the clock. Text lands on the word that says it; about 19 words per scene; captions inside the safe zone.

## 8. Built-in pipeline

```
my-reel/
  index.html        # the whole film: markup + CSS + GSAP paused timeline
  package.json      # gsap, @fontsource/<font>
  SPEC.md, REVIEW.md
```

`index.html` must:

```js
const tl = gsap.timeline({ paused: true });
// ... tweens at absolute times: tl.to(el, {...}, 3.2)
window.__duration = 32;                       // seconds
window.__seek = (t) => tl.seek(t, false);     // pure function of t
window.__ready = document.fonts.ready.then(() => true);
```

Render with `scripts/render.mjs` (resolves the preinstalled Playwright; Chromium at `/opt/pw-browsers/chromium` if needed):

```bash
node .claude/skills/video-reels/scripts/render.mjs my-reel/index.html --out my-reel/reel.mp4   # full MP4
node .claude/skills/video-reels/scripts/render.mjs my-reel/index.html --sheet my-reel/sheet.png # contact sheet (16 frames)
node .claude/skills/video-reels/scripts/render.mjs my-reel/index.html --at 0,5.5,12 --stills my-reel/stills
```

Options: `--fps 30 --width 1080 --height 1920 --crf 18`.

**Delivery encode** (Instagram / TikTok / Shorts): H.264 High, `yuv420p`, 30 fps, 1080x1920, CRF ~18, `+faststart`, AAC 48 kHz if there is audio, ≤ 90 s.

## 9. Etiquette (from Remotion and HyperFrames)

- The person may have edited files since your last turn. Read before you change anything, and build on their edits.
- Open or show a preview (stills or a contact sheet) before a long render when the person is steering. Render the final file when they ask for the file or said "no stops".
