import {
  getChampion,
  costBorderClass,
  costTextClass,
  costBgClass,
  starString,
  tierToCopies,
} from '../../utils/tftUtils.js'

/**
 * A champion tile for the live board view — slightly larger than the history chip.
 */
function ChampionTile({ unit, championMap, highlight = false }) {
  const charId = unit.characterId ?? ''
  const champ  = getChampion(charId, championMap)
  const cost   = champ.cost ?? 1
  const tier   = unit.tier ?? 1

  return (
    <div
      title={`${champ.name} — ${cost}g — ${starString(tier)}\n${unit.itemNames?.join(', ') ?? ''}`}
      className={[
        'flex flex-col items-center justify-center rounded-lg border-2 w-16 h-16 transition-all',
        costBorderClass(cost),
        costBgClass(cost),
        highlight ? 'ring-2 ring-tft-gold ring-offset-1 ring-offset-tft-dark' : '',
      ].join(' ')}
    >
      <span className={`text-[11px] font-semibold text-center leading-tight px-0.5 truncate max-w-full ${costTextClass(cost)}`}>
        {champ.name}
      </span>
      <span className={`text-xs leading-none mt-0.5 ${tier >= 3 ? 'text-yellow-300' : tier === 2 ? 'text-tft-gold' : 'text-slate-500'}`}>
        {starString(tier)}
      </span>
      {unit.itemNames?.length > 0 && (
        <div className="flex gap-0.5 mt-0.5">
          {unit.itemNames.slice(0, 3).map((item, i) => (
            <div key={i} className="w-2 h-2 rounded-sm bg-slate-500" title={item} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Renders a single player's board with gold total.
 */
export default function PlayerBoard({
  participant,
  isTracked,
  goldCost,
  championMap,
  myCharacterIds = [],
}) {
  const displayName = participant.summonerName ?? participant.puuid?.slice(0, 12) ?? 'Unknown'
  const units       = participant.units ?? []

  return (
    <div
      className={[
        'card flex flex-col gap-3',
        isTracked ? 'border-tft-gold/60' : '',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isTracked && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-tft-gold/20 text-tft-gold border border-tft-gold/40">
              YOU
            </span>
          )}
          <span className={`text-sm font-medium ${isTracked ? 'text-white' : 'text-slate-300'}`}>
            {displayName}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-tft-muted">Board value</span>
          <span className="ml-2 text-sm font-bold text-tft-gold">{goldCost}g</span>
        </div>
      </div>

      {/* Units grid */}
      {units.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {units.map((unit, i) => {
            const charId   = (unit.characterId ?? '').toLowerCase()
            const highlight = isTracked ? false : myCharacterIds.includes(charId)
            return (
              <ChampionTile
                key={`${unit.characterId}-${i}`}
                unit={unit}
                championMap={championMap}
                highlight={highlight}
              />
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-tft-muted italic">No units visible</p>
      )}
    </div>
  )
}
