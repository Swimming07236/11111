# Terminal Gate Implementation Plan

> Implement directly in the existing local project. User has authorized the changes; no hosting or publication work.

**Goal:** Keep the initial random music continuous across pages and make the start gate a pixel terminal with an ornate, unsettling data-flow seal and a small red sound notice.

**Architecture:** Limit `content.musicDefaults` to the initial random selection. Remove page-entry playback selection from app/player, retaining SANITY gain and manual music controls. Scope the new local pixel font, SVG seal and motion styles to the start gate.

**Tech Stack:** Existing HTML/CSS/ES modules, SVG, local Fusion Pixel WOFF2 font, Node tests.

**Spec:** User messages of 2026-10-16 in this chat: remove chapter default songs, preserve the initial random track, pixel text on the first screen, more ornate eerie button while retaining information flow, exact red notice “启动程序会产生声音，请保证设备处于恰当环境中”.

## Constraints and Review Focus

- Do not delete supplied music files or change the remaining intro/chapters.
- Chapter navigation and returning home preserve song, elapsed time, pause state and chosen volume.
- Start click still unlocks playback, with existing SANITY fade; replay returns to the silent gate.
- Pixel font must support all gate text locally, with its upstream license retained.
- Mobile layout must fit the notice, hover/focus retains enlargement, and reduced motion stops decorative animation.

## Tasks

- [x] Remove chapter selections and page playback callback, update the existing music test to verify initial-only choice; run relevant tests.
- [x] Bundle the Chinese pixel font and license; replace start gate markup and styles with the data-flow seal and red notice.
- [x] Update README/editing guide; check desktop/mobile, activation, continuous chapter/home playback, and replay in the browser.
- [x] Run syntax and regression checks and save a screenshot.

Validation: syntax checks and all 32 tests pass. Browser checked desktop and 390px mobile; focus scales the seal to 1.12. Initial selection was RADWIMPS — デート; all four chapters and returning home preserved the same source with elapsed time advancing from 0:26 to 0:37. A paused navigation preserved 1:03, paused state and volume 0.5. Replay returned to an idle, silent gate. No warning/error logs. Screenshots: `qa/pixel-gate-desktop.png`, `qa/pixel-gate-mobile.png`.
