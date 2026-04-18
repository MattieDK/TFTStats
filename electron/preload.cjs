'use strict'

const { contextBridge, ipcRenderer } = require('electron')

/**
 * Expose a safe, typed API to the renderer process.
 * All Riot API calls go through the main process (no CORS issues).
 */
contextBridge.exposeInMainWorld('tft', {
  settings: {
    save: (settings)  => ipcRenderer.invoke('settings:save', settings),
    load: ()          => ipcRenderer.invoke('settings:load'),
  },

  account: {
    /** Get PUUID from Riot ID (gameName#tagLine) */
    get: (args) => ipcRenderer.invoke('account:get', args),
  },

  matches: {
    /** Get list of recent match IDs */
    ids: (args) => ipcRenderer.invoke('matches:ids', args),
    /** Get full match details for one match */
    get: (args) => ipcRenderer.invoke('matches:get', args),
  },

  spectator: {
    /** Get active TFT game for a summonerId */
    active: (args) => ipcRenderer.invoke('spectator:active', args),
  },

  /** Fetch CDragon TFT game data (champions, items, traits) */
  tftData: () => ipcRenderer.invoke('tft:data'),
})
