# DarkwaveCode roadmap

## Stage 1 — Workbench foundation

**Status:** browser-first workbench foundation shipped.

- [x] Cyberpunk identity, responsive layout, dedicated full-height Workbench and interactive GhostKernel lab pages, home-page preview panels, custom scrollbar styling, and the original interactive GhostKernel Field background.
- [x] Cybercore theme selection backed by the shared Cybergrid registry.
- [x] Resizable problem/editor layout with keyboard-accessible divider.
- [x] Starter templates, per-language local drafts, stdin autosave, reset, and responsive layout. JavaScript runs in a bounded worker; Python, Lua, and SQLite run in disposable browser sandboxes.
- [x] Three-file HTML/CSS/JavaScript Web Studio with a sandboxed live preview, viewport presets, console output, and browser-error reporting.
- [x] First-run runtime downloads are version-pinned and lazy-loaded. Source code stays in the browser; execution telemetry records only language, outcome, and duration.
- [x] Keep all 33 language starters selectable in the Workbench and Template Vault, including Lua.
- [x] GhostKernel interactive virtual memory inspector, simulated device controls, syscall trace, and clear safety boundary.
- [ ] Replace the textarea with CodeMirror 6 or Monaco after confirming bundle and keymap requirements.
- [ ] Add Vim/Emacs keymaps and accessible reduced-motion / contrast controls.
- [ ] Validate interaction and layouts at desktop, tablet, and phone sizes.

The 33-entry language shelf remains available. JavaScript, HTML/CSS/JavaScript, Python, Lua, and SQLite have browser-local execution paths; the other languages remain editable templates and report that no runtime is connected. These browser runtimes are not native compilers or a judge. GhostKernel remains its own deterministic systems simulator. Native compiler support must be tracked separately and enabled only after an isolated runner, pinned compiler version, and conformance tests are ready.

## Stage 2 — Playground

**Browser-first foundations shipped; account sync and hosted compilation remain deferred.**

- [x] Add a themed Docs Deck with searchable references for all 33 Workbench languages; open DevDocs when a docset is available and official references otherwise, in a new browser tab.

- [x] Keep the editable language shelf, syntax highlighting, local drafts, stdin/stdout, reset, and actionable runtime-unavailable messages.
- [x] Add a three-file web editor and responsive local preview with a restricted iframe and console.
- [x] Add browser-local Python, Lua, and SQLite execution with time/output caps.
- [x] Add a share/fork link that embeds code only after the user clicks Share, plus a one-click save into the private local Template Vault; existing template JSON import/export remains available.
- [ ] Choose a production editor and support Vim/Emacs keymaps.
- [ ] Add user-authored test cases and test reports for all browser runtimes.
- [ ] Add opt-in account sync for workspaces and templates.
- Connect only to a separately isolated compiler service; enforce language allowlists, queue limits, CPU/memory/wall-clock limits, output caps, and abuse controls.
- Track runtime versions and test each enabled language before release.

## Stage 3 — Courses and accounts

**Foundation paths shipped:** the five homepage cards link to JavaScript, Python, HTML/CSS, SQL, and Bash tracks. Each has three beginner lessons, examples, practice prompts, revealable field hints, navigation, and progress saved in browser storage. Lessons can load their starter into the Workbench. JavaScript, Python, HTML/CSS, and SQL examples can run locally; Bash lessons remain instructional because no shell runtime is installed.

- Expand the JavaScript, Python, HTML/CSS, SQL, and Bash foundation paths with verified exercises and feedback.
- Use Google OAuth through a server-side session flow; never expose client secrets.
- Save workspaces and progress only after explicit account sign-in, with local drafts remaining usable without an account.
- Add lessons, runnable examples, hints, and practice exercises.

## Stage 4 — Judge

- Add visible/hidden test evaluation, resource limits, output caps, a bounded queue, and submission history.
- Verify sandbox escape resistance and isolation before accepting public untrusted code.
- Preserve source privacy and define retention before launching accounts or submissions.

## Stage 5 — Contests and ratings

- Add contest scheduling, standings, rating changes, and anti-abuse review after judge reliability is proven.
- Keep practice separate from rated submissions and publish rating rules.

## Stage 6 — Runtime expansion

- Add languages one at a time after compiler version pinning and conformance, correctness, and performance checks.
- Consider C/C++ early for systems work, then prioritize additional runtimes based on learner demand and safe runner coverage.

## Browser-runtime boundaries

- Python uses a pinned Pyodide runtime; Lua uses Fengari; SQL uses sql.js/SQLite. They are fetched from jsDelivr only when first selected and run inside disposable sandbox frames. The first Python startup can take longer and download more than the other runtimes. Python package coverage differs from desktop Python; Lua does not currently read stdin; SQL starts with a small Harrow Point `locations` sample database and resets on each run.
- Runtime downloads reach the CDN, but DarkwaveCode does not upload source code to those runtime vendors. User code can still be sensitive: share links intentionally include code in the URL fragment and anyone holding a link can read it. Preview and runtime frames have no site-origin access; preview network access is disabled and output/time limits apply.
- Runtime availability may be affected by content blockers or network policy. A failed download reports an error while local drafts remain saved.

## Release gates

- Keep user code inside sandboxed browser frames/workers; native compilers require an isolated service. Never run code on the site origin or privileged Cloudflare Worker.
- Do not show a working installer command until its endpoint, integrity checks, and uninstall behavior exist.
- Do not imply Google sign-in, account sync, hidden judging, ratings, or native multi-language compilation exist until implemented and tested. The browser-local JavaScript runner is limited and is not a substitute for a server-side judge.
- Respect the visitor's Cybercore theme choice and reduced-motion setting.
