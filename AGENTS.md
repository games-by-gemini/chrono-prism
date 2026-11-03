# AGENTS.md

This project is a game for Arcadible, a platform for publishing games. Build it with anything that runs in a browser: if it builds to a folder with an `index.html`, the `arc` CLI checks and deploys it, whatever the engine. Players play it wherever Arcadible is installed, and in any browser.

**This file was written when the project was created, and Arcadible's docs are kept current.** Where they differ, follow the docs. Every page is listed in https://developer.arcadible.com/llms.txt, and is all in https://developer.arcadible.com/llms-full.txt.

## Read the docs first

Read the page that covers what you're changing, every time, rather than relying on what you remember of it.

| Before you change | Read |
| --- | --- |
| The game | https://developer.arcadible.com/build/best-practices.md and https://developer.arcadible.com/build/runtime-limitations.md |
| How it saves progress | https://developer.arcadible.com/build/saves.md, then https://developer.arcadible.com/references/arcadible-sdk/saves.md and its codes in https://developer.arcadible.com/references/arcadible-sdk.md |
| `arcadible.toml` | https://developer.arcadible.com/references/arcadible-manifest.md |
| `.arcadible/` | https://developer.arcadible.com/publish/store-page.md and https://developer.arcadible.com/references/arcadible-manifest.md |
| `README.md` | https://developer.arcadible.com/references/arcadible-markdown.md |
| How you deploy, play, or release | https://developer.arcadible.com/references/arcadible-cli.md and https://developer.arcadible.com/publish/releases.md |
| How it releases from GitHub | https://developer.arcadible.com/publish/deploying-from-github.md |

## Project structure

| Path | Contains |
| --- | --- |
| `arcadible.toml` | The game's id, version, and settings. Never change `id`. |
| `README.md` | The store page: the title, tagline, bio, and the description between the first and last `---`. |
| `.arcadible/` | The store art, with fixed file names. |
| `.arcadible-public/` | The game players load (`workflow.deploy_dir`, `.arcadible-public` by default), with `index.html` at its root. |
