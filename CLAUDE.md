# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev mode (Vite + Electron concurrently)
npm run build     # Build renderer (Vite) only
npm run dist:mac  # Build + package macOS .dmg → dist-electron/
npm run dist:win  # Build + package Windows .exe → dist-electron/
```

There are no tests in this project.

## Architecture

This is an **Electron + React** desktop app. The codebase is split into two processes:

### Main process (`electron/`)
- `main.cjs` — Creates the window, owns all Riot API calls via `axios`, and exposes them as IPC handlers (`ipcMain.handle`). Also manages persistent settings via `electron-store` and CDragon data with a 1-hour in-memory cache.
- `preload.cjs` — Uses `contextBridge` to expose `window.tft.*` to the renderer. This is the only bridge between processes. All Riot API calls in the renderer go through `window.tft.*`.

**IPC channels:** `settings:save`, `settings:load`, `account:get`, `matches:ids`, `matches:get`, `spectator:active`, `tft:data`

### Renderer process (`src/`)
- `App.jsx` — Uses `HashRouter` (required for `file://` protocol in Electron), wraps everything in `AppProvider`.
- `context/AppContext.jsx` — Single global context holding: `settings` (API key, Riot ID, region), `summoner` (resolved PUUID, cached), `championMap` (CDragon lookup by `apiName` lowercase), `champsBySet` (full champion array for current set). CDragon data is fetched once on mount and the highest-numbered set key is treated as the current set.
- `pages/` — Three routes: `/matches` (MatchHistory), `/live` (LiveGame), `/settings` (Settings).
- `components/match/` — MatchCard, UnitChip for match history display.
- `components/live/` — PlayerBoard, StarChancePanel for live game display.

### Key utilities
- `src/utils/probability.js` — `POOL_SIZE` and `LEVEL_ODDS` are set-dependent constants. `computeThreeStarChances(participants, trackedPuuid, championMap, champsBySet)` derives pool state from spectator API data and computes per-roll 3★ probability for each of the tracked player's non-3-starred units.
- `src/utils/tftUtils.js` — Cost colours, gold calculations, formatting helpers.

### Data flow for live game
1. `LiveGame.jsx` calls `window.tft.spectator.active` → returns all participants with their boards.
2. Pool state is computed client-side in `probability.js` by counting copies across all visible boards.
3. CDragon champion data (`championMap`, `champsBySet`) from `AppContext` is used for name/cost lookups.

### Set-specific constants to update after a TFT set change
- `LEVEL_ODDS` in `src/utils/probability.js` — shop odds per player level
- `POOL_SIZE` in `src/utils/probability.js` — copies per champion per cost tier

### Settings storage
Settings (including the API key) are persisted by `electron-store` outside the repo:
- macOS: `~/Library/Application Support/tft-stats/config.json`
- Windows: `%APPDATA%\tft-stats\config.json`
