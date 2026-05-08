import './PlayerCard.css'

const MOD = s => Math.floor((s - 10) / 2)
const fmt = n => (n >= 0 ? `+${n}` : `${n}`)

const hpColor = (hp, max) => {
  const pct = max > 0 ? hp / max : 0
  if (pct > 0.5) return 'high'
  if (pct > 0.25) return 'mid'
  return 'low'
}

export default function PlayerCard({ player, onClick }) {
  const { character_name, player_name, hp, max_hp, ac,
          str_score, dex_score, con_score, int_score, wis_score, cha_score } = player
  const hpPct  = max_hp > 0 ? Math.max(0, Math.min(100, (hp / max_hp) * 100)) : 0
  const color  = hpColor(hp, max_hp)
  const name   = character_name || player_name || 'Unknown'

  return (
    <div className="player-card panel" onClick={onClick} title="Click for full character sheet">
      <div className="pc-header">
        <span className="pc-name">{name}</span>
        <span className="pc-player-name">{player_name}</span>
      </div>

      <div className="pc-hp-section">
        <div className="pc-hp-text">
          <span className="pc-hp-label">HP</span>
          <span className="pc-hp-value">{hp} <span className="pc-hp-sep">/</span> {max_hp}</span>
        </div>
        <div className="hp-bar-container">
          <div className="hp-bar" style={{ width: `${hpPct}%` }} data-color={color}></div>
        </div>
      </div>

      <div className="pc-ac">
        <span className="pc-ac-icon">🛡</span>
        <span className="pc-ac-val">{ac}</span>
        <span className="pc-ac-label">AC</span>
      </div>

      <div className="pc-stats">
        {[
          { label: 'STR', val: str_score },
          { label: 'DEX', val: dex_score },
          { label: 'CON', val: con_score },
          { label: 'INT', val: int_score },
          { label: 'WIS', val: wis_score },
          { label: 'CHA', val: cha_score },
        ].map(({ label, val }) => (
          <div className="pc-stat" key={label}>
            <span className="pc-stat-label">{label}</span>
            <span className="pc-stat-score">{val}</span>
            <span className="pc-stat-mod">{fmt(MOD(val))}</span>
          </div>
        ))}
      </div>

      <div className="pc-click-hint">Click for details →</div>
    </div>
  )
}
