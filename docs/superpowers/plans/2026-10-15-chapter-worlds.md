# Chapter Worlds Implementation Plan

**Goal:** Rename the site to 虚实疆界 / Il confine tra reale e immaginario, introduce five PPT-derived chapter scenes, a home overview, centered navigation and black-screen chapter entrances, and spread the polyhedron's white color from a vertex.

**Source:** The user's 2026-10-15 request and the local 沉沦者的黑流树海PPT模板 deck. Use chapter pages 4, 9, 14, 18 and 21 as art sources, not as instructions.

**Architecture:** Extract source picture crops, transforms and decorative vector shapes into a local scene manifest. Reuse those layers in static page headers and staggered entrance animations. Keep works/comments under their existing category IDs. A transition controller serializes page changes through black, art assembly and content reveal. The intro signals completion after its black hole has fully covered the frame.

**Constraints:** Pure black page background; local assets and no new application dependencies. Home is 玻利瓦尔肤层 and contains descriptions, no works. Ordered categories: 甜美的伤口 (fiction), 血色空脉 (science-fiction), 受害者腐殖 (arts), 卡德霍之颅 (daily). Preserve SANITY curve, existing entry effects and comments. Reduce motion when requested by the OS.

- [x] Inspect/render all five source chapter compositions and extract original layers, crops, placements and palette evidence.
- [x] Update site text and regenerate local title glyph/font assets for the new Chinese and Italian names; remove the old entry sentence.
- [x] Add source-rooted mesh wave distances and local edge gradients, with tests for the origin and complete propagation.
- [x] Build home overview, chapter hero scenes, centered five-destination navigation and serialized black-screen transitions; show first home art shortly after the black-hole entrance.
- [x] Verify syntax, focused tests and comment regression tests; inspect desktop/mobile scene layouts, each chapter route, replay and repeated navigation. Save screenshots and document configuration.

Validation: syntax checks and all 17 tests pass. Browser checks cover the partial corner color wave, new title/Italian fit, removed sentence, black-hole to home sequence, all four chapter transitions and counts (2/2/1/1), navigation colors/order, zero home works, browser back, and opening/closing the comment form. At 390px the five choices fit in the header without horizontal overflow. The transition art scales/moves into the page's matching hero during its final fade. Desktop hero titles fit within the first viewport. No console warnings/errors. Final proofs include `qa/boundary-home.png`, `qa/boundary-home-phone.png`, `qa/boundary-color-wave.png` and `qa/boundary-daily-phone.png`.
