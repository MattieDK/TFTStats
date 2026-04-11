import { getChampion, costBorderClass, costTextClass, costBgClass, starString } from '../../utils/tftUtils.js'

/**
 * Compact champion chip used in the match history cards.
 * Shows name, cost color, and star level.
 */
export default function UnitChip({ unit, championMap }) {
  // Match API uses "character_id" (snake_case); Spectator API uses "characterId"
  const charId = unit.character_id ?? unit.characterId ?? ''
  const champ  = getChampion(charId, championMap)
  const cost   = champ.cost ?? 1
  const tier   = unit.tier ?? 1

  return (
    <div
      title={`${champ.name} — ${cost}g — ${starString(tier)}`}
      className={[
        'inline-flex flex-col items-center px-2 py-1 rounded border-2 min-w-[44px]',
        costBorderClass(cost),
        costBgClass(cost),
      ].join(' ')}
    >
      <span className={`text-xs font-semibold leading-tight truncate max-w-[56px] ${costTextClass(cost)}`}>
        {champ.name}
      </span>
      <span className={`text-[10px] leading-none ${tier >= 3 ? 'text-yellow-300' : tier === 2 ? 'text-tft-gold' : 'text-slate-500'}`}>
        {starString(tier)}
      </span>
    </div>
  )
}
