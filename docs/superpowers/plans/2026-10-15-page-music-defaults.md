# Start Screen and Page Music Plan

> Superseded music behavior: on 2026-10-16 the user removed chapter-specific defaults. See `2026-10-16-terminal-gate.md`; only initial random selection remains and page navigation preserves playback.

**Goal:** Add a minimal black start screen before the existing intro. Start a random song from silence on the start click, increase gain as SANITY approaches zero, and switch to each chapter's requested song after its artwork finishes assembling while its theme scene remains visible.

**Spec:** Latest user requests in this chat: no separate sound-enable control; centered “是否开启生命跃迁？” question and a style-matched button that grows and highlights on hover; existing loading, constellation and black-hole sequence follows. Preserve the requested default songs and revised playback timing.

**Architecture:** `start-gate.js` owns initial and replay entry. It waits for the music library, then starts audio synchronously in the click at zero gain and reveals the loader after a short fade. `music-defaults.js` handles exact filename selection, random choice and deferred requests. `intro.js` reports SANITY to the player's gain envelope. `chapters.js` calls `onSceneReady` after artwork assembly, then holds the theme for 800 ms before leaving. The first homepage arrival preserves the intro song; later entries use `content.musicDefaults`.

## Requirements

- Pure black gate with centered question and a fine gold manuscript-inspired circular start button. Hover/focus enlarges and illuminates it. No loading clock or audio runs before activation; no separate enable-sound button.
- Homepage/intro: random song. Fiction: Coldplay - The Scientist.mp3. Science fiction: 塞壬唱片-MSR, Crywolf - Somniomancer [null set].mp3. Arts: Kanye West - Come to Life.mp3. Daily: Frank Ocean - White Ferrari.mp3.
- Intro gain smoothly rises from zero at SANITY 999 to the user's chosen volume at SANITY 0. Maintain the same song through the star map, black hole and first homepage theme.
- Chapter song starts from zero after full assembly; the complete theme remains visible for 800 ms (100 ms in reduced-motion mode). Skipping settles the art before this callback.
- Missing defaults show the exact filename instead of silently choosing a different song. Empty mapping preserves playback; random chooses from the current playlist.
- Manual controls, MP3 metadata, lyrics and playlist continuation stay available. Replay pauses playback and returns to the gate.
- Editing guide explains exact filenames, defaults, refresh behavior and timing. No hosting work.

## Completed

- [x] Add default selection/controller and SANITY gain with meaningful unit tests.
- [x] Configure actual supplied tracks and connect intro and chapter timing.
- [x] Add independent start screen; remove sound-enable control; route replay through the gate.
- [x] Verify gate idle/silent state, click-to-load playback, continuous first-home song and all four chapter choices at the holding phase in the browser.
- [x] Update editing guide and README.
- [x] Complete responsive/focus checks and final regression checks.

Validation: syntax checks and all 32 tests pass. Browser confirms all four supplied chapter tracks begin while `data-phase="holding"`, after assembly and before the transition disappears. Desktop and 390 px mobile gate layouts fit; focus applies scale 1.12 and the same highlight as hover. Keyboard activation starts loading and playback; replay returns to the idle, silent gate. No browser warning/error logs were reported during the final flow.
