# DarkwaveCode accounts, Google sign-in, and email

The account service is a same-origin Cloudflare Pages Function in `../_worker.js`. It uses a dedicated D1 database named `darkwavecode-accounts`, bound as `AUTH_DB`. Apply the migrations in `../migrations/` before deploying. The D1 database has been created in Cloudflare (WNAM); its binding is recorded in the root `wrangler.jsonc`.

## Google OAuth

Create or reuse a Google OAuth 2.0 **Web application** client. Add this exact authorized redirect URI:

```text
https://darkwavecode.pages.dev/api/auth/google/callback
```

In the Cloudflare Pages project `darkwavecode`, set these encrypted Production secrets under **Settings → Variables and Secrets**:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

The client secret must stay in Cloudflare and must never be added to this repository. Google sign-in uses a server-side authorization-code flow with state and PKCE, verifies the returned Google user through the OpenID Connect userinfo endpoint, and saves no Google access token. To link Google to an existing email account, first sign in with that account and then choose **Link your Google account** on this page.

## Email verification and recovery

Email/password accounts require ownership verification before sign-in. The service sends verification links and password-reset links from `darkwavecode@cybercoretech.net`. Resend verification and recovery responses avoid revealing whether an address has an account. Passwords are PBKDF2-SHA256 hashed with per-account random salts; sessions and one-time links are stored only as SHA-256 hashes. Sessions use `HttpOnly`, `Secure`, `SameSite=Lax` cookies and expire after 30 days. One-time links expire after 24 hours.

Cloudflare Pages Functions do not list the Email Service `send_email` binding among supported Pages bindings. This Pages Function therefore uses the Cloudflare Email Sending REST API. Before enabling email registration, the owner needs to:

1. In Cloudflare, open **Compute → Email Service → Email Sending** and onboard `cybercoretech.net`. This requires the domain to use Cloudflare DNS and to publish the SPF, DKIM, DMARC, and bounce records Cloudflare provides.
2. Create a Cloudflare API token scoped to the account with **Email Sending: Edit** permission.
3. Save this value as an encrypted Production secret on the `darkwavecode` Pages project (`CF_ACCOUNT_ID` is already configured as a non-secret variable in `wrangler.jsonc`):

```text
CF_EMAIL_API_TOKEN
```

The account ID is the Cloudflare account that owns both the Pages project and the onboarded sending domain. Do not commit the API token. Email registration remains unavailable until the sender domain and API credentials are ready; Google sign-in can be enabled independently.

## Deploy

This Pages project uses Direct Upload. Wrangler supports the `_worker.js` advanced-mode Worker for Direct Upload; dashboard drag-and-drop does not compile a `functions/` folder. With the secrets in place, apply the migration if needed and deploy from the project root:

```sh
node /path/to/wrangler/bin/wrangler.js d1 migrations apply darkwavecode-accounts --remote
node /path/to/wrangler/bin/wrangler.js pages deploy . --project-name darkwavecode --branch main
```

`wrangler.jsonc` binds `AUTH_DB` and makes the advanced-mode Pages configuration explicit. Verify `/api/auth/status`, Google sign-in, account registration, verification email, password recovery, sign-out, profile save/reload, and profile visibility after deployment. Use a controlled test inbox before inviting users.

## Automatic deployment from GitHub

The GitHub Actions workflow `.github/workflows/pages-deploy.yml` applies pending D1 migrations and publishes the Direct Upload project on every push to `main`. Keep the Cloudflare permissions split into two narrowly scoped tokens. Add these repository secrets at **Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN`: an account API token with **Cloudflare Pages: Edit**, scoped to the account hosting this project.
- `CLOUDFLARE_D1_API_TOKEN`: an account API token with **D1: Edit**, scoped to the account hosting this project.
- `CLOUDFLARE_ACCOUNT_ID`: `f770e07e62b976b12330421edcf2a7d9`.

The token is intentionally not stored in the repository or in the workflow. Until both secrets exist, GitHub Actions cannot deploy. Cloudflare's official guide describes this Direct Upload CI setup: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/.

## Admin console and telemetry

The private `admin.html` console is available only to the verified Google account whose email matches the Cloudflare `ADMIN_EMAIL` setting. It manages a site-wide announcement, course and Workbench language visibility, member suspensions and restoration, discussion reports and hidden content, and an append-only admin audit trail. Suspensions revoke active sessions immediately and can be timed or permanent. Community members can create topics, reply, and report posts.

First-party telemetry is aggregated by UTC day and category. It records page slug, language selected for a code run, run success, bounded elapsed time, and completed learning tracks. It never records source code, profile handles, email addresses, or raw IP addresses. Anonymous aggregate telemetry is disclosed in the site footer.

## User profile fields

Profiles support a unique handle, display name, 400-character bio, favorite language, experience level, Cybercore theme, public/member/private visibility, activity visibility, and optional release emails. Email and Google identity are private. Avatars include 16 original SVG portraits, curated emoji signals, and a browser-resized PNG/JPEG/WebP upload. The verified site administrator sees a `SITE ADMIN` marker and a private console shortcut on the profile page.
