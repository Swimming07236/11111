# Entrance refinement Implementation Plan

**Goal:** Move both progress heads to the center, replace the brain with a dense white 3D perspective model, add random typographic transitions and occasional code glitches.

**Architecture:** Keep the local service and gallery unchanged. Separate reusable 3D geometry and title animation from the canvas entrance controller; preserve local-only fonts and assets.

- [x] `public/brain.js`: model two wrinkled hemispheres, cerebellum and brainstem in 3D; project from an oblique side angle with depth shading and subtle rotation; light nodes continuously across ten regions.
- [x] `public/styles.css`: extend each rail to 50% of the viewport, position percentages at moving heads and keep both labels readable at their central meeting point.
- [x] `public/title.js`, local fonts and glyph masks: select a random initial paired style; periodically change styles with reverse handwriting removal, handwriting reveal, terminal backspace and cursor typing as appropriate.
- [x] `public/intro.js`: morph the denser model to stars, preserve central black-hole entry, add occasional brief star-image displacement and code fragments while waiting.
- [x] `public/content.js`, `README.md`: provide timing controls and describe the new effects.
- [x] Check syntax, projection and transition behavior; inspect desktop and mobile layouts, font changes, glitch fragments and entry/replay in the browser.

Reduced-motion mode keeps a random static font and avoids repeated glitches. Changing fonts or glitches must never activate entry, interrupt the waiting screen or block the entry button.
