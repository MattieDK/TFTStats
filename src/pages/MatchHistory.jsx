import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import MatchCard from '../components/match/MatchCard.jsx'

const INITIAL_COUNT = 10

export default function MatchHistory() {
  const { settings, resolveSummoner, championMap, dataLoading } = useApp()

  const [matches,  setMatches]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [fetched,  setFetched]  = useState(false)

  const isConfigured = settings?.apiKey && settings?.gameName && settings?.tagLine

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    setError(null)

    // 1. Resolve summoner (cached after first call)
    const { summoner, error: sErr } = await resolveSummoner()
    if (sErr) { setError(sErr); setLoading(false); return }

    const { apiKey, platform } = settings

    // 2. Get match IDs
    const idsRes = await window.tft.matches.ids({
      puuid: summoner.puuid,
      platform,
      apiKey,
      count: INITIAL_COUNT,
    })
    if (idsRes.error) { setError(idsRes.error.message); setLoading(false); return }

    const ids = idsRes.data ?? []
    if (ids.length === 0) {
      setMatches([])
      setFetched(true)
      setLoading(false)
      return
    }

    // 3. Fetch each match (sequentially to stay within rate limits)
    const results = []
    for (const matchId of ids) {
      const res = await window.tft.matches.get({ matchId, platform, apiKey })
      if (!res.error && res.data) {
        results.push(res.data)
      }
      // Small delay to avoid hitting rate limits on dev key (100 req / 2 min)
      await new Promise((r) => setTimeout(r, 150))
    }

    setMatches(results)
    setFetched(true)
    setLoading(false)
  }, [settings, resolveSummoner])

  // ── Guard: settings not yet loaded ──────────────────────────────────────────
  if (!settings) {
    return <div className="text-tft-muted animate-pulse">Loading…</div>
  }

  // ── Guard: not configured ────────────────────────────────────────────────────
  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
        <p className="text-2xl">⚙️</p>
        <p className="text-slate-300 font-medium">Configure your settings first</p>
        <p className="text-tft-muted text-sm">Add your Riot API key and Riot ID to start tracking matches.</p>
        <Link to="/settings" className="btn-primary mt-2">Go to Settings</Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Match History</h1>
          <p className="text-tft-muted text-sm mt-0.5">
            {settings.gameName}#{settings.tagLine}
          </p>
        </div>
        <button
          onClick={fetchMatches}
          disabled={loading || dataLoading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Loading…' : fetched ? '↻ Refresh' : 'Load Matches'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-24 bg-tft-card" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && fetched && matches.length === 0 && (
        <div className="text-center py-16 text-tft-muted">
          No TFT matches found for this account.
        </div>
      )}

      {/* Match list */}
      {!loading && matches.length > 0 && (
        <div className="space-y-3">
          <MatchListResolved matches={matches} championMap={championMap} />
        </div>
      )}

      {!loading && !fetched && (
        <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
          <p className="text-4xl">📋</p>
          <p className="text-slate-300 font-medium">Ready to load your matches</p>
          <p className="text-tft-muted text-sm">Click "Load Matches" to fetch your recent TFT games.</p>
        </div>
      )}
    </div>
  )
}

/** Separate component so we have access to summoner from context cleanly */
function MatchListResolved({ matches, championMap }) {
  const { summoner } = useApp()

  if (!summoner?.puuid) return null

  return (
    <>
      {matches.map((match) => {
        const participant = match.info?.participants?.find(
          (p) => p.puuid === summoner.puuid
        )
        if (!participant) return null
        return (
          <MatchCard
            key={match.metadata?.match_id}
            match={match}
            participant={participant}
            championMap={championMap}
          />
        )
      })}
    </>
  )
}
