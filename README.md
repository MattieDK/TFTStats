# TFT Stats

A cross-platform desktop application (Windows & macOS) for tracking **Teamfight Tactics** stats, built with Electron + React and powered by the Riot Games API.

## Features

- **Match History** — View recent TFT matches with placement, level, augments, full board composition, damage dealt, and gold left.
- **Live Game** — Real-time board tracker that auto-refreshes every 30 seconds:
  - Total gold value of every player's board
  - Opponents who share your champions are highlighted
  - **3★ probability panel** — per-roll chance and expected rolls to 3-star each champion on your board, based on live pool state

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A Riot Games API key from [developer.riotgames.com](https://developer.riotgames.com)

### Install & run

```bash
git clone <your-repo-url>
cd tft-stats
npm install
npm run dev
```

### Configure

When the app opens go to **Settings** and enter:

- Your **Riot API key** — get one at [developer.riotgames.com](https://developer.riotgames.com)
- Your **Riot ID** (Game Name + Tag, e.g. `PlayerName` / `EUW`)
- Your **Region**

Click **Test Connection** to verify, then **Save Settings**.

> ⚠️ **Development API keys expire every 24 hours.** Regenerate yours at developer.riotgames.com each day and update it in Settings.

---

## Building a distributable

```bash
# macOS (.dmg)
npm run dist:mac

# Windows (.exe installer)
npm run dist:win
```

Output is written to `dist-electron/`.

---

## Security

**Your API key is never stored in the project.** Settings (including the API key) are persisted by `electron-store` in your OS user-data directory — completely outside the repository:

| OS | Location |
|----|----------|
| macOS | `~/Library/Application Support/tft-stats/config.json` |
| Windows | `%APPDATA%\tft-stats\config.json` |

**What this means for contributors:**
- Do not hardcode API keys, PUUIDs, or any personal data in source files.
- The `.gitignore` already excludes `node_modules/`, build output, `.env` files, and OS metadata.
- Run `git status` before committing to confirm no sensitive files are staged.

---

## Project Structure

```
tft-stats/
├── electron/
│   ├── main.cjs        # Main process — window, Riot API calls via IPC
│   └── preload.cjs     # Exposes tft.* API to the renderer (contextBridge)
├── src/
│   ├── context/
│   │   └── AppContext.jsx      # Global state: settings, summoner, CDragon data
│   ├── pages/
│   │   ├── Settings.jsx        # API key + Riot ID configuration
│   │   ├── MatchHistory.jsx    # Historical match list
│   │   └── LiveGame.jsx        # Live game tracker
│   ├── components/
│   │   ├── Layout.jsx / Navbar.jsx
│   │   ├── match/              # MatchCard, UnitChip
│   │   └── live/               # PlayerBoard, StarChancePanel
│   └── utils/
│       ├── tftUtils.js         # Cost colours, gold calc, formatting
│       └── probability.js      # 3★ probability & pool calculations
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.mjs
```

---

## How 3★ Probability Works

Pool state is derived from the spectator API (all visible boards). For each non-3-starred champion on your board:

```
P(one slot) = level_odds[cost] × copies_in_pool / total_of_cost_in_pool
P(per roll)  = 1 − (1 − P_one_slot)^5          (5-slot shop)
Expected rolls = copies_needed / P_per_roll
```

Pool sizes: 1-cost 29 · 2-cost 22 · 3-cost 18 · 4-cost 12 · 5-cost 10

> Shop odds and pool sizes change between TFT sets. Update `LEVEL_ODDS` and `POOL_SIZE` in `src/utils/probability.js` if needed after a set change.

---

## License

MIT
