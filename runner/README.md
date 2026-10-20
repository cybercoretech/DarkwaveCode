# DarkwaveCode isolated compiler

This Worker is the remote execution backend for the Workbench. It creates a
fresh Cloudflare Sandbox for each run, disables network egress, applies a
per-IP run limit, caps submitted source and output, and destroys the sandbox
afterward.

The first release supports JavaScript, TypeScript, Python, C, C++, Rust, Go,
Java, Bash, SQLite SQL, Perl, Erlang, Lua, and Ruby. The browser runs
JavaScript in its existing local iframe sandbox; the other listed runtimes run
in Cloudflare Containers. Unsupported language templates remain disabled in
the Workbench.

## Deploy

Enable Workers Paid and Containers usage for the Cloudflare account, then run
`npm install` and `npx wrangler deploy` from this directory with Docker
available. Wrangler builds and uploads the image as part of deployment.
After deployment, set `window.DARKWAVE_RUNNER.url` in the parent
`runner-config.js` to the Worker URL Wrangler prints, then deploy the Pages
site. The browser uses `/v1/runtimes` to determine which language options to
enable.

The Workbench is intentionally left unconfigured until the Worker deploys;
it will continue to run local JavaScript and disable remote languages rather
than sending code to a missing endpoint.

## Verify

From the project root, run `python3 tools/smoke-runtimes.py` to compile or
execute harmless Hello World programs for locally installed runtimes. From
this directory, run `npm test` to check the runtime command definitions.

The Cloudflare Sandbox SDK is currently a preview package. Recheck its SDK
and Containers deployment guidance before upgrading the pinned dependency.
