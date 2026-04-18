import { getChampion, costBorderClass, costTextClass, costBgClass, starString } from '../../utils/tftUtils.js'

/**
 * Resolve item names from a unit. Handles both formats:
 * - item_names: array of API name strings (newer)
 * - items: array of integer IDs (legacy)
 */
// Returns array of { name, icon } objects
function resolveItems(unit, itemMap) {
  if (!itemMap) return []
  const apiNames = unit.itemNames ?? unit.item_names ?? []
  const ids      = unit.items ?? []

  const resolved = []
  for (const n of apiNames) {
    const entry = itemMap[n.toLowerCase()] ?? itemMap[n]
    if (entry) resolved.push(entry)
  }
  if (resolved.length === 0) {
    for (const id of ids) {
      const entry = itemMap[id]
      if (entry) resolved.push(entry)
    }
  }
  return resolved
}

/**
 * Compact champion chip used in the match history cards.
 * Shows name, cost color, star level, and equipped items.
 */
export default function UnitChip({ unit, championMap, itemMap }) {
  // Match API uses "character_id" (snake_case); Spectator API uses "characterId"
  const charId = unit.character_id ?? unit.characterId ?? ''
  const champ  = getChampion(charId, championMap)
  const cost   = champ.cost ?? 1
  const tier   = unit.tier ?? 1
  const items = resolveItems(unit, itemMap)

  return (
    <div
      title={[
        `${champ.name} — ${cost}g — ${starString(tier)}`,
        items.length ? `Items: ${items.map((i) => i.name).join(', ')}` : '',
      ].filter(Boolean).join('\n')}
      className={[
        'inline-flex flex-col items-center px-2.5 py-1.5 rounded border-2 min-w-[64px] max-w-[80px]',
        costBorderClass(cost),
        costBgClass(cost),
      ].join(' ')}
    >
      <span className={`text-xs font-semibold leading-tight text-center w-full break-words ${costTextClass(cost)}`}>
        {champ.name}
      </span>
      <span className={`text-[10px] leading-none ${tier >= 3 ? 'text-yellow-300' : tier === 2 ? 'text-tft-gold' : 'text-slate-500'}`}>
        {starString(tier)}
      </span>
      {items.length > 0 && (
        <div className="flex gap-0.5 mt-1 justify-center">
          {items.map((item, i) => (
            item.icon
              ? <img key={i} src={item.icon} alt={item.name} title={item.name} className="w-5 h-5 rounded-sm" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              : <span key={i} title={item.name} className="w-5 h-5 rounded-sm bg-slate-700 text-[8px] flex items-center justify-center text-slate-400">?</span>
          ))}
        </div>
      )}
    </div>
  )
}
