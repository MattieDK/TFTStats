'use strict'

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Store = require('electron-store')
const axios = require('axios')

// ─── Persistent store for settings ───────────────────────────────────────────
const store = new Store()

// ─── Strip invisible Unicode bidirectional control characters ─────────────────
// macOS injects these silently into Electron text inputs (U+2066–U+2069, etc.)
function sanitize(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/[\u2066\u2067\u2068\u2069\u202A-\u202E\u200B-\u200F\uFEFF]/g, '')
    .trim()
}

// ─── Sanitize API key — strip everything that isn't a valid key character ─────
// Riot API keys are always "RGAPI-" followed by hex groups separated by hyphens.
function sanitizeApiKey(str) {
  if (typeof str !== 'string') return str
  return str.replace(/[^A-Za-z0-9-]/g, '').trim()
}

// ─── Platform → Regional routing ─────────────────────────────────────────────
const PLATFORM_TO_REGIONAL = {
  na1: 'americas', br1: 'americas', la1: 'americas', la2: 'americas', oc1: 'americas',
  euw1: 'europe', eun1: 'europe', ru: 'europe', tr1: 'europe',
  kr: 'asia', jp1: 'asia',
  me1: 'sea', sg2: 'sea', tw2: 'sea', vn2: 'sea', ph2: 'sea', th2: 'sea',
}

function getRegional(platform) {
  return PLATFORM_TO_REGIONAL[(platform || '').toLowerCase()] || 'americas'
}

// ─── Window setup ─────────────────────────────────────────────────────────────
const DEV = process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0a0a14',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (DEV) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── Generic Riot API GET ─────────────────────────────────────────────────────
async function riotGet(url, apiKey) {
  console.log(`[Riot API] GET ${url}`)
  try {
    const res = await axios.get(url, {
      headers: { 'X-Riot-Token': apiKey },
      timeout: 12000,
    })
    console.log(`[Riot API] ✓ ${res.status}`, JSON.stringify(res.data).slice(0, 200))
    return { data: res.data, error: null }
  } catch (err) {
    const status  = err.response?.status ?? 0
    const body    = err.response?.data
    const message = body?.status?.message ?? err.message ?? 'Unknown error'
    console.error(`[Riot API] ✗ ${status}`, JSON.stringify(body))
    return { data: null, error: { status, message, body } }
  }
}

// ─── IPC: Settings ────────────────────────────────────────────────────────────
ipcMain.handle('settings:save', (_e, settings) => {
  store.set('settings', settings)
  return true
})

ipcMain.handle('settings:load', () => {
  return store.get('settings', {})
})

// ─── IPC: Account (Riot ID → PUUID) ──────────────────────────────────────────
ipcMain.handle('account:get', async (_e, { gameName, tagLine, platform, apiKey }) => {
  const regional = getRegional(platform)
  const url = `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(sanitize(gameName))}/${encodeURIComponent(sanitize(tagLine))}`
  return riotGet(url, sanitizeApiKey(apiKey))
})

// ─── IPC: Summoner — kept for backwards compat but no longer called ──────────
// Riot is removing encryptedSummonerId; we now use PUUID everywhere instead.

// ─── IPC: Match IDs ───────────────────────────────────────────────────────────
ipcMain.handle('matches:ids', async (_e, { puuid, platform, apiKey, count = 20 }) => {
  const regional = getRegional(platform)
  const url = `https://${regional}.api.riotgames.com/tft/match/v1/matches/by-puuid/${sanitize(puuid)}/ids?count=${count}`
  return riotGet(url, sanitizeApiKey(apiKey))
})

// ─── IPC: Match detail ────────────────────────────────────────────────────────
ipcMain.handle('matches:get', async (_e, { matchId, platform, apiKey }) => {
  const regional = getRegional(platform)
  const url = `https://${regional}.api.riotgames.com/tft/match/v1/matches/${sanitize(matchId)}`
  return riotGet(url, sanitizeApiKey(apiKey))
})

// ─── IPC: Spectator (live game) — uses PUUID, no summonerId needed ───────────
ipcMain.handle('spectator:active', async (_e, { puuid, platform, apiKey }) => {
  const url = `https://${sanitize(platform)}.api.riotgames.com/tft/spectator/v5/active-games/by-puuid/${sanitize(puuid)}`
  return riotGet(url, sanitizeApiKey(apiKey))
})

// ─── IPC: CDragon TFT data (cached in memory, 1 h TTL) ───────────────────────
let tftDataCache = null
let tftDataCacheTime = 0
const TFT_CACHE_TTL = 60 * 60 * 1000 // 1 hour

ipcMain.handle('tft:data', async () => {
  if (tftDataCache && Date.now() - tftDataCacheTime < TFT_CACHE_TTL) {
    return { data: tftDataCache, error: null }
  }
  try {
    const res = await axios.get(
      'https://raw.communitydragon.org/latest/cdragon/tft/en_us.json',
      { timeout: 30000 }
    )
    tftDataCache = res.data
    tftDataCacheTime = Date.now()
    return { data: tftDataCache, error: null }
  } catch (err) {
    return { data: tftDataCache, error: { message: err.message } } // return stale cache if available
  }
})
