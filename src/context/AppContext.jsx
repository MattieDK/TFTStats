import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AppContext = createContext(null)

/**
 * Global app state:
 * - settings: API key, Riot ID, region
 * - summoner: cached summoner data (puuid, summonerId, name)
 * - championMap: { "tft14_ahri": { name, cost, apiName } }  — built from CDragon
 * - champsBySet:  array of champion objects from the latest TFT set
 */
export function AppProvider({ children }) {
  const [settings, setSettings]       = useState(null)   // null = still loading
  const [summoner, setSummoner]       = useState(null)
  const [championMap, setChampionMap] = useState({})
  const [champsBySet, setChampsBySet] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  // ── Load persisted settings on first mount ──────────────────────────────────
  useEffect(() => {
    window.tft.settings.load().then((saved) => {
      setSettings(saved ?? {})
    })
  }, [])

  // ── Fetch CDragon TFT data and build champion lookup map ────────────────────
  useEffect(() => {
    window.tft.tftData().then(({ data, error }) => {
      setDataLoading(false)
      if (!data) return

      const sets = data.sets ?? {}
      // Use the highest-numbered set (current set)
      const setKeys = Object.keys(sets).sort((a, b) => Number(b) - Number(a))
      const latestSet = sets[setKeys[0]]

      if (latestSet?.champions) {
        const map = {}
        latestSet.champions.forEach((champ) => {
          if (champ.apiName) {
            map[champ.apiName.toLowerCase()] = {
              name:    champ.name,
              cost:    champ.cost ?? 1,
              apiName: champ.apiName,
            }
          }
        })
        setChampionMap(map)
        setChampsBySet(latestSet.champions)
      }
    })
  }, [])

  // ── Persist + update settings ───────────────────────────────────────────────
  const updateSettings = useCallback(async (next) => {
    const merged = { ...settings, ...next }
    await window.tft.settings.save(merged)
    setSettings(merged)
    setSummoner(null) // invalidate cached summoner when settings change
  }, [settings])

  // ── Resolve summoner from settings (cached) ─────────────────────────────────
  const resolveSummoner = useCallback(async () => {
    if (summoner) return { summoner, error: null }
    const { apiKey, gameName, tagLine, platform } = settings ?? {}
    if (!apiKey || !gameName || !tagLine || !platform) {
      return { summoner: null, error: 'Settings not configured' }
    }

    // Step 1: Riot ID → PUUID
    const acctRes = await window.tft.account.get({ gameName, tagLine, platform, apiKey })
    if (acctRes.error) return { summoner: null, error: acctRes.error.message }

    // Step 2: PUUID → summonerId
    const sumRes = await window.tft.summoner.byPuuid({ puuid: acctRes.data.puuid, platform, apiKey })
    if (sumRes.error) return { summoner: null, error: sumRes.error.message }

    const resolved = {
      puuid:      acctRes.data.puuid,
      summonerId: sumRes.data.id,
      name:       sumRes.data.name,
      profileIconId: sumRes.data.profileIconId,
    }
    setSummoner(resolved)
    return { summoner: resolved, error: null }
  }, [settings, summoner])

  const value = {
    settings,
    updateSettings,
    summoner,
    setSummoner,
    resolveSummoner,
    championMap,
    champsBySet,
    dataLoading,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
