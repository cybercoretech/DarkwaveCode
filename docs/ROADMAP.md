# DarkwaveCode roadmap

## Stage 1 — Workbench foundation

**Status:** prototype ready for review.

- [x] Cyberpunk identity, responsive layout, dedicated full-height Workbench and interactive GhostKernel lab pages, home-page preview panels, custom scrollbar styling, and the original interactive GhostKernel Field background.
- [x] Cybercore theme selection backed by the shared Cybergrid registry.
- [x] Resizable problem/editor layout with keyboard-accessible divider.
- [x] Starter templates, local debounced draft persistence, reset, and responsive layout. JavaScript has a bounded local worker runner; other language selections clearly report that no runtime is connected.
- [x] Expanded language picker: 33 selectable starter templates, including Zig, Scala, Julia, Perl, Haskell, Clojure, Crystal, Elixir, Elm, Erlang, Groovy, and PureScript; other requested languages remain listed as planned.
- [x] GhostKernel interactive virtual memory inspector, simulated device controls, syscall trace, and clear safety boundary.
- [ ] Replace the textarea with CodeMirror 6 or Monaco after confirming bundle and keymap requirements.
- [ ] Add Vim/Emacs keymaps and accessible reduced-motion / contrast controls.
- [ ] Validate interaction and layouts at desktop, tablet, and phone sizes.

The enabled picker entries are editor templates only. GhostKernel remains its own deterministic systems simulator. The Workbench runs JavaScript in a sandboxed browser worker with an execution timeout and output cap. All other language entries remain templates and report that no runtime is connected. Native compiler support must be tracked separately and enabled only after an isolated runner, pinned compiler version, and conformance tests are ready.

## Stage 2 — Playground

- Choose a production editor and support keyboard-first editing.
- Add input, output, user-authored test cases, import/export, and actionable diagnostics.
- Save drafts with a debounced browser backup and clear restore controls.
- Connect only to a separately isolated compiler service; enforce language allowlists, queue limits, CPU/memory/wall-clock limits, output caps, and abuse controls.
- Track runtime versions and test each enabled language before release.

## Stage 3 — Courses and accounts

**Foundation paths shipped:** the five homepage cards link to JavaScript, Python, HTML/CSS, SQL, and Bash tracks. Each has three beginner lessons, examples, a small practice prompt, lesson navigation, and progress saved in browser storage. Examples are instructional; non-JavaScript languages do not run in the Workbench.

- Expand the JavaScript, Python, HTML/CSS, SQL, and Bash foundation paths with exercises and feedback.
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

- Keep user code inside the sandboxed browser worker; native compilers require an isolated service. Never run code on the site origin or privileged Cloudflare Worker.
- Do not show a working installer command until its endpoint, integrity checks, and uninstall behavior exist.
- Do not imply Google sign-in, account sync, hidden judging, ratings, or native multi-language compilation exist until implemented and tested. The browser-local JavaScript runner is limited and is not a substitute for a server-side judge.
- Respect the visitor's Cybercore theme choice and reduced-motion setting.
