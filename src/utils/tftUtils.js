/**
 * TFT utility helpers
 */

// Spectator API "rarity" → gold cost mapping (hexagonal rarity system)
const RARITY_TO_COST = { 0: 1, 1: 2, 2: 3, 4: 4, 6: 5 }

/**
 * Convert spectator API rarity value to gold cost.
 */
export function rarityCost(rarity) {
  return RARITY_TO_COST[rarity] ?? 1
}

/**
 * Look up a champion by its characterId (e.g. "TFT14_Ahri") in the champion map.
 * Returns { name, cost } or a fallback.
 */
export function getChampion(characterId, championMap) {
  const key = (characterId ?? '').toLowerCase()
  return championMap[key] ?? { name: formatCharId(characterId), cost: 1 }
}

/**
 * Format a raw characterId into a readable name as fallback.
 * e.g. "TFT14_Ahri" → "Ahri"
 */
export function formatCharId(characterId) {
  if (!characterId) return '???'
  const parts = characterId.split('_')
  return parts[parts.length - 1]
}

/**
 * Return the Tailwind border-color class for a champion's cost tier.
 */
export function costBorderClass(cost) {
  const map = { 1: 'border-cost-1', 2: 'border-cost-2', 3: 'border-cost-3', 4: 'border-cost-4', 5: 'border-cost-5' }
  return map[cost] ?? 'border-slate-600'
}

/**
 * Return the Tailwind text-color class for a champion's cost tier.
 */
export function costTextClass(cost) {
  const map = { 1: 'text-cost-1', 2: 'text-cost-2', 3: 'text-cost-3', 4: 'text-cost-4', 5: 'text-cost-5' }
  return map[cost] ?? 'text-slate-400'
}

/**
 * Return the Tailwind bg-color class for a champion's cost tier.
 */
export function costBgClass(cost) {
  const map = {
    1: 'bg-slate-500/20',
    2: 'bg-green-500/20',
    3: 'bg-blue-500/20',
    4: 'bg-purple-500/20',
    5: 'bg-yellow-600/20',
  }
  return map[cost] ?? 'bg-slate-500/20'
}

/**
 * Number of copies a unit represents based on its star level.
 * 1-star = 1 copy, 2-star = 3 copies, 3-star = 9 copies
 */
export function tierToCopies(tier) {
  if (tier === 3) return 9
  if (tier === 2) return 3
  return 1
}

/**
 * Calculate the total gold cost of a board.
 * Accounts for star level: a 2-star 4-cost is worth 4 * 3 = 12 gold, etc.
 */
export function boardGoldCost(units, championMap) {
  return units.reduce((sum, unit) => {
    const champ = getChampion(unit.characterId, championMap)
    const copies = tierToCopies(unit.tier ?? unit.rarity ?? 1)
    return sum + champ.cost * copies
  }, 0)
}

/**
 * Format a unix millisecond timestamp as a relative time string.
 */
export function relativeTime(ms) {
  const diff = Date.now() - ms
  const minutes = Math.floor(diff / 60000)
  const hours   = Math.floor(diff / 3600000)
  const days    = Math.floor(diff / 86400000)
  if (days > 0)    return `${days}d ago`
  if (hours > 0)   return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

/**
 * Format game length in seconds to "mm:ss".
 */
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Return ordinal string for a placement number.
 */
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/**
 * Format augment apiName to a readable label.
 * e.g. "TFT9_Augment_SomeCoolAugment" → "Some Cool Augment"
 */
export function formatAugment(apiName) {
  if (!apiName) return ''
  // Remove prefix like "TFT9_Augment_"
  const clean = apiName.replace(/^TFT\d+_Augment_/i, '')
  // Insert spaces before capital letters
  return clean.replace(/([A-Z])/g, ' $1').trim()
}

/**
 * Repeat a star character for the unit's tier.
 */
export function starString(tier) {
  return '★'.repeat(tier ?? 1)
}
