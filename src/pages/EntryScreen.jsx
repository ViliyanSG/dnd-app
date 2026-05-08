import { useState } from 'react'
import { useRoom } from '../context/RoomContext'
import './EntryScreen.css'

export default function EntryScreen() {
  const { createRoom, joinRoom, loading, error } = useRoom()

  const [mode, setMode]           = useState(null)       // 'dm' | 'player'
  const [dmName, setDmName]       = useState('')
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode]   = useState('')
  const [localError, setLocalError] = useState('')

  const handleDMEnter = async () => {
    if (!dmName.trim()) { setLocalError('Enter your name'); return }
    setLocalError('')
    await createRoom(dmName.trim())
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
        {/* Title */}
        <div className="entry-title-block">
          <div className="entry-title-line">⸻ ✦ ⸻</div>
          <h1 className="entry-title">Dungeons &amp; Dragons</h1>
          <h2 className="entry-subtitle">Companion</h2>
          <div className="entry-title-line">⸻ ✦ ⸻</div>
        </div>

        {!mode && (
          <div className="entry-choice">
            <p className="entry-choose-text">Choose your role</p>
            <div className="entry-buttons">
              <button className="entry-role-btn dm-btn" onClick={() => setMode('dm')}>
                <span className="role-icon">⚔️</span>
                <span className="role-title">Dungeon Master</span>
                <span className="role-desc">Create a new room and manage the session</span>
              </button>
              <button className="entry-role-btn player-btn" onClick={() => setMode('player')}>
                <span className="role-icon">🎲</span>
                <span className="role-title">Player</span>
                <span className="role-desc">Join a room with a code from the DM</span>
              </button>
            </div>
          </div>
        )}

        {mode === 'dm' && (
          <div className="entry-form panel">
            <div className="section-header">Dungeon Master — New Room</div>
            <div className="form-field">
              <label>Your name</label>
              <input
                type="text"
                placeholder="e.g. Lord of the Dungeons..."
                value={dmName}
                onChange={e => setDmName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDMEnter()}
                maxLength={40}
              />
            </div>
            {(localError || error) && <p className="entry-error">⚠ {localError || error}</p>}
            <div className="form-actions">
              <button className="btn btn-red btn-lg" onClick={handleDMEnter} disabled={loading}>
                {loading ? 'Creating...' : 'Create Room'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setMode(null); setLocalError('') }}>
                Back
              </button>
            </div>
          </div>
        )}

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
              <button className="btn btn-ghost btn-sm" onClick={() => { setMode(null); setLocalError('') }}>
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
