# 我于万物中 Implementation Plan

> **For agentic workers:** Execute the following tasks in order in the current session. The user has requested implementation directly.

**Goal:** Build a local image-and-text portfolio with the requested entrance sequence and shared anonymous comments.

**Architecture:** Dependency-free HTML/CSS/JavaScript, a canvas entrance scene, and a Node HTTP server. A single content file defines four navigation labels, five loading messages, artwork content and per-work comment availability. Comments persist in a private JSON file with serialized, atomic writes. The entrance and main page both use a pure black background per the user's follow-up.

**Tech Stack:** Modern browsers, Node.js built-ins, Canvas 2D, CSS, local font assets.

**Spec:** The six requirements and two images in the user's message on 2026-10-14.

## Global Constraints

- Local implementation only; no publishing.
- Exactly four top navigation items with editable placeholder titles and frosted glass styling.
- Black entrance background, two progress bars, no server label or central reference lines.
- Brain nodes/edges light in ten 10% increments, with five text phases at 20% intervals.
- Completed brain expands into a full-screen star map; calligraphic Chinese and Italian site titles appear.
- Wait for click before a central expanding black-hole distortion transitions into the main page.
- Every enabled work accepts an anonymous name and message and stores comments across visitors and restarts.

## Review Focus

- Small screens: cards, navigation, title and comment dialog stay usable at 390px width.
- Input containing HTML: render names/messages as text, never executable markup.
- Simultaneous submissions: retain both records without overwriting.
- Restart: reload saved comments from disk.
- Keyboard and reduced motion: support Enter/Space, dialog focus, Escape, and a shorter quiet entrance.

## Task 1: Local service and editable content

**Files:** `package.json`, `server.mjs`, `public/content.js`, `tests/server.test.mjs`, `README.md`, `start.cmd`.

**Interfaces:** `GET /api/comments/:workId -> {comments: []}`; `POST /api/comments/:workId {name,message} -> {comment}`; `createApp({dataFile}) -> http.Server` for tests.

- [x] Implement static serving and comment validation/persistence without dependencies.
- [x] Add six clearly marked illustrative works, four editable tabs, five editable loading strings, and per-work `commentsEnabled`.
- [x] Verify comment persistence, invalid inputs, concurrent writes, disabled comments, and private-file isolation using `node --test`.

## Task 2: Gallery and work reader

**Files:** `public/index.html`, `public/styles.css`, `public/app.js`, `public/assets/*.svg`.

**Interfaces:** Content imports from `content.js`; `showGallery()` reveals the application after the entrance.

- [x] Implement responsive three-column artwork cards and sticky translucent navigation.
- [x] Implement tab filtering, work detail dialog and enabled comment forms with readable feedback.
- [x] Use text nodes for all visitor input and restore focus on dialog close.

## Task 3: Entrance sequence

**Files:** `public/intro.js`, `public/assets/fonts/*`.

**Interfaces:** `initIntro({content,onEnter}) -> {replay}` drives canvas and DOM states: loading, morphing, ready, entering, complete.

- [x] Draw a bilateral point-and-line brain; discretely activate ten regions while side bars advance.
- [x] Interpolate the brain into a full viewport constellation map, fade in both calligraphic names and await deliberate activation.
- [x] Render a growing central gravitational lens with warped rays, star orbits and expanding darkness, then reveal the gallery.
- [x] Support replay, viewport resizing, keyboard entry and reduced motion.

## Task 4: Verify and deliver

- [x] Run syntax checks and service tests.
- [x] Inspect loading, ready, entering, gallery and comment states in a browser.
- [x] Check a 390px screen, persistent comments and dialog keyboard controls.
- [x] Document local startup and content editing, leave a working preview available.
