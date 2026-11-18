# SPEC: "How do you entangle two qubits?" (Instagram Reel)

- **Format**: 1080x1920, 30 fps, 32.6 s, H.264. Silent by design: it reads muted, and a music bed can be added later.
- **One idea**: A two-gate quantum circuit (H, then CNOT) turns two independent qubits into a pair whose measurements always agree. That is entanglement.
- **Aha**: the CNOT doesn't add anything new. It *moves* the |10⟩ half of the state to |11⟩. After that, "01" and "10" never happen.
- **Spine (worked example)**: the state |00⟩ goes through H on q0, then CNOT (control q0, target q1), then 1,000 measurements.
  - |00⟩ → (|00⟩+|10⟩)/√2 → (|00⟩+|11⟩)/√2 → outcomes 00 or 11, ~50/50.
  - Ket order is |q0 q1⟩.
- **Device**: one circuit diagram that grows, one gate per beat. Under it, a four-column state chart (|00⟩ |01⟩ |10⟩ |11⟩) that morphs continuously. Probability bars become measurement counts. A cobalt playhead shows "where we are" in the circuit.

## Look: "screen-print lab poster" (one medium)

- Ground: flat warm yellow `#F6D24A`. Halftone dots (ink at 10%) only in the bottom band (y > 1360, platform UI zone).
- Ink A `#141414`: every word, wire and gate.
- Ink B (cobalt) `#2538F0`: the quantum state only (bars, playhead, formula), one focus per frame.
- Ink C (red) `#E3432B`: only the "never" stamps.
- Type: Space Grotesk 700. Titles 96 px (5% of height), subs 44 px, labels ≥ 34 px. Left-aligned at x = 90.

## Layout (safe zone 168-1330, right rail kept clear of text past x = 940)

- Titles y 210-470.
- Circuit y 520-840: wires at 610 and 770, H at x = 360, CNOT at x = 580, meters at x = 820.
- State chart y 880-1300: baseline 1220, max bar 280 px, ket labels under it.
- Below 1330: halftone texture only.

## Shots

| t (s) | Beat | Title (entrance) | Picture |
| --- | --- | --- | --- |
| 0-3.2 | Hook | "How do you / entangle two qubits?" (already on screen at frame 0) | wires + labels visible; the |00⟩ bar grows to 100% at 0.6 |
| 3.2-7 | Read it | "Time runs / left to right." (per-word blur-in) | playhead appears, labels q0/q1 tick to accent |
| 7-13 | H | "Gate H splits / q0 in two." (grey → ink per word) | H drops onto q0 with a spring; playhead passes; the |00⟩ bar splits and half slides to |10⟩ |
| 13-19.6 | CNOT | "CNOT flips q1 / only if q0 is 1." (whole-line blur) | dot + line + ⊕ draw; playhead passes; the |10⟩ bar slides to |11⟩; sub swaps at 17 |
| 19.6-26.6 | Measure | "Measure it / 1,000 times." (slot-roll on "1,000") | meters pop; digits flick; bars become live counts; "never" stamps on 01/10 at 25.4 |
| 26.6-32.6 | Payoff | "The two qubits / always agree." → formula → "That's entanglement." (held 3 s) | circuit dims to 22%; cobalt formula over it |

BANNED: dark void, glow, gradients, glass, centred everything, fade-slide-up on every element, pulsing loops, HUD corners, logo, bouncing titles, plus "coin flip" metaphors (scientifically misleading).

QA frames: 0, 2.5, 5.5, 10.5, 16, 18, 22, 26, 31.
