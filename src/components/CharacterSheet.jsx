import { useState, useEffect } from 'react'
import './CharacterSheet.css'

const MOD = s => Math.floor((s - 10) / 2)
const fmt = n => (n >= 0 ? `+${n}` : `${n}`)

const ABILITIES = [
  { key: 'str_score', label: 'STR', full: 'Strength' },
  { key: 'dex_score', label: 'DEX', full: 'Dexterity' },
  { key: 'con_score', label: 'CON', full: 'Constitution' },
  { key: 'int_score', label: 'INT', full: 'Intelligence' },
  { key: 'wis_score', label: 'WIS', full: 'Wisdom' },
  { key: 'cha_score', label: 'CHA', full: 'Charisma' },
]

const SKILLS = [
  { name: 'Acrobatics',     key: 'acrobatics',      ability: 'dex_score' },
  { name: 'Animal Handling',key: 'animal_handling', ability: 'wis_score' },
  { name: 'Arcana',         key: 'arcana',          ability: 'int_score' },
  { name: 'Athletics',      key: 'athletics',       ability: 'str_score' },
  { name: 'Deception',      key: 'deception',       ability: 'cha_score' },
  { name: 'History',        key: 'history',         ability: 'int_score' },
  { name: 'Insight',        key: 'insight',         ability: 'wis_score' },
  { name: 'Intimidation',   key: 'intimidation',    ability: 'cha_score' },
  { name: 'Investigation',  key: 'investigation',   ability: 'int_score' },
  { name: 'Medicine',       key: 'medicine',        ability: 'wis_score' },
  { name: 'Nature',         key: 'nature',          ability: 'int_score' },
  { name: 'Perception',     key: 'perception',      ability: 'wis_score' },
  { name: 'Performance',    key: 'performance',     ability: 'cha_score' },
  { name: 'Persuasion',     key: 'persuasion',      ability: 'cha_score' },
  { name: 'Religion',       key: 'religion',        ability: 'int_score' },
  { name: 'Sleight of Hand',key: 'sleight_of_hand', ability: 'dex_score' },
  { name: 'Stealth',        key: 'stealth',         ability: 'dex_score' },
  { name: 'Survival',       key: 'survival',        ability: 'wis_score' },
]

const SAVING_THROWS = [
  { label: 'STR', key: 'str', abilityKey: 'str_score' },
  { label: 'DEX', key: 'dex', abilityKey: 'dex_score' },
  { label: 'CON', key: 'con', abilityKey: 'con_score' },
  { label: 'INT', key: 'int', abilityKey: 'int_score' },
  { label: 'WIS', key: 'wis', abilityKey: 'wis_score' },
  { label: 'CHA', key: 'cha', abilityKey: 'cha_score' },
]

const DEFAULT_DATA = {
  character_class: '', level: 1, background: '', race: '', alignment: '', experience: 0,
  speed: 30, initiative_bonus: 0, proficiency_bonus: 2, inspiration: false,
  temp_hp: 0, hit_dice: '1d8',
  death_successes: 0, death_failures: 0,
  saving_throws: {},
  skills: {},
  attacks: '',
  equipment: '',
  features: '',
  personality: '', ideals: '', bonds: '', flaws: '',
  notes: '',
}

// Defined OUTSIDE the main component so React never treats them as new component types on re-render
function SheetInput({ value, onChange, readonly, type = 'text', className = '', ...rest }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      readOnly={readonly}
      onChange={e => !readonly && onChange(
        type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value
      )}
      className={className}
      {...rest}
    />
  )
}

function SheetTextArea({ value, onChange, readonly, ...rest }) {
  return (
    <textarea
      value={value ?? ''}
      readOnly={readonly}
      onChange={e => !readonly && onChange(e.target.value)}
      rows={3}
      {...rest}
    />
  )
}

export default function CharacterSheet({ player, onSave, readonly = false }) {
  const [stats, setStats] = useState({})
  const [data,  setData]  = useState({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!player) return
    setStats({
      str_score: player.str_score ?? 10,
      dex_score: player.dex_score ?? 10,
      con_score: player.con_score ?? 10,
      int_score: player.int_score ?? 10,
      wis_score: player.wis_score ?? 10,
      cha_score: player.cha_score ?? 10,
      hp:        player.hp ?? 10,
      max_hp:    player.max_hp ?? 10,
      ac:        player.ac ?? 10,
      character_name: player.character_name ?? '',
      player_name:    player.player_name ?? '',
    })
    setData({ ...DEFAULT_DATA, ...(player.character_data || {}) })
    setDirty(false)
  }, [player?.id])

  const setStat  = (key, val) => { setStats(s => ({ ...s, [key]: val })); setDirty(true) }
  const setField = (key, val) => { setData(d  => ({ ...d,  [key]: val })); setDirty(true) }
  const toggleProf = (group, key) => {
    setData(d => ({ ...d, [group]: { ...(d[group] || {}), [key]: !(d[group]?.[key]) } }))
    setDirty(true)
  }

  const handleSave = () => {
    if (onSave) {
      onSave({ ...stats, character_name: stats.character_name, character_data: data })
      setDirty(false)
    }
  }

  const profBonus  = data.proficiency_bonus || 2
  const skillBonus = (skill) => MOD(stats[skill.ability] ?? 10) + (data.skills?.[skill.key] ? profBonus : 0)
  const saveBonus  = (st)    => MOD(stats[st.abilityKey]  ?? 10) + (data.saving_throws?.[st.key] ? profBonus : 0)
  const passivePerception = 10 + skillBonus(SKILLS.find(s => s.key === 'perception'))

  return (
    <div className="character-sheet">
      {/* ── Header ── */}
      <div className="cs-header">
        <div className="cs-title-block">
          <div className="cs-title">Character Sheet</div>
          <div className="cs-subtitle">Dungeons &amp; Dragons • 5th Edition</div>
        </div>
        {!readonly && dirty && (
          <button className="btn btn-red" onClick={handleSave}>💾 Save</button>
        )}
      </div>

      {/* ── Top Info ── */}
      <div className="cs-top-info">
        <div className="cs-info-field wide">
          <label>Character Name</label>
          <SheetInput value={stats.character_name} onChange={v => setStat('character_name', v)} readonly={readonly} className="cs-char-name-input" />
        </div>
        <div className="cs-info-field">
          <label>Class</label>
          <SheetInput value={data.character_class} onChange={v => setField('character_class', v)} readonly={readonly} />
        </div>
        <div className="cs-info-field narrow">
          <label>Level</label>
          <SheetInput value={data.level} onChange={v => setField('level', v)} readonly={readonly} type="number" />
        </div>
        <div className="cs-info-field">
          <label>Race</label>
          <SheetInput value={data.race} onChange={v => setField('race', v)} readonly={readonly} />
        </div>
        <div className="cs-info-field">
          <label>Background</label>
          <SheetInput value={data.background} onChange={v => setField('background', v)} readonly={readonly} />
        </div>
        <div className="cs-info-field">
          <label>Alignment</label>
          <SheetInput value={data.alignment} onChange={v => setField('alignment', v)} readonly={readonly} />
        </div>
        <div className="cs-info-field narrow">
          <label>XP</label>
          <SheetInput value={data.experience} onChange={v => setField('experience', v)} readonly={readonly} type="number" />
        </div>
      </div>

      <div className="cs-body">
        {/* ── Left Column ── */}
        <div className="cs-left">
          <div className="cs-abilities">
            {ABILITIES.map(({ key, label }) => (
              <div key={key} className="cs-ability-box">
                <span className="cs-ability-label">{label}</span>
                <SheetInput
                  value={stats[key]} onChange={v => setStat(key, v)} readonly={readonly}
                  type="number" className="cs-ability-score" min={1} max={30}
                />
                <div className="cs-ability-mod">{fmt(MOD(stats[key] ?? 10))}</div>
              </div>
            ))}
          </div>

          <div className="cs-misc-row">
            <div className="cs-misc-box">
              <label>Inspiration</label>
              <input
                type="checkbox"
                checked={!!data.inspiration}
                onChange={() => !readonly && setField('inspiration', !data.inspiration)}
                className="cs-checkbox"
              />
            </div>
            <div className="cs-misc-box">
              <label>Proficiency Bonus</label>
              <SheetInput value={data.proficiency_bonus} onChange={v => setField('proficiency_bonus', v)} readonly={readonly} type="number" className="cs-small-num" />
            </div>
          </div>

          <div className="cs-section">
            <div className="section-header">Saving Throws</div>
            {SAVING_THROWS.map(st => (
              <div key={st.key} className="prof-row">
                <span
                  className={`prof-dot${data.saving_throws?.[st.key] ? ' active' : ''}`}
                  onClick={() => !readonly && toggleProf('saving_throws', st.key)}
                />
                <span className="prof-value">{fmt(saveBonus(st))}</span>
                <span className="prof-name">{st.label}</span>
              </div>
            ))}
          </div>

          <div className="cs-section">
            <div className="section-header">Skills</div>
            {SKILLS.map(skill => (
              <div key={skill.key} className="prof-row">
                <span
                  className={`prof-dot${data.skills?.[skill.key] ? ' active' : ''}`}
                  onClick={() => !readonly && toggleProf('skills', skill.key)}
                />
                <span className="prof-value">{fmt(skillBonus(skill))}</span>
                <span className="prof-name">{skill.name}</span>
                <span className="prof-ability">{skill.ability.substring(0, 3).toUpperCase()}</span>
              </div>
            ))}
          </div>

          <div className="cs-passive-box">
            <span className="cs-passive-label">Passive Perception</span>
            <span className="cs-passive-val">{passivePerception}</span>
          </div>
        </div>

        {/* ── Middle Column ── */}
        <div className="cs-middle">
          <div className="cs-combat-row">
            <div className="cs-combat-box">
              <label>AC</label>
              <SheetInput value={stats.ac} onChange={v => setStat('ac', v)} readonly={readonly} type="number" className="cs-combat-input" />
            </div>
            <div className="cs-combat-box">
              <label>Initiative</label>
              <SheetInput value={data.initiative_bonus} onChange={v => setField('initiative_bonus', v)} readonly={readonly} type="number" className="cs-combat-input" />
            </div>
            <div className="cs-combat-box">
              <label>Speed</label>
              <SheetInput value={data.speed} onChange={v => setField('speed', v)} readonly={readonly} type="number" className="cs-combat-input" />
            </div>
          </div>

          <div className="cs-hp-block">
            <div className="section-header">Hit Points</div>
            <div className="cs-hp-row">
              <div className="cs-hp-field">
                <label>Max HP</label>
                <SheetInput value={stats.max_hp} onChange={v => setStat('max_hp', v)} readonly={readonly} type="number" className="cs-hp-input" />
              </div>
              <div className="cs-hp-field large">
                <label>Current HP</label>
                <SheetInput value={stats.hp} onChange={v => setStat('hp', v)} readonly={readonly} type="number" className="cs-hp-input large" />
              </div>
              <div className="cs-hp-field">
                <label>Temp HP</label>
                <SheetInput value={data.temp_hp} onChange={v => setField('temp_hp', v)} readonly={readonly} type="number" className="cs-hp-input" />
              </div>
            </div>
          </div>

          <div className="cs-dice-death-row">
            <div className="cs-section cs-hit-dice">
              <div className="section-header">Hit Dice</div>
              <SheetInput value={data.hit_dice} onChange={v => setField('hit_dice', v)} readonly={readonly} placeholder="1d8" />
            </div>
            <div className="cs-section cs-death-saves">
              <div className="section-header">Death Saves</div>
              <div className="cs-death-row">
                <label>Successes</label>
                <div className="cs-death-dots">
                  {[0,1,2].map(i => (
                    <span
                      key={i}
                      className={`prof-dot${(data.death_successes ?? 0) > i ? ' active' : ''}`}
                      style={{ '--dot-color': '#2d8a2d' }}
                      onClick={() => !readonly && setField('death_successes', (data.death_successes ?? 0) > i ? i : i + 1)}
                    />
                  ))}
                </div>
              </div>
              <div className="cs-death-row">
                <label>Failures</label>
                <div className="cs-death-dots">
                  {[0,1,2].map(i => (
                    <span
                      key={i}
                      className={`prof-dot${(data.death_failures ?? 0) > i ? ' active' : ''}`}
                      onClick={() => !readonly && setField('death_failures', (data.death_failures ?? 0) > i ? i : i + 1)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="cs-section">
            <div className="section-header">Attacks &amp; Spells</div>
            <SheetTextArea value={data.attacks} onChange={v => setField('attacks', v)} readonly={readonly} rows={4} placeholder="Weapon / Attack / Damage & type..." />
          </div>

          <div className="cs-section">
            <div className="section-header">Equipment</div>
            <SheetTextArea value={data.equipment} onChange={v => setField('equipment', v)} readonly={readonly} rows={4} placeholder="Coins, items, weapons..." />
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="cs-right">
          <div className="cs-section">
            <div className="section-header">Personality Traits</div>
            <SheetTextArea value={data.personality} onChange={v => setField('personality', v)} readonly={readonly} rows={3} placeholder="How I act, look, speak..." />
          </div>
          <div className="cs-section">
            <div className="section-header">Ideals</div>
            <SheetTextArea value={data.ideals} onChange={v => setField('ideals', v)} readonly={readonly} rows={2} placeholder="Something I believe in..." />
          </div>
          <div className="cs-section">
            <div className="section-header">Bonds</div>
            <SheetTextArea value={data.bonds} onChange={v => setField('bonds', v)} readonly={readonly} rows={2} placeholder="People, places, things important to me..." />
          </div>
          <div className="cs-section">
            <div className="section-header">Flaws</div>
            <SheetTextArea value={data.flaws} onChange={v => setField('flaws', v)} readonly={readonly} rows={2} placeholder="Something that could be my downfall..." />
          </div>

          <div className="cs-section">
            <div className="section-header">Features &amp; Traits</div>
            <SheetTextArea value={data.features} onChange={v => setField('features', v)} readonly={readonly} rows={6} placeholder="Racial abilities, class features, feats..." />
          </div>

          <div className="cs-section">
            <div className="section-header">Notes</div>
            <SheetTextArea value={data.notes} onChange={v => setField('notes', v)} readonly={readonly} rows={4} placeholder="..." />
          </div>

          {!readonly && (
            <button
              className={`btn${dirty ? ' btn-red' : ' btn-ghost'} w-full mt-12`}
              onClick={handleSave}
              disabled={!dirty}
            >
              {dirty ? '💾 Save Changes' : '✓ Saved'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
