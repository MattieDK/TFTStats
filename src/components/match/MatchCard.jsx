import { useState } from 'react'
import UnitChip from './UnitChip.jsx'
import {
  ordinal, relativeTime, formatDuration, formatAugment,
  formatTrait, traitStyleClass, queueName,
} from '../../utils/tftUtils.js'

const PLACEMENT_CLASSES = [
  'placement-1','placement-2','placement-3','placement-4',
  'placement-5','placement-6','placement-7','placement-8',
]

function PlacementBadge({ placement, small = false }) {
  const cls = PLACEMENT_CLASSES[placement - 1] ?? 'placement-8'
  if (small) {
    return (
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shrink-0 ${cls}`}>
        {ordinal(placement)}
      </div>
    )
  }
  return (
    <div className={`flex items-center justify-center w-14 h-14 rounded-xl text-xl font-bold shrink-0 ${cls}`}>
      {ordinal(placement)}
    </div>
  )
}

function TraitBadges({ traits }) {
  const active = (traits ?? [])
    .filter((t) => t.style > 0)
    .sort((a, b) => b.style - a.style || b.num_units - a.num_units)

  if (!active.length) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map((t) => (
        <span
          key={t.name}
          className={`text-xs px-2 py-0.5 rounded border ${traitStyleClass(t.style)}`}
        >
          {t.num_units} {formatTrait(t.name)}
        </span>
      ))}
    </div>
  )
}

/**
 * Full match card. Shows placement, queue type, augments, traits, board, damage stats.
 * Expandable to show all 8 players.
 */
export default function MatchCard({ match, participant, championMap, itemMap }) {
  const [expanded, setExpanded] = useState(false)

  if (!participant) return null

  const {
    placement,
    level,
    augments = [],
    units    = [],
    traits   = [],
    total_damage_to_players: damage = 0,
    last_round:  lastRound = 0,
    gold_left:   goldLeft  = 0,
    players_eliminated: eliminated = 0,
  } = participant

  const gameMs     = match.info?.game_datetime ?? 0
  const gameLength = match.info?.game_length   ?? 0
  const queueId    = match.info?.queue_id
  const queue      = queueName(queueId)
  const isDoubleUp = queueId === 1160 || queueId === 1170

  // In Double Up, two players share each placement (1+2 → 1st, 3+4 → 2nd, etc.)
  const dispPlacement = (p) => isDoubleUp ? Math.ceil(p / 2) : p

  const allPlayers = [...(match.info?.participants ?? [])]
    .sort((a, b) => a.placement - b.placement)

  return (
    <div className="card hover:border-tft-border/60 transition-colors">
      <div className="flex items-start gap-4">
        {/* Placement */}
        <PlacementBadge placement={dispPlacement(placement)} />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded bg-tft-dark border border-tft-border text-tft-muted">
              {queue}
            </span>
            <span className="text-slate-300 text-sm">
              Lvl <strong className="text-white">{level}</strong>
            </span>
            <span className="text-tft-muted text-sm">•</span>
            <span className="text-slate-300 text-sm">
              Round <strong className="text-white">{lastRound}</strong>
            </span>
            <span className="text-tft-muted text-sm">•</span>
            <span className="text-slate-300 text-sm">
              Dmg <strong className="text-white">{damage}</strong>
            </span>
            {eliminated > 0 && (
              <>
                <span className="text-tft-muted text-sm">•</span>
                <span className="text-slate-300 text-sm">
                  Elim <strong className="text-white">{eliminated}</strong>
                </span>
              </>
            )}
            <span className="text-tft-muted text-sm">•</span>
            <span className="text-slate-300 text-sm">
              Gold <strong className="text-tft-gold">{goldLeft}</strong>
            </span>
          </div>

          {/* Augments */}
          {augments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {augments.map((aug) => (
                <span
                  key={aug}
                  className="text-xs px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/25 text-purple-300"
                >
                  {formatAugment(aug)}
                </span>
              ))}
            </div>
          )}

          {/* Traits */}
          {traits.length > 0 && (
            <div className="mt-2">
              <TraitBadges traits={traits} />
            </div>
          )}

          {/* Units */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {units.map((unit, i) => (
              <UnitChip key={`${unit.character_id}-${i}`} unit={unit} championMap={championMap} itemMap={itemMap} />
            ))}
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-right shrink-0">
          <p className="text-xs text-tft-muted">{relativeTime(gameMs)}</p>
          {gameLength > 0 && (
            <p className="text-xs text-tft-muted mt-0.5">{formatDuration(gameLength)}</p>
          )}
        </div>
      </div>

      {/* Expand toggle */}
      {allPlayers.length > 0 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 w-full text-xs text-tft-muted hover:text-slate-300 transition-colors py-1 border-t border-tft-border/50"
        >
          {expanded ? '▲ Hide lobby' : '▼ Show all players'}
        </button>
      )}

      {/* Expanded: all 8 players */}
      {expanded && (
        <div className="mt-3 space-y-3">
          {allPlayers.map((p) => {
            const isTracked = p.puuid === participant.puuid
            const name = p.riotIdGameName ?? p.summonerName ?? 'Unknown'
            return (
              <div
                key={p.puuid}
                className={`rounded-lg p-2.5 ${
                  isTracked
                    ? 'border border-tft-gold/30 bg-tft-gold/5'
                    : 'border border-tft-border/40 bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <PlacementBadge placement={dispPlacement(p.placement)} small />
                  <span className={`text-sm font-medium ${isTracked ? 'text-tft-gold' : 'text-slate-300'}`}>
                    {name}
                  </span>
                  <TraitBadges traits={p.traits} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {(p.units ?? []).map((unit, i) => (
                    <UnitChip
                      key={`${unit.character_id}-${i}`}
                      unit={unit}
                      championMap={championMap}
                      itemMap={itemMap}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
