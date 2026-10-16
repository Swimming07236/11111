# Cortical folds and star drift

**Goal:** Make the white oblique brain visibly folded, and give the entire star map a very slow autonomous drift in addition to mouse parallax.

**Superseded:** The subsequent user request replaces the brain with a Vitruvian figure. The star-drift implementation and tests remain active; see `2026-10-15-vitruvian-entrance.md` for the current plan.

- [ ] Replace the low-resolution hemispheres in `public/brain.js` with a denser irregular mesh. Define curved sulci, depress the surface along them, and sample both banks and groove floors. Keep cerebellum, brainstem, oblique perspective and gradual illumination.
- [ ] Adjust `public/intro.js` to distinguish bright folds from a subdued supporting mesh, use depth and facing to separate front and back surfaces, and keep the final star map's density and frame cost bounded.
- [ ] Add `public/star-drift.js` with continuous position integration and smoothly randomized headings over 3–6 minute intervals. Move background stars and constellation nodes/edges together, wrap outside the viewport, preserve parallax and reduced-motion support, and reset on replay.
- [ ] Add timing controls to `public/content.js`, update documentation, and verify the geometry, drift continuity, browser appearance and entry/replay on desktop and mobile.
