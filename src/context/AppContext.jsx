import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const AppContext = createContext(null)

const MATCH_COUNT = 10

/**
 * Global app state:
 * - settings: API key, Riot ID, region
 * - summoner: cached summoner data (puuid, summonerId, name)
 * - championMap: { "tft14_ahri": { name, cost, apiName } }  — built from CDragon
 * - champsBySet:  array of champion objects from the latest TFT set
 * - matches / matchesLoading / matchesError / matchesFetched — persisted match history
 */
export function AppProvider({ children }) {
  const [settings, setSettings]       = useState(null)   // null = still loading
  const [summoner, setSummoner]       = useState(null)
  const [championMap, setChampionMap] = useState({})
  const [champsBySet, setChampsBySet] = useState([])
  const [itemMap,     setItemMap]     = useState({}) // id or apiName.lower → name
  const [dataLoading, setDataLoading] = useState(true)

  const [matches,           setMatches]           = useState([])
  const [matchesLoading,    setMatchesLoading]    = useState(false)
  const [matchesError,      setMatchesError]      = useState(null)
  const [matchesFetched,    setMatchesFetched]    = useState(false)
  const [matchesLastFetched, setMatchesLastFetched] = useState(null)
  const fetchingRef = useRef(false)

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

      // Build item map: apiName.lower → { name, icon }
      // CDragon icon paths are relative ASSETS paths with .tex extension.
      // CDragon serves .tex files as .png — lowercase the path and swap the extension.
      const CDRAGON_GAME = 'https://raw.communitydragon.org/latest/game/'
      const imap = {}
      for (const item of data.items ?? []) {
        if (!item.apiName) continue
        const icon = item.icon
          ? CDRAGON_GAME + item.icon.toLowerCase().replace(/^\//, '').replace(/\.tex$/, '.png')
          : null
        const entry = { name: item.name, icon }
        imap[item.apiName.toLowerCase()] = entry
        if (item.id != null) imap[item.id] = entry
      }
      setItemMap(imap)
    })
  }, [])

  // ── Persist + update settings ───────────────────────────────────────────────
  const updateSettings = useCallback(async (next) => {
    const merged = { ...settings, ...next }
    await window.tft.settings.save(merged)
    setSettings(merged)
    setSummoner(null) // invalidate cached summoner when settings change
  }, [settings])

  // ── Fetch match history (persisted in context) ──────────────────────────────
  const fetchMatches = useCallback(async (currentSettings, { force = false } = {}) => {
    const s = currentSettings ?? settings
    if (!s?.apiKey || !s?.gameName || !s?.tagLine || !s?.platform) return
    if (fetchingRef.current && !force) return
    fetchingRef.current = true
    setMatchesLoading(true)
    setMatchesError(null)

    // Resolve summoner inline so fetchMatches doesn't depend on resolveSummoner
    let resolvedSummoner = summoner
    if (!resolvedSummoner) {
      const acctRes = await window.tft.account.get({
        gameName: s.gameName, tagLine: s.tagLine, platform: s.platform, apiKey: s.apiKey,
      })
      if (acctRes.error) {
        setMatchesError(acctRes.error.message)
        setMatchesLoading(false)
        fetchingRef.current = false
        return
      }
      resolvedSummoner = { puuid: acctRes.data.puuid, gameName: acctRes.data.gameName, tagLine: acctRes.data.tagLine }
      setSummoner(resolvedSummoner)
    }

    const idsRes = await window.tft.matches.ids({
      puuid: resolvedSummoner.puuid, platform: s.platform, apiKey: s.apiKey, count: MATCH_COUNT,
    })
    if (idsRes.error) {
      setMatchesError(idsRes.error.message)
      setMatchesLoading(false)
      fetchingRef.current = false
      return
    }

    const ids = idsRes.data ?? []
    const results = []
    for (const matchId of ids) {
      const res = await window.tft.matches.get({ matchId, platform: s.platform, apiKey: s.apiKey })
      if (!res.error && res.data) results.push(res.data)
      await new Promise((r) => setTimeout(r, 150))
    }

    setMatches(results)
    setMatchesFetched(true)
    setMatchesLastFetched(new Date())
    setMatchesLoading(false)
    fetchingRef.current = false
  }, [settings, summoner])

  // ── Auto-fetch on startup once settings are loaded and configured ─────────────
  const autoFetchedRef = useRef(false)
  useEffect(() => {
    if (autoFetchedRef.current) return
    if (!settings) return
    if (!settings.apiKey || !settings.gameName || !settings.tagLine || !settings.platform) return
    autoFetchedRef.current = true
    fetchMatches(settings)
  }, [settings, fetchMatches])

  // ── Resolve summoner from settings (cached) ─────────────────────────────────
  // Riot is deprecating encryptedSummonerId — we only need the PUUID now.
  const resolveSummoner = useCallback(async () => {
    if (summoner) return { summoner, error: null }
    const { apiKey, gameName, tagLine, platform } = settings ?? {}
    if (!apiKey || !gameName || !tagLine || !platform) {
      return { summoner: null, error: 'Settings not configured' }
    }

    // Riot ID → PUUID (single API call, no summonerId needed)
    const acctRes = await window.tft.account.get({ gameName, tagLine, platform, apiKey })
    if (acctRes.error) return { summoner: null, error: acctRes.error.message }

    const resolved = {
      puuid:    acctRes.data.puuid,
      gameName: acctRes.data.gameName,
      tagLine:  acctRes.data.tagLine,
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
    itemMap,
    dataLoading,
    matches,
    matchesLoading,
    matchesError,
    matchesFetched,
    matchesLastFetched,
    fetchMatches,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
