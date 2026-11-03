# TRIAL.md — Making and Publishing an Original Game on Arcadible

## Summary
- **Game:** **Chrono Prism** (`chrono-prism`, ID `7a4e8c92-3b1d-4f6a-9e2c-8d5f1a3b7c04`, version `0.1.1`)
- **Store Page (Public):** https://arcadible.com/play/chrono-prism
- **Play URL (Production):** https://play.arcadible.com/chrono-prism/
- **Play URL (Staging):** https://play.arcadible.com/chrono-prism:staging/
- **Developer Profile (Public):** https://arcadible.com/@gemini
- **GitHub Repository (Public):** https://github.com/games-by-gemini/chrono-prism

---

## 1. Initial Exploration
- **What I did:**
  - Inspected the environment variables (`ARCADIBLE_EMAIL`, `ARCADIBLE_PASSWORD`, `AGENTMAIL_API_KEY`, `GH_TOKEN`), available CLI binaries (`gh`, `git`, `node`, `npm`, `npx`, `python3`, `curl`), and `~/.gitconfig`.
  - Found `ARCADIBLE_EMAIL=gba-gemini@agentmail.to` and `.gitconfig` user `Gemini <gemini@agents.arcadible.com>`.
- **Where I had to guess:**
  - The prompt mentions "Arcadible" without a URL and no `arcadible` CLI binary was pre-installed. Based on `.gitconfig` (`gemini@agents.arcadible.com`), I guessed that Arcadible is hosted at `https://arcadible.com` and that `TRIAL.md` should be placed in `/home/agent/game/TRIAL.md` (and committed to the repository).

## 2. Discovering Arcadible Documentation & Installing the CLI
- **What I did:**
  - Fetched `https://arcadible.com` and found footer links to `https://studio.arcadible.com/` and `https://developer.arcadible.com/getting-started`.
  - Read the developer documentation (`getting-started`, `references/arcadible-cli`, `build/ai-agents`, `build/best-practices`, `build/runtime-limitations`, `build/saves`, `references/arcadible-manifest`, `references/arcadible-markdown`, `references/arcadible-sdk`, `publish/store-page`, `publish/going-public`, `publish/deploying-from-github`, `studio`, and `studio/games`).
  - Installed `arcadible` (`1.0.12`) globally via `npm install -g arcadible`, which placed `arc` and its subcommands in `/home/agent/.npm-global/bin` (already on `PATH` per `~/.npmrc`).
  - Discovered that `arc --version`, `arc -v`, `arc -h`, and bare `arc` all fail with:
    `Command aborted. Unable to find: /home/agent/.npm-global/bin/arc-default`
    even though the Getting Started guide instructs running `arc --version` and `references/arcadible-cli/arc` states that running `arc` with no command prints the command list.
- **Where I had to guess:**
  - Because `arc --version` and `arc -h` failed looking for `arc-default`, I had to guess that `arc` dispatches to `arc-<subcommand>` binaries and pass `-v` / `-h` to an explicit subcommand (`arc whoami -v` -> `1.0.12`, `arc init -h`).

## 3. Authenticating `arc login` and Checking AgentMail & GitHub
- **What I did:**
  - Checked the AgentMail API (`https://api.agentmail.to/v0/inboxes` and `/v0/inboxes/gba-gemini@agentmail.to/messages`) using `Authorization: Bearer $AGENTMAIL_API_KEY`; verified the inbox `gba-gemini@agentmail.to` exists.
  - Checked the `games-by-gemini` GitHub organization via `gh repo list games-by-gemini` and confirmed it started empty.
  - Checked `https://arcadible.com/@gemini` and confirmed the account exists (`Gemini (@gemini)` with homepage `https://github.com/games-by-gemini`, initially `Unlisted` with no games).
  - Ran `arc login --no-browser --no-qrcode`, which printed `https://account.arcadible.com/link` and an 8-character device code (`XXXX-XXXX`).
  - Automated the web device-link flow over HTTP: first submitted the `dac` device code and `csrf` token to `POST https://account.arcadible.com/link`, which stored `link_credential` in the `app-session` cookie and redirected to `https://account.arcadible.com/login`; then submitted `email` (`$ARCADIBLE_EMAIL`), `password` (`$ARCADIBLE_PASSWORD`), and `csrf` to `POST https://account.arcadible.com/login`.
  - Verified with `arc whoami --json` that the CLI authenticated as `gba-gemini@agentmail.to` (`id: e1b9746c-4c84-4930-9a9e-b1d2d21882f4`) and stored credentials in `~/.config/arc/account.json`.
- **Where I had to guess:**
  - `arc login` only supports interactive browser/device-code login (`https://account.arcadible.com/link`) with no CLI flags for email/password or non-interactive token input. I had to inspect the HTML forms on `account.arcadible.com/link` and `account.arcadible.com/login` to complete the device authorization flow programmatically.
  - Initially I logged in to `/login` first and then posted to `/link`, which redirected back to `/login` without completing the link because `/login` had redirected to `arcadible.com` and cleared the login state on `account.arcadible.com`. I had to guess/discover that submitting the device code to `/link` *first* sets `link_credential` in the session cookie and redirects to `/login`, and logging in from that redirect completes the device link.
  - For AgentMail, no base URL or documentation was provided in the prompt, so I had to guess the API endpoint `https://api.agentmail.to/v0/inboxes` based on the email domain `agentmail.to`.

## 4. Designing and Building `Chrono Prism` & Store Assets
- **What I did:**
  - Initialized the Git repository in `/home/agent/game` and configured `arcadible.toml` (`id = "7a4e8c92-3b1d-4f6a-9e2c-8d5f1a3b7c04"`, `handle = "chrono-prism"`, `genres = ["puzzle", "arcade", "action"]`, `audience = "everyone"`, `ai = "generative"`, `orientation = "landscape"`, `inputs = ["keyboard", "mouse", "gamepad", "touch"]`).
  - Wrote the store page in `README.md` adhering to Arcadible Markdown rules (`# Chrono Prism`, banner image, `## Bend light. Rewind time.`, plain-text bio under 180 chars, and description enclosed between `---` separators using only allowed HTML/Markdown elements).
  - Implemented **Chrono Prism** in `.arcadible-public/index.html` and `.arcadible-public/main.js`:
    - 12 hand-crafted solvable optical-temporal sectors plus a procedural **Endless Flux Mode**.
    - Raycast laser optics with Redirect Prisms, Beam Splitters, Chromatic Splitters (splitting white light into cyan + magenta), Gold Shifters, and Phase Pads/Gates.
    - **Chrono Rewind** mechanic that rewinds 5 seconds and spawns up to 2 simultaneous **Time Echo** clones that replay movement and prism rotations and hold Phase Pads open.
    - Full support for Keyboard, Mouse, Gamepad, and Touch (with dynamic input prompts and >=56px touch buttons inside safe-area insets).
    - Web Audio API procedural synthesizer that unlocks on the first gesture and suspends on `visibilitychange` / `blur`.
    - Persistent save integration via the hosted Arcadible SDK (`/arcadible/sdk/v1.js`, `window.arcadible.saves`) with schema versioning, read-before-write merging, memory-only mode notice, and transient error retry.
  - Created `scripts/generate-assets.mjs` to render all required `.arcadible/` store assets (`icon.png` 1024×1024, `cover.png` 1536×1024, `banner.png` 2048×1024, `poster.png` 1024×1536, `splash.png` 1920×1080) and `.arcadible/gallery/` screenshots (`screenshot_01..03.png` at 1920×1080 and `screenshot_01..03_phone.png` at 1080×1920).
  - Created `scripts/test-game.mjs` to simulate and verify the solvability of all 12 sectors and run `arc validate --json` and `arc inspect --json`, confirming `{"issues": [], "warnings": []}`.
- **Where I had to guess:**
  - **AI disclosure (`ai = "generative"` vs `"unused"`):** The docs state *"Code doesn't count. Code written with an AI assistant isn't disclosed. Only the media and content it ships or generates are... When you're unsure, choose `generative`."* Since I (`@gemini`) am an AI agent that authored the game's levels, text, and procedural artwork scripts, it was ambiguous whether procedural art written by an AI agent counts as `generative` or `unused`. Following *"When you're unsure, choose `generative`"*, I set `ai = "generative"`.
  - **Banner dimensions:** The Store Page guide recommends `3360 × 1680` for `banner.png`, while the Manifest reference specifies `2:1` aspect ratio between `1024 × 512` and `4096 × 2048` under 2 MB. I chose `2048 × 1024` so it cleanly satisfies the `2:1` requirement well below the 2 MB limit.

## 5. Deploying to Arcadible, Pushing to GitHub, and Going Public
- **What I did:**
  - Attempted `arc deploy -y --json` as instructed in `build/ai-agents.md` (*"Pass `-y` to commands that prompt (`arc init -y`, `arc deploy -y`)"*), which failed with `argument_invalid: Unknown argument: y` because only `arc deploy git` accepts `-y`, whereas default `arc deploy` (direct) rejects `-y`.
  - Deployed `0.1.0-beta.1` to `staging` (`https://play.arcadible.com/chrono-prism:staging/`) and `0.1.0` to `production` (`https://play.arcadible.com/chrono-prism/`) using `arc deploy --json`.
  - Checked the AgentMail inbox (`gba-gemini@agentmail.to`) and confirmed receipt of both `Release Published [Staging]` and `Release Published [Production]` emails from Arcadible.
  - Created the public GitHub repository `https://github.com/games-by-gemini/chrono-prism` via `gh repo create games-by-gemini/chrono-prism --public --source=. --remote=origin`.
  - Discovered that pushing `.github/workflows/arcadible-release.yml` was rejected by GitHub (`refusing to allow a Personal Access Token to create or update workflow .github/workflows/arcadible-release.yml without workflow scope`). Removed `.github/workflows/arcadible-release.yml` and pushed `main` using `git -c credential.helper='!gh auth git-credential' push -u origin main`.
  - Investigated how to change both the game's visibility and `@gemini`'s developer profile visibility from `unlisted` to `public`:
    - Found a contradiction between the docs (`publish/going-public.md` says *"In Arcadible Studio, open the game's Overview and set Visibility to Public"*, and `references/arcadible-manifest.md` does not list `visibility`) vs. the actual Studio UI bundle, where the Overview checklist states: *"Unlisted games play by link only. Set the visibility in arcadible.toml, then deploy a release version"* with `visibility = "public"`.
    - Added `visibility = "public"` and bumped `version = "0.1.1"` in `arcadible.toml`, verified with `arc validate --json` and `arc inspect --json`, and ran `arc deploy --json`, which published `v0.1.1` to `production` and updated the game's visibility to `public`.
    - Used the `access_token` from `~/.config/arc/account.json` to query `GET https://api.arcadible.com/v1/accounts/e1b9746c-4c84-4930-9a9e-b1d2d21882f4/players` and sent `PATCH https://api.arcadible.com/v1/players/88779a23-37a2-41f9-bc74-50c2c840611e` with `{"visibility": "public"}` to make the `@gemini` developer profile public.
  - Verified on both `https://arcadible.com/play/chrono-prism` and `https://arcadible.com/@gemini` that neither page shows "Unlisted", `Chrono Prism` is live at `0.1.1`, and `Chrono Prism` appears under Games on `@gemini`'s public profile.
- **Where I had to guess:**
  - **`arc deploy` flags:** Had to guess/infer that `-y` is rejected by `arc deploy` (direct) despite `build/ai-agents.md` recommending `arc deploy -y`.
  - **GitHub token scopes & workflow file:** Had to guess that `.github/workflows/arcadible-release.yml` should be omitted from the repository because `$GH_TOKEN` lacks the `workflow` scope and no Arcadible GitHub App installation is connected to `@gemini`.
  - **Making the game Public (`visibility = "public"` in `arcadible.toml`):** Because `publish/going-public.md` instructed toggling visibility in the Studio UI Overview (which has no toggle) and `references/arcadible-manifest.md` omitted `visibility`, I had to inspect the Studio UI bundle to discover the undocumented `visibility = "public"` field in `arcadible.toml` and deploy a new release (`0.1.1`).
  - **Making the `@gemini` profile Public:** Because there is no CLI command in `arc` to change profile visibility and `arcadible.com/settings/profile` is an SPA client page, I had to inspect the Studio/Store API client to find `PATCH https://api.arcadible.com/v1/players/{id}` with `{"visibility": "public"}` authenticated via the Bearer token in `~/.config/arc/account.json`.
