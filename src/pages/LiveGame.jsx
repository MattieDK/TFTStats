import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import PlayerBoard from '../components/live/PlayerBoard.jsx'
import StarChancePanel from '../components/live/StarChancePanel.jsx'
import { boardGoldCost } from '../utils/tftUtils.js'
import { computeThreeStarChances } from '../utils/probability.js'

const POLL_INTERVAL_MS = 30_000 // 30 seconds

export default function LiveGame() {
  const { settings, resolveSummoner, summoner, championMap, champsBySet } = useApp()

  const [gameData,   setGameData]   = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [countdown,  setCountdown]  = useState(POLL_INTERVAL_MS / 1000)

  const intervalRef  = useRef(null)
  const countdownRef = useRef(null)

  const isConfigured = settings?.apiKey && settings?.gameName && settings?.tagLine

  // ── Fetch live game ──────────────────────────────────────────────────────────
  const fetchGame = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { summoner: s, error: sErr } = await resolveSummoner()
    if (sErr) { setError(sErr); setLoading(false); return }

    const res = await window.tft.spectator.active({
      summonerId: s.summonerId,
      platform:   settings.platform,
      apiKey:     settings.apiKey,
    })

    if (res.error) {
      if (res.error.status === 404) {
        setError(null)
        setGameData(null)
      } else {
        setError(`${res.error.status}: ${res.error.message}`)
      }
    } else {
      setGameData(res.data)
    }

    setLastUpdate(new Date())
    setCountdown(POLL_INTERVAL_MS / 1000)
    setLoading(false)
  }, [settings, resolveSummoner])

  // ── Auto-poll while page is open ─────────────────────────────────────────────
  useEffect(() => {
    if (!isConfigured) return

    fetchGame()

    intervalRef.current = setInterval(fetchGame, POLL_INTERVAL_MS)

    countdownRef.current = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1))
    }, 1000)

    return () => {
      clearInterval(intervalRef.current)
      clearInterval(countdownRef.current)
    }
  }, [isConfigured]) // Only re-run if configured state changes

  // ── Not configured ───────────────────────────────────────────────────────────
  if (!settings) return <div className="text-tft-muted animate-pulse">Loading…</div>

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
        <p className="text-2xl">⚙️</p>
        <p className="text-slate-300 font-medium">Configure your settings first</p>
        <Link to="/settings" className="btn-primary">Go to Settings</Link>
      </div>
    )
  }

  // ── Compute derived data ─────────────────────────────────────────────────────
  const participants = gameData?.participants ?? []
  const trackedPuuid = summoner?.puuid

  // Gold costs per player board
  const boardCosts = participants.map((p) => ({
    puuid: p.puuid,
    cost:  boardGoldCost(p.units ?? [], championMap),
  }))

  // Tracked player's board character IDs (for highlighting on opponent boards)
  const myCharacterIds = participants
    .find((p) => p.puuid === trackedPuuid)
    ?.units?.map((u) => (u.characterId ?? '').toLowerCase()) ?? []

  // 3-star probability calculations
  const threeStarChances = gameData
    ? computeThreeStarChances(participants, trackedPuuid, championMap, champsBySet)
    : []

  // Sort participants: tracked player first, then by board cost descending
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.puuid === trackedPuuid) return -1
    if (b.puuid === trackedPuuid) return  1
    const aCost = boardCosts.find((x) => x.puuid === a.puuid)?.cost ?? 0
    const bCost = boardCosts.find((x) => x.puuid === b.puuid)?.cost ?? 0
    return bCost - aCost
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Game</h1>
          <p className="text-tft-muted text-sm mt-0.5">
            {settings.gameName}#{settings.tagLine} · auto-refresh in {countdown}s
          </p>
        </div>
        <button
          onClick={fetchGame}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : '↻ Refresh Now'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Not in a game */}
      {!loading && !error && !gameData && (
        <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
          <p className="text-4xl">🎮</p>
          <p className="text-slate-300 font-medium">Not currently in a TFT game</p>
          <p className="text-tft-muted text-sm">
            Start a game and this page will automatically detect it.
          </p>
          {lastUpdate && (
            <p className="text-xs text-tft-muted">
              Last checked: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {/* Live game content */}
      {gameData && (
        <div className="space-y-6">
          {/* Gold summary row */}
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Board Gold Values</h2>
            <div className="flex flex-wrap gap-3">
              {sortedParticipants.map((p) => {
                const cost = boardCosts.find((x) => x.puuid === p.puuid)?.cost ?? 0
                const isTracked = p.puuid === trackedPuuid
                return (
                  <div
                    key={p.puuid}
                    className={`flex flex-col items-center px-3 py-2 rounded-lg border ${
                      isTracked
                        ? 'border-tft-gold/60 bg-tft-gold/5'
                        : 'border-tft-border bg-white/2'
                    }`}
                  >
                    <span className={`text-xs truncate max-w-[80px] ${isTracked ? 'text-tft-gold' : 'text-slate-400'}`}>
                      {isTracked ? 'You' : (p.summonerName ?? 'Player')}
                    </span>
                    <span className="text-lg font-bold text-tft-gold">{cost}g</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3-star chances (only for tracked player) */}
          {threeStarChances.length > 0 && (
            <StarChancePanel chances={threeStarChances} />
          )}

          {/* All boards */}
          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-3">All Boards</h2>
            <div className="space-y-3">
              {sortedParticipants.map((p) => {
                const cost      = boardCosts.find((x) => x.puuid === p.puuid)?.cost ?? 0
                const isTracked = p.puuid === trackedPuuid
                return (
                  <PlayerBoard
                    key={p.puuid}
                    participant={p}
                    isTracked={isTracked}
                    goldCost={cost}
                    championMap={championMap}
                    myCharacterIds={isTracked ? [] : myCharacterIds}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
