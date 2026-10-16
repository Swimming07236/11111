# Manuscript Refinement Plan

**Goal:** Use a fixed manuscript title, carry its ornaments into the page margins/footer, remove settled hero captions, expand editable home copy, rename daily to 生活 · 生命, and highlight final SANITY -1 in red bold.

**Source:** User's 2026-10-15 follow-up and screenshot. The supplied template folder contains `voynich-1.ttf`; inspection confirms it has no Chinese glyphs. Use it for Latin and ornaments, with a matching Kai Chinese subset for legibility.

**Implementation:** Simplify `title.js` to fixed text only. Generate two local font subsets. Set Italian to 85% of the Chinese font size with natural wrapping. Keep chapter transition captions but replace settled hero captions with accessible headings, preserving original art. Render multi-paragraph home introduction and longer chapter overviews from `content.js`; increase category-label size. Reuse original PPT flourishes with sparse Voynich marginalia in `manuscript.css`.

- [x] Update home copy and chapter descriptions, including 生活 · 生命 and richer title-linked overviews.
- [x] Remove font cycling, add fixed manuscript fonts and local font-generation support.
- [x] Preserve art and animation captions, remove settled hero text, add border/footer ornaments and larger category notes.
- [x] Make only the final negative SANITY value red/bold; verify replay resets its style.
- [x] Verify desktop/mobile and persistent text, comments regression and assets. Write a clear Chinese editing guide with a copyable work entry and update steps.

**Validation:** `npm run check` and all 17 `npm test` cases passed. Browser checks verified fixed manuscript fonts, a 0.85 font-size ratio on desktop and a 390px mobile viewport, natural wrapping without horizontal overflow, four home introduction paragraphs, larger category labels, preserved chapter art without visible settled captions, footer ornaments, red bold -1 and a normal white 400-weight value after replay. No browser warnings or errors were recorded. Screenshots are saved under `qa/manuscript-*.png`.
