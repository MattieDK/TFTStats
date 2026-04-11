import { useState } from 'react'
import UnitChip from './UnitChip.jsx'
import { ordinal, relativeTime, formatDuration, formatAugment } from '../../utils/tftUtils.js'

function PlacementBadge({ placement }) {
  const cls = [
    'placement-1','placement-2','placement-3','placement-4',
    'placement-5','placement-6','placement-7','placement-8',
  ][placement - 1] ?? 'placement-8'

  return (
    <div className={`flex items-center justify-center w-14 h-14 rounded-xl text-xl font-bold shrink-0 ${cls}`}>
      {ordinal(placement)}
    </div>
  )
}

/**
 * Full match card. Shows placement, augments, board, and damage stats.
 * `participant` is the specific participant object for the tracked player.
 */
export default function MatchCard({ match, participant, championMap }) {
  const [expanded, setExpanded] = useState(false)

  if (!participant) return null

  const {
    placement,
    level,
    augments = [],
    units    = [],
    total_damage_to_players: damage = 0,
    last_round:  lastRound = 0,
    gold_left:   goldLeft  = 0,
    players_eliminated: eliminated = 0,
  } = participant

  const gameMs     = match.info?.game_datetime ?? 0
  const gameLength = match.info?.game_length   ?? 0

  return (
    <div className="card hover:border-tft-border/60 transition-colors">
      <div className="flex items-start gap-4">
        {/* Placement */}
        <PlacementBadge placement={placement} />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-300 text-sm">
              Lvl <strong className="text-white">{level}</strong>
            </span>
            <span className="text-tft-muted text-sm">•</span>
            <span className="text-slate-300 text-sm">
              Round <strong className="text-white">{lastRound}</strong>
            </span>
            <span className="text-tft-muted text-sm">•</span>
            <span className="text-slate-300 text-sm">
              Dmg dealt <strong className="text-white">{damage}</strong>
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
              Gold left <strong className="text-tft-gold">{goldLeft}</strong>
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

          {/* Units */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {units.map((unit, i) => (
              <UnitChip key={`${unit.character_id}-${i}`} unit={unit} championMap={championMap} />
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
    </div>
  )
}
