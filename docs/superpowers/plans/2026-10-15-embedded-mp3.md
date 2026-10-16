# Embedded MP3 Artwork and Lyrics Implementation Plan

**Goal:** Add MP3 files without manually entering artwork/title/lyrics and show synchronized or plain embedded lyrics in the existing music drawer.

**Architecture:** Use the maintained `music-metadata` parser in Node and a locally bundled browser build. Discover MP3s from `public/assets/music/` on request, cache tag results by file size/mtime, and serve embedded cover bytes through a restricted music API. A shared pure normalizer converts tag metadata to display fields and lyric lines. Add an MP3 file picker for browser-only listening; keep configured tracks and a single persistent audio element.

**Spec:** User's follow-up asks to set hosting aside, recognize embedded MP3 covers/lyrics, directly add MP3s, and display lyrics.

**Files:** `music-library.mjs`, `public/music-metadata.js`, `public/music.js`, `public/music.css`, `public/index.html`, `server.mjs`, browser vendor bundle/build script, metadata/API tests, editing guide and README.

## Requirements and Review Focus

- Dropping MP3s into the music folder and refreshing discovers them without editing `content.js`; retain explicit configuration overrides and order.
- The file picker supports multiple files and local listening without uploading files. Clearly describe that browser-picked files are for this session; music-folder files remain available after refresh.
- Read ID3 text and attached cover, timed SYLT / embedded LRC and plain USLT; never fabricate missing lyrics or timing. Render tag strings with textContent.
- Cover fallbacks and malformed tags must not prevent playable audio. Handle no tags, Chinese filenames, duplicate tracks and missing directory.
- Prefer timed lyrics over plain text; update active lines on playback/seek, allow manual scroll without page jumps, and reset lyrics immediately on track changes.
- Retain playback through chapter transitions, drawer hover/touch/keyboard behavior, stable gutters and a panel that fits narrow/short viewports.
- Cached metadata refreshes for replaced files; cover API must not read arbitrary server files. No public upload API.

## Tasks

- [x] Install parser and build local browser bundle with its license; add shared normalization and real encoded-tag fixtures/tests.
- [x] Add restricted library/cover API and metadata cache; test discovery, changed files, covers, malformed files, missing directory and path access.
- [x] Extend player with dynamic library discovery, file picker, metadata loading and lyric display/follow mode while keeping playback controls intact.
- [x] Update guide with folder and picker workflows, run syntax/regression tests and desktop/mobile UI verification with an actual tagged test MP3, remove temporary tracks and retain screenshots.

**Validation:** Syntax check and all 28 Node tests passed. Encoded ID3v2.2/v2.3/v2.4 fixtures verify UTF-16/UTF-8 Chinese text, APIC/PIC covers, USLT plain/LRC and SYLT timing; tests cover LRC ordering/offsets, seek lookup, missing tags, unsafe cover formats, cache invalidation, missing folders, restricted cover access, playlist deduplication and explicit overrides. Browser verified real MP3 playback, time-based highlighting at 0:07, lyric-click seeking to 0:30 without changing main page position, ordinary/no-lyric transitions, file-chooser import with browser-local cover URL, manual scrolling/follow recovery, and mobile layout (375px content width, no overflow, panel bottom 820px in an 844px viewport). Temporary public test tracks removed. Screenshots: `qa/mp3-lyrics-desktop.png`, `qa/mp3-lyrics-mobile.png`.

Implement directly in the existing local checkout. No hosting, publication or account actions are part of this request.
