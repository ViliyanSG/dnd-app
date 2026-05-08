import { useState } from 'react'
import { useRoom } from '../context/RoomContext'
import './EntryScreen.css'

export default function EntryScreen() {
  const { createRoom, joinRoom, rejoinRoom, loading, error } = useRoom()

  const [mode, setMode]             = useState(null)  // null | 'dm' | 'dm-new' | 'dm-rejoin' | 'player'
  const [dmName, setDmName]         = useState('')
  const [rejoinCode, setRejoinCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode]     = useState('')
  const [localError, setLocalError] = useState('')

  const back = (to = null) => { setMode(to); setLocalError('') }

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

  const handlePlayerEnter = async () => {
    if (!playerName.trim()) { setLocalError('Enter your name'); return }
    if (!roomCode.trim())   { setLocalError('Enter the room code'); return }
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
              <button className="entry-role-btn player-btn" onClick={() => setMode('player')}>
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

        {/* ── Player ── */}
        {mode === 'player' && (
          <div className="entry-form panel">
            <div className="section-header">Player — Join Room</div>
            <div className="form-field">
              <label>Your name</label>
              <input
                type="text"
                placeholder="e.g. Aragorn of the Dúnedain..."
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                maxLength={40}
                autoFocus
              />
            </div>
            <div className="form-field">
              <label>Room Code</label>
              <input
                type="text"
                placeholder="e.g. AB3X7K"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handlePlayerEnter()}
                maxLength={6}
                className="code-input"
              />
            </div>
            {(localError || error) && <p className="entry-error">⚠ {localError || error}</p>}
            <div className="form-actions">
              <button className="btn btn-lg" onClick={handlePlayerEnter} disabled={loading}>
                {loading ? 'Joining...' : 'Join Room'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => back()}>Back</button>
            </div>
          </div>
        )}

        <p className="entry-version">D&amp;D 5e • 2024 Edition</p>
      </div>
    </div>
  )
}
