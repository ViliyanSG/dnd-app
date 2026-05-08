import { useState } from 'react'
import { useRoom } from '../context/RoomContext'
import CharacterSheet    from '../components/CharacterSheet'
import InitiativeTracker from '../components/InitiativeTracker'
import MapViewer         from '../components/MapViewer'
import DiceRoller        from '../components/DiceRoller'
import DriveFilesBrowser from '../components/DriveFilesBrowser'
import './PlayerDashboard.css'

const TABS = [
  { key: 'sheet',      label: 'Sheet',      icon: '📋' },
  { key: 'map',        label: 'Map',        icon: '🗺' },
  { key: 'initiative', label: 'Initiative', icon: '⚔' },
  { key: 'books',      label: 'Books',      icon: '📚' },
]

export default function PlayerDashboard() {
  const { room, currentPlayer, leaveRoom, updateMyCharacter } = useRoom()
  const [activeTab, setActiveTab] = useState('sheet')

  const handleSave = async (updates) => { await updateMyCharacter(updates) }

  const playerName = currentPlayer?.player_name || localStorage.getItem('dnd_player_name') || 'Player'
  const charName   = currentPlayer?.character_name || ''

  return (
    <div className="player-dashboard">
      {/* Header */}
      <header className="player-header">
        <div className="player-header-left">
          <h1 className="player-title">🎲 {charName || playerName}</h1>
          {charName && <span className="player-name-sub">{playerName}</span>}
          <span className="player-room-code">Room: <strong>{room?.code}</strong></span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={leaveRoom}>Leave</button>
      </header>

      {/* Tab bar — no dice tab (dice is always visible below) */}
      <nav className="player-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`player-tab-btn${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Main: top = content, bottom = dice (always) */}
      <main className="player-main">

        {/* ── Content area (top half on mobile) ── */}
        <div className="player-content-area">
          {activeTab === 'sheet' && (
            <div className="player-panel player-sheet-panel">
              {currentPlayer
                ? <CharacterSheet player={currentPlayer} readonly={false} onSave={handleSave} />
                : <div className="player-loading"><p>Loading...</p></div>
              }
            </div>
          )}
          {activeTab === 'map' && (
            <div className="player-panel player-map-panel">
              <MapViewer readonly={true} />
            </div>
          )}
          {activeTab === 'initiative' && (
            <div className="player-panel player-init-panel">
              <InitiativeTracker readonly={true} />
            </div>
          )}
          {activeTab === 'books' && (
            <div className="player-panel player-books-panel">
              <DriveFilesBrowser />
            </div>
          )}
        </div>

        {/* ── Dice — always visible (bottom half on mobile) ── */}
        <div className="player-dice-area">
          <DiceRoller />
        </div>

      </main>
    </div>
  )
}
