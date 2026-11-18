# REVIEW: quantum-circuits reel

**Output**: `quantum-circuits-reel.mp4`, 1080x1920, 30 fps, 32.6 s, H.264 High, yuv420p, faststart, ~1.3 MB.

## Creative calls
- Explainer spine is one worked example: build a Bell state. The circuit grows one gate per beat. Under it, a 4-column state chart morphs continuously: probabilities first, then live measurement counts.
- Look is a screen-print lab poster: flat yellow, black ink, cobalt only for the quantum state, red only for the "NEVER" stamps. This deliberately avoids the dark-void/glow/gradient look.
- Wire tint: a wire turns cobalt once its qubit is in superposition. After CNOT the tint spreads to q1, which makes the entanglement visible.
- Not built: a Bloch-sphere storyline (it can't show entanglement) and a "spooky action" storyline (it invites misconceptions).
- Measurement uses 1,000 real seeded samples, so early shots fluctuate (shot 1 reads 100/0) before settling at 49/51. That is honest, not a bug.

## Measured vs looked at
- Measured: frame-0 content, safe zone (all text between y 200 and 1300, nothing past x 940), type ≥ 40 px, hold times (0.5 s + 0.3 s/word), and dead stretches. The one 3 s gap after the H split was fixed with the wire tint.
- Looked at: a 16-frame contact sheet plus QA stills at 0, 2.5, 5.5, 10.5, 16, 18, 22, 26, 31 s.
- Not checked: playback on an actual phone in the Instagram app.

## Known compromises
- **Silent.** No licensed music source was available. Add a bed with `ffmpeg -i quantum-circuits-reel.mp4 -i music.mp3 -c:v copy -c:a aac -b:a 192k -shortest out.mp4`.
- **Ket brackets (⟩)** fall back to the system DejaVu Sans, because Space Grotesk lacks the glyph. They look fine, but on another machine bundle a font that has U+27E9.
- **Weakest shot**: the H-split transition at ~8.7 s, where the two "50%" labels briefly overlap while the bar slides.

## Re-render
`node ../../.claude/skills/video-reels/scripts/render.mjs index.html --out quantum-circuits-reel.mp4` (after `npm install`).
