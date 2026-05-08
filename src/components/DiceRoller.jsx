import { useState, useCallback } from 'react'
import './DiceRoller.css'

const DICE = [4, 6, 8, 10, 100, 12, 20]

export default function DiceRoller() {
  const [pool, setPool]       = useState({})    // { 4:0, 6:2, 8:0, ... }
  const [modifier, setModifier] = useState(0)
  const [results, setResults] = useState(null)
  const [rolling, setRolling] = useState(false)

  const addDie   = (d) => setPool(p => ({ ...p, [d]: (p[d] || 0) + 1 }))
  const removeDie= (d) => setPool(p => ({ ...p, [d]: Math.max(0, (p[d] || 0) - 1) }))
  const clearPool= () => { setPool({}); setResults(null); setModifier(0) }

  const totalDice = Object.values(pool).reduce((s, n) => s + n, 0)

  const rollDie = (sides) => {
    if (sides === 100) {
      // d100 = d10 (tens) + d10 (units)
      const tens  = Math.floor(Math.random() * 10) * 10
      const units = Math.floor(Math.random() * 10)
      return tens + units || 100
    }
    return Math.floor(Math.random() * sides) + 1
  }

  const roll = useCallback(() => {
    if (totalDice === 0) return
    setRolling(true)

    setTimeout(() => {
      const rolls = []
      let total   = 0

      Object.entries(pool).forEach(([d, count]) => {
        const sides = parseInt(d)
        for (let i = 0; i < count; i++) {
          const val = rollDie(sides)
          rolls.push({ die: sides, value: val })
          total += val
        }
      })

      total += modifier
      setResults({ rolls, total, modifier })
      setRolling(false)
    }, 400)
  }, [pool, modifier, totalDice])

  const poolDescription = Object.entries(pool)
    .filter(([, n]) => n > 0)
    .map(([d, n]) => `${n}d${d}`)
    .join(' + ')

  const modStr = modifier !== 0
    ? (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`)
    : ''

  return (
    <div className="dice-roller panel">
      <div className="section-header">Dice</div>

      {/* Die buttons */}
      <div className="dice-buttons">
        {DICE.map(d => (
          <div key={d} className="die-control">
            <button
              className={`die-btn${(pool[d] || 0) > 0 ? ' active' : ''}`}
              onClick={() => addDie(d)}
              title={`Add d${d}`}
            >
              <span className="die-face">d{d}</span>
              {(pool[d] || 0) > 0 && <span className="die-count">{pool[d]}</span>}
            </button>
            {(pool[d] || 0) > 0 && (
              <button className="die-remove-btn" onClick={() => removeDie(d)} title="Remove">−</button>
            )}
          </div>
        ))}
      </div>

      {/* Modifier */}
      <div className="dice-modifier-row">
        <span className="dice-modifier-label">Modifier</span>
        <div className="modifier-controls">
          <button className="mod-btn" onClick={() => setModifier(m => m - 1)}>−</button>
          <span className="mod-value">{modifier >= 0 ? `+${modifier}` : modifier}</span>
          <button className="mod-btn" onClick={() => setModifier(m => m + 1)}>+</button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setModifier(0)}>Reset</button>
      </div>

      {/* Pool summary + Roll button */}
      <div className="dice-pool-row">
        <span className="dice-pool-desc">
          {totalDice > 0 ? `${poolDescription}${modStr}` : 'Select dice...'}
        </span>
        <div className="dice-actions">
          <button
            className={`btn btn-red roll-btn${rolling ? ' rolling' : ''}`}
            onClick={roll}
            disabled={totalDice === 0 || rolling}
          >
            {rolling ? '🎲 ...' : '🎲 Roll'}
          </button>
          {totalDice > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearPool}>Clear</button>
          )}
        </div>
      </div>

      {/* Results */}
      {results && !rolling && (
        <div className="dice-results">
          <div className="dice-result-rolls">
            {results.rolls.map((r, i) => (
              <span
                key={i}
                className={`die-result-chip${r.value === r.die || (r.die === 100 && r.value === 100) ? ' nat-max' : ''}${r.value === 1 ? ' nat-one' : ''}`}
                title={`d${r.die}`}
              >
                {r.value}
                <sup>d{r.die}</sup>
              </span>
            ))}
            {results.modifier !== 0 && (
              <span className="die-result-mod">
                {results.modifier > 0 ? `+${results.modifier}` : results.modifier}
              </span>
            )}
          </div>
          <div className="dice-total">
            <span className="dice-total-label">Total</span>
            <span className="dice-total-value">{results.total}</span>
          </div>
        </div>
      )}
    </div>
  )
}
