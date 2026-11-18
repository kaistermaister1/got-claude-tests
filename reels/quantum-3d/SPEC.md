# SPEC: "Inside a quantum computer" (3D Instagram Reel, v2)

- **Format**: 1080x1920, 30 fps, 36 s, WebGL (three.js 0.170), 2-sample motion blur.
- **One idea**: a real quantum computer runs a two-gate circuit (H then CNOT) that makes two qubits always agree. That is entanglement.
- **Hook**: the real machine. A gold dilution-refrigerator "chandelier", colder than deep space (0.01 K vs 2.7 K).
- **Spine**: chandelier -> dive into the chip on its sample holder (match cut) -> the two Xmon qubits on the chip rise up as Bloch spheres -> they travel along gold wire rails through gate portals (H, then CNOT) -> measured 1,000 times -> results stack into towers.

## Physics checked
- H on |0⟩ gives |+⟩: the Bloch arrow tips from the north pole to the equator.
- After CNOT the state is (|00⟩+|11⟩)/√2. Each qubit's reduced state is maximally mixed, so its Bloch vector has length 0. The arrows shrink to the centre while a cobalt thread links the pair.
- Measurement uses 1,000 seeded samples, each 00 or 11 with p = ½. Both spheres snap to the same pole on every shot. Columns 01 and 10 stay empty.

## Look
- Studio product film: warm-grey seamless background `#d9d3c9` with fog.
- Gold PBR metal, pale silicon chip textures (procedural canvas: CPW lines, meander resonators, Xmon crosses, bond pads).
- Cobalt `#2340ff` only for quantum state (arrows, thread, result cubes). Red only for "NEVER".
- Inter Tight 700 titles at 94 px under a soft top scrim. 6% vignette, 7% grain.

## Shots
| t | Shot | Camera |
| --- | --- | --- |
| 0-5 | Chandelier, "This machine is colder than space." | crane down + orbit |
| 5-8.6 | "At the bottom: a quantum chip." | swing to front, accelerating push into the die |
| 8.6 | match cut: die -> chip world | blur swap at fastest frame |
| 8.6-13.4 | Xmons light, Bloch spheres spring up, rails grow, H portal drops | descend + tilt from top-down to oblique |
| 13.4-17 | spheres pass through H; q0 tips to equator | follow rig |
| 17-23.5 | CNOT portal; arrows vanish; entanglement thread draws | follow -> slow orbit side shot |
| 23.5-30.3 | meters rise; 1,000 shots arc into towers | elevated rig with slow push |
| 30.6-36 | "They always agree." + formula + "That's entanglement." | slow orbit of the towers |

BANNED: dark void, glow/bloom, neon, purple gradients, glass cards, everything centred, pulsing loops, logo.
