import { costBorderClass, costTextClass } from '../../utils/tftUtils.js'

/**
 * Displays 3-star probability for each non-3-starred champion on the player's board.
 * Sorted by highest probability first.
 */
export default function StarChancePanel({ chances }) {
  if (!chances || chances.length === 0) {
    return (
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">3★ Chances</h2>
        <p className="text-xs text-tft-muted italic">
          No non-3-starred units found on your board.
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">3★ Chances (if you roll)</h2>
      <p className="text-xs text-tft-muted mb-3">
        Probability per shop roll based on current pool state and estimated level.
      </p>

      <div className="space-y-2">
        {chances.map((c) => (
          <ChanceRow key={c.characterId} chance={c} />
        ))}
      </div>
    </div>
  )
}

function ChanceRow({ chance }) {
  const {
    name,
    cost,
    tier,
    copiesNeeded,
    copiesInPool,
    probabilityPerRoll,
    expectedRolls,
  } = chance

  const pct         = (probabilityPerRoll * 100).toFixed(1)
  const barWidth    = Math.min(probabilityPerRoll * 100, 100)
  const isImpossible = probabilityPerRoll === 0 || copiesInPool === 0

  return (
    <div className={`rounded-lg border px-3 py-2 ${costBorderClass(cost)} bg-white/3`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${costTextClass(cost)}`}>{name}</span>
          <span className="text-xs text-tft-muted">
            {tier === 2 ? '2★→3★' : '1★→3★'} · needs {copiesNeeded} copies
          </span>
        </div>
        <div className="text-right">
          {isImpossible ? (
            <span className="text-xs text-red-400">Out of pool</span>
          ) : (
            <>
              <span className="text-sm font-bold text-white">{pct}%</span>
              <span className="text-xs text-tft-muted ml-1">/ roll</span>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-tft-border overflow-hidden">
        <div
          className="h-full rounded-full bg-tft-gold transition-all"
          style={{ width: `${isImpossible ? 0 : barWidth}%` }}
        />
      </div>

      {/* Sub info */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-tft-muted">{copiesInPool} in pool</span>
        {!isImpossible && expectedRolls < Infinity && (
          <span className="text-xs text-tft-muted">~{expectedRolls} rolls expected</span>
        )}
      </div>
    </div>
  )
}
