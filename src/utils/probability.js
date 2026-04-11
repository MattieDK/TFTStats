/**
 * TFT 3-star probability calculator
 *
 * This module calculates the probability of hitting 3-star for a champion
 * based on pool state derived from the spectator API.
 */

// Copies per champion in the shared pool by cost tier (as of TFT Set 14)
export const POOL_SIZE = { 1: 29, 2: 22, 3: 18, 4: 12, 5: 10 }

/**
 * Shop odds per player level: [1-cost%, 2-cost%, 3-cost%, 4-cost%, 5-cost%]
 * These are approximate values for TFT Set 14. Update if Riot changes them.
 */
export const LEVEL_ODDS = {
  1:  [1.00, 0.00, 0.00, 0.00, 0.00],
  2:  [1.00, 0.00, 0.00, 0.00, 0.00],
  3:  [0.75, 0.25, 0.00, 0.00, 0.00],
  4:  [0.55, 0.30, 0.15, 0.00, 0.00],
  5:  [0.45, 0.33, 0.20, 0.02, 0.00],
  6:  [0.30, 0.40, 0.25, 0.05, 0.00],
  7:  [0.19, 0.30, 0.35, 0.15, 0.01],
  8:  [0.16, 0.20, 0.35, 0.25, 0.04],
  9:  [0.09, 0.15, 0.30, 0.30, 0.16],
  10: [0.05, 0.10, 0.20, 0.40, 0.25],
  11: [0.01, 0.02, 0.12, 0.50, 0.35],
}

/**
 * Calculate 3-star probability for a single champion.
 *
 * @param {object} params
 * @param {number} params.cost               - Gold cost of the champion (1-5)
 * @param {number} params.copiesOwned        - Copies owned by the tracked player
 * @param {number} params.totalCopiesOut     - ALL copies of this champion out across all boards
 * @param {number} params.numChampsOfCost    - Total unique champions of this cost tier in the set
 * @param {number} params.totalCopiesOutOfCost - Total copies out for ALL champions of this cost
 * @param {number} params.playerLevel        - Player's current level (1-11)
 *
 * @returns {object} { copiesNeeded, copiesInPool, probabilityPerRoll, expectedRolls }
 */
export function calcThreeStarChance({
  cost,
  copiesOwned,
  totalCopiesOut,
  numChampsOfCost,
  totalCopiesOutOfCost,
  playerLevel,
}) {
  const poolSize    = POOL_SIZE[cost] ?? 20
  const copiesNeeded = Math.max(0, 9 - copiesOwned)

  if (copiesNeeded === 0) {
    return { copiesNeeded: 0, copiesInPool: 0, probabilityPerRoll: 1, expectedRolls: 0 }
  }

  // How many copies of THIS champion are still in the shared pool
  const copiesInPool = Math.max(0, poolSize - totalCopiesOut)

  // Total copies of ALL champions of this cost still in the pool
  const totalOfCostInPool = Math.max(0, numChampsOfCost * poolSize - totalCopiesOutOfCost)

  if (copiesInPool === 0 || totalOfCostInPool === 0) {
    return { copiesNeeded, copiesInPool: 0, probabilityPerRoll: 0, expectedRolls: Infinity }
  }

  // Probability that a single shop slot shows this cost tier
  const level       = Math.min(Math.max(playerLevel, 1), 11)
  const odds        = LEVEL_ODDS[level] ?? LEVEL_ODDS[8]
  const costOdds    = odds[cost - 1] ?? 0

  // P(specific champion appears in one slot) = costOdds × (copiesInPool / totalOfCostInPool)
  const pOneSlot = costOdds * (copiesInPool / totalOfCostInPool)

  // P(at least one copy in a 5-slot shop) – approximation treating slots as independent
  const probabilityPerRoll = 1 - Math.pow(1 - pOneSlot, 5)

  // Expected rolls to collect all needed copies (simplified: geometric per copy)
  const expectedRolls = probabilityPerRoll > 0
    ? Math.ceil(copiesNeeded / probabilityPerRoll)
    : Infinity

  return {
    copiesNeeded,
    copiesInPool,
    probabilityPerRoll,
    expectedRolls,
  }
}

/**
 * Given the full participant list from the spectator API and the champion map,
 * compute 3-star chances for all non-starred units on the tracked player's board.
 *
 * @param {object[]} participants  - spectator API participant objects
 * @param {string}   trackedPuuid  - PUUID of the player we're tracking
 * @param {object}   championMap   - { apiName_lc: { name, cost } }
 * @param {object[]} champsBySet   - CDragon champion list for current set
 *
 * @returns {Array} sorted array of { characterId, name, cost, ...calcResult }
 */
export function computeThreeStarChances(participants, trackedPuuid, championMap, champsBySet) {
  if (!participants?.length || !trackedPuuid) return []

  const trackedPlayer = participants.find((p) => p.puuid === trackedPuuid)
  if (!trackedPlayer) return []

  // Player level = number of units on board (reasonable approximation)
  const playerLevel = Math.max(1, Math.min(trackedPlayer.units?.length ?? 8, 11))

  // Build a map: characterId → total copies out across ALL boards
  const copiesOut = {}
  for (const participant of participants) {
    for (const unit of participant.units ?? []) {
      const id = (unit.characterId ?? '').toLowerCase()
      const copies = unit.tier === 3 ? 9 : unit.tier === 2 ? 3 : 1
      copiesOut[id] = (copiesOut[id] ?? 0) + copies
    }
  }

  // Group champions by cost for pool calculations
  const champsByCost = {}
  for (const champ of champsBySet) {
    const cost = champ.cost ?? 1
    champsByCost[cost] = (champsByCost[cost] ?? [])
    champsByCost[cost].push(champ.apiName?.toLowerCase())
  }

  // Pre-compute totalCopiesOutOfCost for each cost tier
  const totalOutByCost = {}
  for (const [cost, names] of Object.entries(champsByCost)) {
    totalOutByCost[cost] = names.reduce((s, n) => s + (copiesOut[n] ?? 0), 0)
  }

  // Calculate chances for each of the tracked player's non-3-star units
  const results = []
  const seen = new Set()

  for (const unit of trackedPlayer.units ?? []) {
    const id   = (unit.characterId ?? '').toLowerCase()
    if (seen.has(id)) continue
    seen.add(id)

    // Already 3-star
    if ((unit.tier ?? 1) === 3) continue

    const champ  = championMap[id] ?? { name: id, cost: 1 }
    const cost   = champ.cost
    const owned  = unit.tier === 2 ? 3 : 1

    const numChampsOfCost = (champsByCost[cost] ?? []).length || 1

    const result = calcThreeStarChance({
      cost,
      copiesOwned:           owned,
      totalCopiesOut:        copiesOut[id] ?? 0,
      numChampsOfCost,
      totalCopiesOutOfCost:  totalOutByCost[cost] ?? 0,
      playerLevel,
    })

    results.push({
      characterId: unit.characterId,
      name:        champ.name,
      cost,
      tier:        unit.tier ?? 1,
      ...result,
    })
  }

  // Sort by highest probability first (easiest to 3-star)
  results.sort((a, b) => b.probabilityPerRoll - a.probabilityPerRoll)
  return results
}
