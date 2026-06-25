# StreamKit+ Addon — Agent Guide

This repository is a **StreamKit+ integration addon**. Read this file first when an AI assistant edits or extends the project.

Project-specific values (`id`, `type`, `version`, permissions, etc.) are in `manifest.json` and `README.md`.

## Official documentation

Use these sources for API reference, manifest format, permissions, and publishing:

| Resource | URL |
| --- | --- |
| **GitHub (versioned docs + typings)** | https://github.com/RocketMan-StreamKit/types |
| **Web documentation** | https://rocketman-streamkit.github.io/types/ |
| **Context7 (MCP)** | https://context7.com/rocketman-streamkit/types |

### Context7 in Cursor / IDE

When Context7 MCP is available, resolve library `rocketman-streamkit/types` (or open the URL above) for version-matched addon API docs and code examples.

### npm typings

TypeScript worker projects use [@rocketman-streamkit/types](https://www.npmjs.com/package/@rocketman-streamkit/types). Pin the package version to the StreamKit+ release you target (see `manifest.app_version`).

### Missing API in TypeScript addons

If a requested feature is **not declared** in the installed `@rocketman-streamkit/types` (no method, global, or permission in `addon.d.ts`):

1. Check the [official docs](https://rocketman-streamkit.github.io/types/) and [GitHub branches](https://github.com/RocketMan-StreamKit/types/branches) — the API may exist in a newer StreamKit+ release.
2. **Update `@rocketman-streamkit/types`** in `package.json` to the version that matches the StreamKit+ release providing that API, then run `npm install`.
3. Bump `manifest.app_version` to the same minimum StreamKit+ version if you raise the types package.
4. Do **not** invent globals, use `@ts-ignore`, or duplicate typings locally — typings must come from the npm package only.
5. If no published `@rocketman-streamkit/types` release includes the API, the feature is not available to addons yet; stop and tell the user instead of faking the API.

## What is an integration addon

Integration addons extend StreamKit+ from an **isolated worker** (when present). They are installed as a folder with `manifest.json` and assets — not bundled with the main app.

| Layer | Role |
| --- | --- |
| **This folder** | `manifest.json`, worker (`index.js`), web assets, icon |
| **StreamKit+ main process** | Spawns worker, enforces permissions, bridges HTTP/config |
| **Worker sandbox** | VM context with injected globals (`network`, `events`, …) |

### Addon categories (`manifest.type`)

| Type | Purpose |
| --- | --- |
| `platform.streaming` | Chat, live status, webhooks (Twitch, Kick, …) |
| `platform.donation` | Donation alerts and goals |
| `overlay` | Triggered on-screen effects |
| `overlay.info` | Info panel shown with overlay effects |
| `widget` | Persistent web page (OBS browser source) |
| `application` | In-app sandboxed window |
| `game` | Connect stream events to in-game effects |

### Worker sandbox (`index.js`)

Worker code runs in an isolated VM. Globals such as `network`, `events`, `status`, `dashboard`, `GenerateConfig`, and `data` are injected by StreamKit+ — do **not** import Node.js built-ins (`fs`, `http`, `path`, …).

- Register HTTP handlers: `await network.endpoints.create(...)` + `events.On(...)`
- Read/write settings: `data` object (backed by addon config)
- TypeScript: use `@rocketman-streamkit/types` — see `tsconfig.json`

Some scaffolds have **no worker** — only static assets declared in `manifest.json` (HTML/CSS/JS or media files).

### Web UI

When `manifest.web` is set:

- Entry HTML is served from the addon folder
- `web_type`: `overlay`, `widget`, or `application`
- Static assets are listed in `manifest.web_contents`
- Worker-backed pages call addon HTTP endpoints at `http://localhost:{port}/addon/{addonId}/...`

## Permissions

Permissions are declared in `manifest.json`. Only use APIs that match granted permissions.

| Permission | Purpose |
| --- | --- |
| `NETWORK_REQUEST` | HTTP requests (GET, POST, PUT, DELETE) |
| `NETWORK_WEBSOCKET` | Outbound WebSocket connections |
| `WEB_END_POINTS` | Create HTTP endpoints for the addon |
| `WEB_CONTENT` | Serve manifest-declared web page and static files |
| `SOCKET_END_POINTS` | Socket.IO namespaces for web pages and external clients |
| `CONFIG_READ` | Read full app config |
| `CONFIG_WRITE` | Write full app config |
| `ADDON_CONFIG_READ` | Read configuration of other addons |
| `INCREASE_CONFIG_SIZE` | Storage above 1 MB limit |
| `STATUS` | Show connection status in the status bar |
| `NOTIFY` | Push in-app notifications |
| `DASHBOARD_EVENTS` | Push events to the latest-events widget |
| `DASHBOARD_CHAT` | Push messages to the chat dashboard |
| `DASHBOARD_CHAT_INCOMING` | Receive chat messages from the dashboard |
| `DASHBOARD_EVENTS_INCOMING` | Receive events from the dashboard |
| `FILE_ACCESS` | Scoped read/manage access to user-approved files (`files` API) |

See the [permissions guide](https://rocketman-streamkit.github.io/types/en/permissions.html).

## Typical project layout

```
manifest.json
README.md
AGENT.md
logo.png              # icon (manifest.icon)
index.ts / index.js   # worker (when present)
index.html            # web UI entry (when present)
style.css, app.js     # web assets
package.json          # TypeScript worker projects
tsconfig.json
.github/workflows/release.yml
```

TypeScript worker: run `npm install && npm run build` — StreamKit+ loads `index.js` at runtime.

## Development

1. Install the addon folder in **StreamKit+ → Settings → Addons** (folder picker or drag-and-drop).
2. Approve requested permissions when prompted.
3. Enable the addon and configure settings in the UI.
4. After code changes, reload/reinstall the addon or restart StreamKit+ as needed.

Keep `manifest.app_version` aligned with the minimum StreamKit+ version that provides the APIs you use.

## Release

- Bump `version` in `manifest.json`.
- Push tag `v{version}` or run the **Release addon** GitHub Action (`.github/workflows/release.yml`).
- The workflow fails if a GitHub Release for that version already exists, then uploads `main.zip`, `manifest.json`, and the icon.

Details: [Publishing and releases](https://rocketman-streamkit.github.io/types/en/publishing.html)

## Rules for AI agents

1. **Stay in this repository** — Typings come only from `@rocketman-streamkit/types`.
2. **Respect the sandbox** — no Node.js built-ins in worker code; use injected globals from the official API reference.
3. **Keep `manifest.json` valid** — `id` format `ORG/REPO`, `app_version` must match the minimum StreamKit+ version you target.
4. **Match permissions to API usage** — add permissions to `manifest.json` before using restricted features.
5. **TypeScript worker:** run `npm run build` before testing; `index.js` is what StreamKit+ loads at runtime.
6. **Missing sandbox API (TypeScript):** if the requested feature is absent from `@rocketman-streamkit/types`, update the package to the matching StreamKit+ release version (and `manifest.app_version` if needed) before implementing — see [Missing API in TypeScript addons](#missing-api-in-typescript-addons).
7. **Localized strings** — `name`, `description`, and UI labels use `{ en, ru?, uk? }` objects where the manifest requires them.
