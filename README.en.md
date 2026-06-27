# Open Slideshow

[中文](./README.md)

Markdown in → browser-rendered slides → pick → present. Built on [Slidev](https://sli.dev). Single image, no database, configured via `.env`.

## Quick Start

Requires: Docker (recommended) or local Node 22+.

### Option 1: Docker (recommended, zero local dependencies)

```bash
cp .env.example .env
task playground:up
```

Open in your browser:

- Home: http://localhost:8080
- Player (auto-opens in a new tab after clicking "Start" on the home page): http://localhost:3030

Run in the background: `task playground:up-detached`; stop: `task playground:down`.

### Option 2: Local development

```bash
pnpm install
# Terminal 1: home (vite dev on :5173, auto-proxies /api to :8080)
pnpm dev:home
# Terminal 2: server + player
pnpm --filter open-slideshow-server dev
```

## Usage

1. Open the home page at `:8080`.
2. **Open a new file** (bottom-left "+ Open new file"): select a local `.md`. The system validates whether it is a valid slide format; if not, the reason is shown and you may "Force open".
3. **Pick a slide**: click an entry in the left history list or under "Other files in the library".
4. **Pick a style**: right-hand dropdown (defaults to official).
5. **Start playing**: the bottom button opens a full-screen presentation in a new tab; closing the tab returns you to the home page.
6. The history list is sorted by most-recently-opened and cached in the browser locally.

## Writing Slides

Place `.md` files in the `user-slides/` directory (auto-listed) or upload them via "Open new file" on the home page.

- Use `---` to separate slides.
- frontmatter may include `theme` (overridden by the home page style selector), `layout`, etc.
- All Slidev features are supported: Mermaid, code highlighting, two-column layouts, and more.

Writing guidelines: see `user-slides/AGENTS.md`. Example: see `user-slides/welcome.md`.

## Configuration (.env)

| Key             | Default       | Description            |
| --------------- | ------------- | ---------------------- |
| `SLIDES_DIR`    | `user-slides` | Slide library directory |
| `HOME_PORT`     | `8080`        | Home page port          |
| `SLIDEV_PORT`   | `3030`        | Player port             |
| `DEFAULT_THEME` | `default`     | Default theme           |
| `HISTORY_LIMIT` | `20`          | History list cap        |

## Theme Extension

Pre-installed: `default` and `seriph`. To add a theme: add the dependency in `apps/player/package.json`, then run `task build` again — the new theme will appear in the home page style list automatically.

## Commands (task)

| Command                       | Description                                                      |
| ----------------------------- | ---------------------------------------------------------------- |
| `task build`                  | Build the image (lint/test gate built in, inside Docker)         |
| `task playground:up`          | Build and start containers (foreground; home :8080, player :3030) |
| `task playground:up-detached` | Start in the background                                          |
| `task playground:down`        | Stop containers                                                  |
| `task logs`                   | View playground logs                                             |
| `task e2e`                    | Run e2e with the playwright image (requires `playground:up-detached` first) |

> For local (non-Docker) lint / format / test, use `pnpm lint` / `pnpm format` / `pnpm test` respectively.

## Image Notes

Multi-stage build (see `Dockerfile`):

- **build**: install dependencies (pnpm; BuildKit cache mount persists the pnpm store) + build the home page + lint/test quality gate (same stage as the build; ~3s combined in practice).
- **runtime**: a single Node process serves the home page static assets + file API + Slidev player; `user-slides/` is the default slide library and can be overridden via a volume (`./user-slides:/app/user-slides`).

Default environment variables: `HOME_PORT=8080`, `SLIDEV_PORT=3030`, `SLIDES_DIR=/app/user-slides`, `DEFAULT_THEME=default`, `HISTORY_LIMIT=20`.

## Architecture

See `docs/architecture.md`, `docs/use-cases.md`, and `AGENTS.md` for details.

In short: a single image runs one Node process that serves "home page static + file API" (`:8080`) and the "Slidev player" (`:3030`); user data lives in the browser's localStorage, and slide files live in `user-slides/`.
