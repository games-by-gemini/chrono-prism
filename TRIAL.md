# TRIAL.md — Making and Publishing an Original Game on Arcadible

## 1. Initial Exploration
- **What I did:**
  - Inspected the environment variables (`ARCADIBLE_EMAIL`, `ARCADIBLE_PASSWORD`, `AGENTMAIL_API_KEY`, `GH_TOKEN`), available CLI binaries (`gh`, `git`, `node`, `npm`, `npx`, `python3`, `curl`), and `.gitconfig`.
  - Found `ARCADIBLE_EMAIL=gba-gemini@agentmail.to` and `.gitconfig` email `gemini@agents.arcadible.com`.
- **Where I had to guess:**
  - The prompt mentions "Arcadible" without a URL and no `arcadible` CLI binary was installed initially. Based on `.gitconfig` (`gemini@agents.arcadible.com`), I guessed that Arcadible is hosted at `https://arcadible.com` and that `TRIAL.md` should be placed in `/home/agent/game/TRIAL.md`.

## 2. Discovering Arcadible Documentation & Installing the CLI
- **What I did:**
  - Fetched `https://arcadible.com` and found footer links to `https://studio.arcadible.com/` and `https://developer.arcadible.com/getting-started`.
  - Read the developer documentation (including `getting-started`, `references/arcadible-cli`, `build/ai-agents`, `references/arcadible-manifest`, `references/arcadible-markdown`, `publish/store-page`, `publish/going-public`, `publish/deploying-from-github`, and `references/arcadible-sdk`).
  - Installed `arcadible` (`1.0.12`) globally via `npm install -g arcadible`, which placed `arc` and its subcommands in `/home/agent/.npm-global/bin` (already on `PATH`).
  - Noticed that `arc --version`, `arc -v`, `arc -h`, and bare `arc` all fail with `Command aborted. Unable to find: /home/agent/.npm-global/bin/arc-default`, contrary to the Getting Started guide (`arc --version`) and `arc` reference docs.
- **Where I had to guess:**
  - Because `arc --version` and `arc -h` failed looking for `arc-default`, I had to guess that `arc` dispatches to `arc-<subcommand>` binaries and test passing `-v` / `-h` to a valid subcommand (`arc whoami -v` -> `1.0.12`, `arc init -h`).

## 3. Authenticating `arc login` and Checking AgentMail & GitHub
- **What I did:**
  - Checked the AgentMail API (`https://api.agentmail.to/v0/inboxes` and `/messages`) using `Authorization: Bearer $AGENTMAIL_API_KEY`; verified the inbox `gba-gemini@agentmail.to` exists and initially had 0 messages.
  - Checked the `games-by-gemini` GitHub organization via `gh repo list games-by-gemini` and confirmed it currently has no repositories.
  - Checked `https://arcadible.com/@gemini` and confirmed the account exists (`Gemini (@gemini)` with homepage `https://github.com/games-by-gemini` and no games yet).
  - Ran `arc login --no-browser --no-qrcode`, which output the verification URL `https://account.arcadible.com/link` and an 8-character device code (`XXXX-XXXX`).
  - Automated the web device-link flow in Python: first submitted the `dac` code and `csrf` token to `POST https://account.arcadible.com/link`, which stored `link_credential` in the `app-session` cookie and redirected to `https://account.arcadible.com/login`; then submitted `email` (`$ARCADIBLE_EMAIL`), `password` (`$ARCADIBLE_PASSWORD`), and `csrf` to `POST https://account.arcadible.com/login`.
  - Verified with `arc whoami --json` that the CLI is now authenticated as `gba-gemini@agentmail.to` (`id: e1b9746c-4c84-4930-9a9e-b1d2d21882f4`).
- **Where I had to guess:**
  - `arc login` only supports interactive browser/device-code login (`https://account.arcadible.com/link`) with no CLI flags for email/password or token input. I had to inspect the HTML forms on `account.arcadible.com/link` and `account.arcadible.com/login` to automate the device code approval over HTTP.
  - Initially I logged in to `/login` first and then posted to `/link`, which redirected back to `/login` without completing the link because `/login` had redirected to `arcadible.com` and cleared the login session on `account.arcadible.com`. I had to guess/discover that submitting the device code to `/link` *first* sets `link_credential` in the session cookie and redirects to `/login`, and logging in from that redirect completes the device link.
  - For AgentMail, no base URL was specified in the prompt, so I had to guess the API endpoint `https://api.agentmail.to/v0/inboxes` based on the email domain `agentmail.to`.

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
  - **AI disclosure (`ai = "generative"` vs `"unused"`):** The docs state *"Code doesn't count. Code written with an AI assistant isn't disclosed. Only the media and content it ships or generates are... When you're unsure, choose `generative`."* Since I (`@gemini`) am an AI agent that authored the game's levels, text, and procedural artwork scripts, it was ambiguous whether programmatic/procedural art written by an AI agent counts as `generative` or `unused`. Following the doc's rule (*"When you're unsure, choose `generative`"*), I set `ai = "generative"`.
  - **Banner dimensions:** The Store Page guide recommends `3360 × 1680` for `banner.png`, while the Manifest reference specifies `2:1` aspect ratio between `1024 × 512` and `4096 × 2048` under 2 MB. I chose `2048 × 1024` so it cleanly satisfies the `2:1` requirement well below the 2 MB limit.



