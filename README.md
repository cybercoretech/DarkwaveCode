# DarkwaveCode

DarkwaveCode is a cyberpunk coding workbench focused on learning, safe experimentation, and systems concepts. Its signature GhostKernel experience teaches kernel ideas through a deterministic simulated device, memory map, and syscall trace. It never executes kernel code on the visitor's host.

## Preview

This project includes dedicated `workbench.html`, `ghostkernel.html`, `docs.html`, `community.html`, `templates.html`, and `profile.html` pages, linked from the main navigation and home-page preview cards. The Docs Deck is a searchable, Cybercore-themed index for all 33 selectable languages: it launches DevDocs for the language docsets available there and official references for the others, in a new tab so the Workbench remains open. It links to upstream documentation rather than copying or rehosting it. The Workbench keeps all 33 language starters selectable with syntax highlighting and browser-local drafts. JavaScript, Python, Lua, and SQLite run in disposable browser sandboxes; the three-file HTML/CSS/JavaScript Web Studio has a responsive, network-restricted live preview. First use fetches pinned runtimes from jsDelivr while source code stays in the browser. Languages without a local or hosted runtime are clearly marked template-only. The Template Vault includes searchable starters, curated GhostKernel/input-output/browser Signal Packs, local custom templates, favorites, and JSON import/export. GhostKernel is a separate interactive systems lab with a virtual memory map, device state controls, and syscall event log. The site uses the Cybercore theme registry and the original GhostKernel Field background, with animated fibers and data motes that respond to pointer movement and taps. The field pauses in hidden tabs and honors reduced-motion preferences. Custom neon scrollbars complete the workbench styling. A Cloudflare sandbox runner implementation is in `runner/` and has passed local smoke tests, but its production endpoint remains unconfigured until its hosting backend is provisioned.

The account foundation uses a dedicated D1 database, server-side OAuth code flow with state and PKCE, email/password registration with ownership verification and recovery, revocable hashed sessions, and profile privacy settings. The profile editor includes 16 original neon SVG avatars, curated emoji signals, browser-resized profile photos, learning preferences, theme, and privacy controls. The verified site administrator has a private console for announcements, course/language visibility, aggregate analytics, site health, account suspensions, discussion reports/moderation, and an audit trail. The signed-in community lounge supports categorized topics, replies, reports, moderation locks, and hidden-content restoration. To activate account email on production, follow [the Cloudflare account and email setup guide](docs/accounts-and-email-setup.md) and add the email API token secret. The compiler curl installer remains a future deliverable.

The Workbench and Template Vault have 33 selectable editor templates, including Lua. MATLAB, Fortran, Visual Basic .NET, Objective-C, Delphi/Object Pascal, SAS, D, COBOL, and Mojo remain listed as planned. JavaScript, Python, Lua, SQLite, and HTML/CSS/JavaScript use browser-local runtimes; the remaining languages still need a compiler endpoint before they can run.

Serve this directory with any static HTTP server. The first production deployment is live at `https://darkwavecode.pages.dev`.

### Cloudflare Pages deployment

The current Pages project uses **Direct Upload**, so GitHub pushes need a CI job to publish the site. The workflow at `.github/workflows/pages-deploy.yml` applies pending D1 migrations and publishes on every push to `main` and on manual dispatch. Add `CLOUDFLARE_API_TOKEN` (account-scoped **Cloudflare Pages: Edit**), `CLOUDFLARE_D1_API_TOKEN` (account-scoped **D1: Edit**), and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions repository secrets. Separate narrowly scoped tokens handle deployment and schema updates. Cloudflare's native Git integration is a separate option and requires authorizing its GitHub App.

## Staged build plan

1. **Workbench design:** shipped with a resizable problem/editor split, Cybercore themes, and responsive layout; production editor and Vim/Emacs keymaps remain future work.
2. **Playground:** shipped with local drafts, stdin/stdout, a three-file browser preview, pinned browser runtimes for JavaScript, Python, Lua, and SQL, share/fork links, and local custom templates. Full compiler coverage and multi-language automated test cases remain future work.
3. **Courses and accounts:** five beginner tracks (JavaScript, Python, HTML/CSS, SQL, Bash) have three-lesson foundations, revealable hints, Workbench handoffs, and browser-local completion progress. Add Google sign-in and synced workspaces later.
4. **Judge:** run submissions against visible and hidden tests with CPU, memory, time, and output limits; add queueing and submission history. Keep the judge service isolated from the marketing site and user data.
5. **Contests and ratings:** add verified contests, standings, and rating changes only after judging is dependable. Practice runs never affect contest ratings.
6. **Language expansion:** enable more runtimes only after version, test-case, and performance checks. C and C++ are early systems/contest candidates; GhostKernel remains an explicitly simulated environment.

## Architecture decisions

- **Static frontend on Cloudflare Pages** under `darkwavecode.pages.dev`; add a custom domain after it is registered.
- **Browser-first workbench state** for drafts and preferences; account sync is a later opt-in capability.
- **Isolated runner service** separate from the static frontend. `runner/` implements a Cloudflare Worker + disposable Sandbox/Container backend with network egress disabled, fixed runtime commands, request throttling, code/stdin/output caps, and timeouts. It is not yet provisioned or connected to production. Cloudflare Pages alone is not a compiler sandbox.
- **GhostKernel simulator** is a deterministic teaching model with documented memory regions, device operations, syscall events, and bounded outputs. It does not load modules or interact with the host kernel.
- **Theme registry** uses Cybercore's shared Cybergrid palettes and stores each visitor's selected palette in browser storage.
- **Installer endpoint** is a future deliverable. The homepage's curl panel is illustrative and disabled until a signed, versioned installer exists.

## Current status

The browser-first workbench and starter course paths are live. JavaScript runs locally in a bounded browser worker; Python, Lua, and SQLite run in disposable sandbox frames, and Web Studio previews HTML/CSS/JS in a network-restricted iframe. Fourteen additional runtimes have passed local smoke tests in the runner image, but the remote service is not yet deployed or connected to production. Accounts, full judging, ratings, and an installer remain unimplemented. See `docs/ROADMAP.md` for acceptance criteria and milestone status.
