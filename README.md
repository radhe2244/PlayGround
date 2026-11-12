# Studio Story — Game Studio Tycoon

Studio Story is a playable, responsive **web prototype** of a single-player game-studio management sim. It runs locally in a modern browser and stores your studio save in that browser's local storage. It is not a native Android/iOS or Unity build.

## Run locally

Requirements: Python 3 and a modern browser. No package install or internet connection is required to run the game itself (the optional Google Fonts connection only affects typography).

```bash
./serve.sh
```

Open [http://localhost:8000](http://localhost:8000). To use another port, set `PORT`:

```bash
PORT=8080 ./serve.sh
```

You can also serve the project with any static HTTP server. The game uses ES modules, so opening `index.html` directly as a `file://` URL is not supported by all browsers.

## How to play

- Start on **Overview** and check your cash, reputation, community, and current project.
- Open **Games** to choose a title, genre, platform, project size, graphics quality, and optional features. Start production, then advance days until the game ships.
- Advance time with **Work a day**. Each day updates production, payroll and rent, sales, marketing, employee happiness, market trends, and occasional events.
- Grow the company in **Team** (hire/train), **Studio** (expand/decorate), **Research**, and **Marketing**. Browse competitors and trends in **Market** and cash flow in **Finance**.
- Progress is automatically saved in this browser. Use the save button for a manual save. Clearing this browser's site data will remove the local save.

## Current scope

The prototype includes the main tycoon loop, responsive desktop/mobile layouts, and local saves. It does **not** currently include native mobile packaging, a service worker/PWA install flow, cloud sync, or cross-device saves. Static game assets are local; Google Fonts are an optional external request and system fonts are used if unavailable.
