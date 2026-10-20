# DarkwaveCode

DarkwaveCode is a cyberpunk coding workbench focused on learning, safe experimentation, and systems concepts. Its signature GhostKernel experience teaches kernel ideas through a deterministic simulated device, memory map, and syscall trace. It never executes kernel code on the visitor's host.

## Preview

This static preview includes dedicated `workbench.html` and `ghostkernel.html` pages, linked from the main navigation and home-page preview cards. The workbench provides a draggable problem/editor divider, 33 language starter templates, local draft autosave, a bounded local JavaScript sandbox, and clear template-only messaging for unsupported runtimes. GhostKernel is a separate interactive systems lab with a virtual memory map, device state controls, and syscall event log. Both pages use the Cybercore theme registry and the original GhostKernel Field background, with animated fibers and data motes that respond to pointer movement and taps. The field pauses in hidden tabs and honors reduced-motion preferences. Custom neon scrollbars complete the workbench styling. JavaScript runs in a sandboxed browser worker with a time limit and output cap; the other language choices are templates only, not compilers. Sign-in and the curl installer are intentionally marked as coming later.

The language picker now has 33 selectable editor templates. Alongside the original set, it includes HTML/CSS, C#, PowerShell, PHP, Kotlin, Lua, Assembly, Swift, Ruby, Dart, R, Zig, Scala, Julia, Perl, Haskell, Clojure, Crystal, Elixir, Elm, Erlang, Groovy, and PureScript. MATLAB, Fortran, Visual Basic .NET, Objective-C, Delphi/Object Pascal, SAS, D, COBOL, and Mojo remain listed as planned. These entries provide starter code only; they are not executable runtimes.

Serve this directory with any static HTTP server. The first production deployment is live at `https://darkwavecode.pages.dev`.

### Cloudflare Pages deployment

The current Pages project uses **Direct Upload**. With Wrangler installed and authenticated, deploy updates from this checkout with:

```sh
wrangler pages deploy . --project-name darkwavecode --branch main
```

Direct Upload does not automatically deploy GitHub pushes. Cloudflare does not allow converting this project to Git integration later; automatic GitHub deployments would require a separate Git-integrated Pages project. The current Pages project is already configured with `main` as its production branch label.

## Staged build plan

1. **Workbench design:** settle the interface, add a resizable problem/editor split, Cybercore themes, keyboard controls, and mobile behavior. This preview establishes the visual direction and initial interaction model.
2. **Playground:** add a production editor, language selection, templates, stdin/stdout, custom test cases, debounced local autosave, import/export, and clear compiler/runtime errors. Use an isolated execution service; never execute untrusted code in the page or a privileged Worker.
3. **Courses and accounts:** five beginner tracks (JavaScript, Python, HTML/CSS, SQL, Bash) now have linked three-lesson foundations and browser-local completion progress. Add Google sign-in and synced workspaces later.
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

The workbench foundation and starter course paths are live. The JavaScript sandbox runs only JavaScript in a bounded browser worker; native compilers, accounts, judging, ratings, and an installer remain unimplemented. See `docs/ROADMAP.md` for acceptance criteria and milestone status.
