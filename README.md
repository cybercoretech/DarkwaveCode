# DarkwaveCode

DarkwaveCode is a cyberpunk coding workbench focused on learning, safe experimentation, and systems concepts. Its signature GhostKernel experience teaches kernel ideas through a deterministic simulated device, memory map, and syscall trace. It never executes kernel code on the visitor's host.

## Preview

This first static preview includes a responsive workbench, draggable problem/editor divider, language starter templates, local draft autosave, a simulated GhostKernel trace, and the Cybercore theme registry. The run button is a teaching simulation, not a compiler. Sign-in and the curl installer are intentionally marked as coming later.

Serve this directory with any static HTTP server. For Cloudflare Pages, use the `main` branch, root directory `/`, no build command, and output directory `/`. The planned Pages project name is `darkwavecode` (`darkwavecode.pages.dev`).

## Staged build plan

1. **Workbench design:** settle the interface, add a resizable problem/editor split, Cybercore themes, keyboard controls, and mobile behavior. This preview establishes the visual direction and initial interaction model.
2. **Playground:** add a production editor, language selection, templates, stdin/stdout, custom test cases, debounced local autosave, import/export, and clear compiler/runtime errors. Use an isolated execution service; never execute untrusted code in the page or a privileged Worker.
3. **Courses and accounts:** launch the five learning tracks (JavaScript, Python, HTML/CSS, SQL, Bash), add Google sign-in, saved workspaces, lesson progress, and practice exercises.
4. **Judge:** run submissions against visible and hidden tests with CPU, memory, time, and output limits; add queueing and submission history. Keep the judge service isolated from the marketing site and user data.
5. **Contests and ratings:** add verified contests, standings, and rating changes only after judging is dependable. Practice runs never affect contest ratings.
6. **Language expansion:** enable more runtimes only after version, test-case, and performance checks. C and C++ are early systems/contest candidates; GhostKernel remains an explicitly simulated environment.

## Architecture decisions

- **Static frontend on Cloudflare Pages** under `darkwavecode.pages.dev`; add a custom domain after it is registered.
- **Browser-first workbench state** for drafts and preferences; account sync is a later opt-in capability.
- **Isolated judge service** separate from the static frontend. Evaluate a maintained sandbox runner or dedicated container service before exposing arbitrary code execution. Cloudflare Pages alone is not a compiler sandbox.
- **GhostKernel simulator** is a deterministic teaching model with documented memory regions, device operations, syscall events, and bounded outputs. It does not load modules or interact with the host kernel.
- **Theme registry** uses Cybercore's shared Cybergrid palettes and stores each visitor's selected palette in browser storage.
- **Installer endpoint** is a future deliverable. The homepage's curl panel is illustrative and disabled until a signed, versioned installer exists.

## Current status

Stage 1 visual/workbench prototype is local and reviewable. Real compilation, accounts, courses, judging, ratings, and an installer remain unimplemented. See `docs/ROADMAP.md` for acceptance criteria and milestone status.
