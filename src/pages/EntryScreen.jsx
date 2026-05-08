import { useState } from 'react'
import { useRoom } from '../context/RoomContext'
import { getSavedCharacters } from '../context/RoomContext'
import './EntryScreen.css'

export default function EntryScreen() {
  const { createRoom, joinRoom, joinWithSavedCharacter, rejoinRoom, loading, error } = useRoom()

  // null | 'dm' | 'dm-new' | 'dm-rejoin' | 'player-code' | 'player-select' | 'player-new'
  const [mode, setMode]             = useState(null)
  const [dmName, setDmName]         = useState('')
  const [rejoinCode, setRejoinCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode]     = useState('')
  const [savedChars, setSavedChars] = useState([])
  const [localError, setLocalError] = useState('')

  const back = (to = null) => { setMode(to); setLocalError('') }

  // ── DM handlers ──────────────────────────────────────────
  const handleDMCreate = async () => {
    if (!dmName.trim()) { setLocalError('Enter your name'); return }
    setLocalError('')
    await createRoom(dmName.trim())
  }

  const handleDMRejoin = async () => {
    if (!rejoinCode.trim()) { setLocalError('Enter the room code'); return }
    setLocalError('')
    const result = await rejoinRoom(rejoinCode.trim())
    if (!result) setLocalError('Room not found — check the code')
  }

  // ── Player: step 1 — enter room code ─────────────────────
  const handleCodeSubmit = () => {
    if (!roomCode.trim()) { setLocalError('Enter the room code'); return }
    setLocalError('')
    const chars = getSavedCharacters(roomCode.trim())
    if (chars.length > 0) {
      setSavedChars(chars)
      setMode('player-select')
    } else {
      setMode('player-new')
    }
  }

  // ── Player: pick a saved character ───────────────────────
  const handlePickSaved = async (char) => {
    setLocalError('')
    const result = await joinWithSavedCharacter(roomCode.trim(), char)
    if (!result) setLocalError('Invalid code or room not found')
  }

  // ── Player: join as new character ────────────────────────
  const handleNewCharacter = async () => {
    if (!playerName.trim()) { setLocalError('Enter your name'); return }
    setLocalError('')
    const result = await joinRoom(roomCode.trim(), playerName.trim())
    if (!result) setLocalError('Invalid code or room not found')
  }

  return (
    <div className="entry-screen">
      <div className="entry-bg-ornament top-left">❧</div>
      <div className="entry-bg-ornament top-right">❧</div>
      <div className="entry-bg-ornament bottom-left">❧</div>
      <div className="entry-bg-ornament bottom-right">❧</div>

      <div className="entry-container">
        <div className="entry-title-block">
          <div className="entry-title-line">⸻ ✦ ⸻</div>
          <h1 className="entry-title">Dungeons &amp; Dragons</h1>
          <h2 className="entry-subtitle">Companion</h2>
          <div className="entry-title-line">⸻ ✦ ⸻</div>
        </div>

        {/* ── Role choice ── */}
        {!mode && (
          <div className="entry-choice">
            <p className="entry-choose-text">Choose your role</p>
            <div className="entry-buttons">
              <button className="entry-role-btn dm-btn" onClick={() => setMode('dm')}>
                <span className="role-icon">⚔️</span>
                <span className="role-title">Dungeon Master</span>
                <span className="role-desc">Create or rejoin a session</span>
              </button>
              <button className="entry-role-btn player-btn" onClick={() => setMode('player-code')}>
                <span className="role-icon">🎲</span>
                <span className="role-title">Player</span>
                <span className="role-desc">Join a room with a code from the DM</span>
              </button>
            </div>
          </div>
        )}

        {/* ── DM: new or rejoin choice ── */}
        {mode === 'dm' && (
          <div className="entry-choice">
            <p className="entry-choose-text">Dungeon Master</p>
            <div className="entry-buttons">
              <button className="entry-role-btn dm-btn" onClick={() => setMode('dm-new')}>
                <span className="role-icon">✨</span>
                <span className="role-title">New Session</span>
                <span className="role-desc">Generate a fresh room code</span>
              </button>
              <button className="entry-role-btn dm-btn" onClick={() => setMode('dm-rejoin')}>
                <span className="role-icon">🔑</span>
                <span className="role-title">Rejoin Session</span>
                <span className="role-desc">Continue an existing session with its code</span>
              </button>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: '12px' }} onClick={() => back()}>
              Back
            </button>
          </div>
        )}

        {/* ── DM: new session ── */}
        {mode === 'dm-new' && (
          <div className="entry-form panel">
            <div className="section-header">Dungeon Master — New Session</div>
            <div className="form-field">
              <label>Your name</label>
              <input
                type="text"
                placeholder="e.g. Lord of the Dungeons..."
                value={dmName}
                onChange={e => setDmName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDMCreate()}
                maxLength={40}
                autoFocus
              />
            </div>
            {(localError || error) && <p className="entry-error">⚠ {localError || error}</p>}
            <div className="form-actions">
              <button className="btn btn-red btn-lg" onClick={handleDMCreate} disabled={loading}>
                {loading ? 'Creating...' : 'Create Room'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => back('dm')}>Back</button>
            </div>
          </div>
        )}

        {/* ── DM: rejoin session ── */}
        {mode === 'dm-rejoin' && (
          <div className="entry-form panel">
            <div className="section-header">Dungeon Master — Rejoin Session</div>
            <div className="form-field">
              <label>Room Code</label>
              <input
                type="text"
                placeholder="e.g. AB3X7K"
                value={rejoinCode}
                onChange={e => setRejoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleDMRejoin()}
                maxLength={6}
                className="code-input"
                autoFocus
              />
            </div>
            {(localError || error) && <p className="entry-error">⚠ {localError || error}</p>}
            <div className="form-actions">
              <button className="btn btn-red btn-lg" onClick={handleDMRejoin} disabled={loading}>
                {loading ? 'Joining...' : 'Rejoin Session'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => back('dm')}>Back</button>
            </div>
          </div>
        )}

        {/* ── Player: step 1 — enter room code ── */}
        {mode === 'player-code' && (
          <div className="entry-form panel">
            <div className="section-header">Player — Enter Room Code</div>
            <div className="form-field">
              <label>Room Code</label>
              <input
                type="text"
                placeholder="e.g. AB3X7K"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleCodeSubmit()}
                maxLength={6}
                className="code-input"
                autoFocus
              />
            </div>
            {localError && <p className="entry-error">⚠ {localError}</p>}
            <div className="form-actions">
              <button className="btn btn-lg" onClick={handleCodeSubmit} disabled={loading}>
                Continue
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => back()}>Back</button>
            </div>
          </div>
        )}

        {/* ── Player: step 2 — pick saved character or create new ── */}
        {mode === 'player-select' && (
          <div className="entry-form panel">
            <div className="section-header">Choose Your Character</div>
            <p className="entry-choose-text" style={{ marginBottom: '16px' }}>
              Room <strong style={{ color: 'var(--gold-light)', letterSpacing: '0.2em' }}>{roomCode}</strong>
            </p>
            <div className="saved-chars-list">
              {savedChars.map((char) => (
                <button
                  key={char.player_name}
                  className="saved-char-card"
                  onClick={() => handlePickSaved(char)}
                  disabled={loading}
                >
                  <div className="saved-char-name">
                    {char.character_name || char.player_name}
                  </div>
                  <div className="saved-char-meta">
                    <span className="saved-char-player">Player: {char.player_name}</span>
                    {char.character_data?.class && (
                      <span className="saved-char-class">
                        {char.character_data.class}
                        {char.character_data?.level ? ` Lv.${char.character_data.level}` : ''}
                      </span>
                    )}
                    <span className="saved-char-hp">HP {char.hp}/{char.max_hp}</span>
                  </div>
                </button>
              ))}
              <button
                className="saved-char-card saved-char-new"
                onClick={() => setMode('player-new')}
              >
                <div className="saved-char-name">+ New Character</div>
                <div className="saved-char-meta">
                  <span className="saved-char-player">Start fresh</span>
                </div>
              </button>
            </div>
            {(localError || error) && <p className="entry-error">⚠ {localError || error}</p>}
            <div className="form-actions" style={{ marginTop: '12px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => back('player-code')}>Back</button>
            </div>
          </div>
        )}

        {/* ── Player: new character name ── */}
        {mode === 'player-new' && (
          <div className="entry-form panel">
            <div className="section-header">Player — New Character</div>
            <div className="form-field">
              <label>Your name</label>
              <input
                type="text"
                placeholder="e.g. Aragorn of the Dúnedain..."
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNewCharacter()}
                maxLength={40}
                autoFocus
              />
            </div>
            {(localError || error) && <p className="entry-error">⚠ {localError || error}</p>}
            <div className="form-actions">
              <button className="btn btn-lg" onClick={handleNewCharacter} disabled={loading}>
                {loading ? 'Joining...' : 'Join Room'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => back(savedChars.length > 0 ? 'player-select' : 'player-code')}
              >
                Back
              </button>
            </div>
          </div>
        )}

        <p className="entry-version">D&amp;D 5e • 2024 Edition</p>
      </div>
    </div>
  )
}
