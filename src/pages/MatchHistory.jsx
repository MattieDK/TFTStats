import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import MatchCard from '../components/match/MatchCard.jsx'

export default function MatchHistory() {
  const {
    settings, championMap, itemMap, dataLoading,
    matches, matchesLoading, matchesError, matchesFetched, matchesLastFetched, fetchMatches,
  } = useApp()

  const loading = matchesLoading
  const error   = matchesError
  const fetched = matchesFetched

  const isConfigured = settings?.apiKey && settings?.gameName && settings?.tagLine

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
            {matchesLastFetched && (
              <span className="ml-2">· updated {matchesLastFetched.toLocaleTimeString('en-GB')}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchMatches(null, { force: true })}
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
  const { summoner, itemMap } = useApp()

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
            itemMap={itemMap}
          />
        )
      })}
    </>
  )
}
