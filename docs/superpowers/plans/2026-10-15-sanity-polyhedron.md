# SANITY Polyhedron Implementation Plan

> Execution: implement directly in this session under the user's existing authorization; no separate approval or delegation is needed.

**Goal:** Replace the Vitruvian figure with the reference's lit, rotating and vibrating polyhedron, a slowing SANITY countdown, and an unbolded garbled final message.

**Architecture:** Generate a triangulated 3D polyhedron in `public/polyhedron.js`; project it into the existing canvas and retain the star expansion. Keep progress-to-count, color and garbled text functions in `public/loading.js`, with the central text frame in HTML/CSS.

**Tech Stack:** Existing local Node server, browser JavaScript modules and Canvas 2D; no new dependencies.

**Spec:** User request in this conversation dated 2026-10-15, with the attached yellow wireframe reference.

## Constraints and review focus

- Pure black background; the polyhedron starts yellow and fully lit, becoming white at 100% while rotating with slight vibration.
- SANITY begins at 999, slows toward 0 at 90%, stays 0 until 100%, then displays -1. Fewer magnitude digits increase the number's size.
- Final loading message is garbled and normal weight; preserve the first three messages and four navigation columns.
- Preserve moving progress numbers, full-screen stars, slow drift, pointer parallax, font transitions, glitches, click entry, comments and reduced-motion support.
- Check curve monotonicity, end boundaries, resize and replay, negative sign layout, desktop/mobile fit, and sufficient star density after replacing the figure.

## Tasks

- [x] Add pure countdown/color/message and geometry/projection functions, with focused tests for milestones, deceleration, digit changes, connected faces, motion and reduced motion.
- [x] Integrate lit depth-aware lines and vertices, the SANITY frame and larger digits; preserve a 615-star morph even though the mesh has fewer vertices.
- [x] Replace the last message and remove obsolete Vitruvian implementation/tests; update syntax checks and README.
- [x] Run syntax and relevant tests; verify initial yellow, white completion/-1, garbled normal-weight text, morph, entry, replay and responsive layout in the browser. Save preview screenshots.

Validation: `npm run check` and all 14 tests pass. Browser QA confirms yellow and white mesh states, three digit sizes, zero before completion and -1 at 100%, normal-weight changing red garble, star expansion, entry and replay reset to 999. At 390px the enlarged -1 fits its panel without horizontal overflow. Progress rails were lowered to avoid overlapping the central number. No browser console warnings/errors. Proof images: `qa/polyhedron-complete.png` and `qa/polyhedron-phone.png`.
