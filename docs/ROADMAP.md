# DarkwaveCode roadmap

## Stage 1 — Workbench foundation

**Status:** prototype ready for review.

- [x] Cyberpunk identity, responsive layout, dedicated full-height workbench page, custom scrollbar styling, and the original interactive GhostKernel Field canvas background.
- [x] Cybercore theme selection backed by the shared Cybergrid registry.
- [x] Resizable problem/editor layout with keyboard-accessible divider.
- [x] Starter templates, local debounced draft persistence, reset, and responsive layout.
- [x] Expanded language picker: 10 additional starter previews plus HTML/CSS; remaining requested runtimes are listed as planned and disabled.
- [x] GhostKernel device trace simulation with a clear safety boundary.
- [ ] Replace the textarea with CodeMirror 6 or Monaco after confirming bundle and keymap requirements.
- [ ] Add Vim/Emacs keymaps and accessible reduced-motion / contrast controls.
- [ ] Validate interaction and layouts at desktop, tablet, and phone sizes.

The enabled picker entries are editor templates only. The GhostKernel button still runs its bounded teaching simulation; it does not compile these languages. Runtime support must be tracked separately and enabled only after an isolated runner, pinned compiler version, and conformance tests are ready.

## Stage 2 — Playground

- Choose a production editor and support keyboard-first editing.
- Add input, output, user-authored test cases, import/export, and actionable diagnostics.
- Save drafts with a debounced browser backup and clear restore controls.
- Connect only to a separately isolated compiler service; enforce language allowlists, queue limits, CPU/memory/wall-clock limits, output caps, and abuse controls.
- Track runtime versions and test each enabled language before release.

## Stage 3 — Courses and accounts

- Start with JavaScript, Python, HTML/CSS, SQL, and Bash learning tracks.
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

## Release gates

- No real code execution on the website origin or on the visitor's host.
- Do not show a working installer command until its endpoint, integrity checks, and uninstall behavior exist.
- Do not imply Google sign-in, persistence sync, courses, hidden judging, ratings, or live execution exist until implemented and tested.
- Respect the visitor's Cybercore theme choice and reduced-motion setting.
