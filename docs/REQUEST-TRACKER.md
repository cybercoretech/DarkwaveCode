# DarkwaveCode request tracker

This file tracks the current Workbench follow-up and preserves the earlier language-shelf decision.

## Browser-first Workbench follow-up

- [x] Build a three-file HTML/CSS/JavaScript editor with an isolated responsive preview, viewport presets, and console/error output.
- [x] Add local Python, Lua, and SQLite runtimes without provisioning a compiler server. Keep the 33-language shelf; label languages without execution support as templates.
- [x] Expand the five foundation tracks with revealable hints, lesson-to-Workbench handoff, and local progress.
- [x] Add explicit Share / Fork links and one-click save into the local Template Vault. Existing JSON import/export remains available.
- [x] Test JavaScript, Python with stdin, Lua, SQLite query output, and the Web Studio in Chromium.
- [x] Preserve the full 33-language template shelf, including Lua, from the preceding request.

## Boundaries and later work

- Browser runtimes download pinned Pyodide, Fengari, and sql.js assets lazily from jsDelivr. Source remains in the browser; these features do not provide native compilation, hidden tests, or contest judging.
- Python package availability differs from desktop Python; Lua does not yet consume stdin; SQL uses a small in-memory Harrow Point sample database that resets per run. Browser storage and course progress do not sync across devices.
- Remaining language runtimes, account-synced workspaces, automated lesson tests, and a hosted compiler service remain future work. A compiler backend was deferred to avoid recurring server cost.
