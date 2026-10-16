# Music Sidebar and Stable Chapter Layout Implementation Plan

**Goal:** Add a hidden left music drawer configured by audio/title/cover, and eliminate horizontal movement when chapter scroll locks end.

**Architecture:** Use a single persistent HTMLAudioElement and an independent drawer module inside the existing site. Keep tracks in `content.music`, preserve playback through chapter changes, and use a stable root scrollbar gutter so the overlay and settled hero share their geometry. Serve audio with correct MIME types and byte ranges for seeking.

**Tech Stack:** Existing buildless HTML/CSS/JavaScript and Node HTTP server; no new runtime dependency.

**Spec:** User's 2026-10-15 music sidebar and animation flash follow-up in this chat.

## Constraints and Review Focus

- Pure black, manuscript ornament, subdued gold; no external audio or autoplay.
- Music items need only `src`, `title`, `cover`; start with an honest empty state because no song was supplied.
- Pointer hover opens the left edge; keyboard and touch have a toggle and Escape closes it.
- Empty playlists, unavailable audio, invalid duration and rejected play promises leave useful controls/status.
- Track changes, seek and volume update the same audio element; chapter navigation must not recreate it.
- Scroll locks, short/long pages, dialog opening and viewport units must keep horizontal positions stable.

## Tasks

- [x] Add `public/music.js`, `public/music.css`, markup, `content.music`, and an original SVG fallback cover. Verify empty, loaded, playing, paused, seek, track switch, and failure states in the browser.
- [x] Add audio MIME and streamed byte-range responses in `server.mjs`; test full, partial, suffix, invalid, and HEAD requests with Node tests.
- [x] Reserve scrollbar width in `public/styles.css`; use container width for chapter animation art in `public/chapters.css`. Compare root/header/hero positions while scroll is locked and after release, also with a dialog open.
- [x] Add music editing examples to `内容编辑指南.md`, update README and syntax checks; run regression tests and desktop/mobile UI checks, then retain screenshots.

**Validation:** Syntax checks and all 20 Node tests passed. The original header width changed from 1280px while locked to 1264.67px after scroll release. It now remains 1264.67px during intro, chapter transitions, settled chapters, and the open work dialog. A temporary WAV playlist verified title/cover metadata, playback, pause, seek, volume, switching tracks, continuing through chapter changes, automatic advance at the end, missing-file feedback, cover fallback and Escape closing. Mobile panel fits within a 390px viewport without horizontal overflow; temporary viewport reset. Temporary playlist and audio removed after verification; production starts empty. Browser screenshots saved in `qa/music-*.png`.

Implement directly in this session within the user's authorized local changes. No repository exists, so no commits are required.
