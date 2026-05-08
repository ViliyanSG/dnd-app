import { useState } from 'react'
import { useRoom } from '../context/RoomContext'
import PlayerCard        from '../components/PlayerCard'
import CharacterSheet    from '../components/CharacterSheet'
import InitiativeTracker from '../components/InitiativeTracker'
import MapViewer         from '../components/MapViewer'
import DiceRoller        from '../components/DiceRoller'
import DriveFilesBrowser from '../components/DriveFilesBrowser'
import Modal             from '../components/Modal'
import './DMDashboard.css'

const MOBILE_TABS = [
  { key: 'players',    icon: '👤' },
  { key: 'map',        icon: '🗺' },
  { key: 'initiative', icon: '⚔' },
  { key: 'books',      icon: '📚' },
]

export default function DMDashboard() {
  const { room, players, leaveRoom, updatePlayer } = useRoom()
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [activePanel, setActivePanel]       = useState('map')

  const handleSavePlayer = async (playerId, updates) => {
    await updatePlayer(playerId, updates)
    setSelectedPlayer(prev => prev ? { ...prev, ...updates } : null)
  }

  return (
    <div className="dm-dashboard">
      {/* ── Header ── */}
      <header className="dm-header">
        <div className="dm-header-left">
          <h1 className="dm-title">⚔ Dungeon Master</h1>
          <span className="dm-room-code">Room: <strong>{room?.code}</strong></span>
        </div>
        <div className="dm-header-right">
          <span className="dm-player-count">{players.length} player{players.length !== 1 ? 's' : ''}</span>
          <button className="btn btn-ghost btn-sm" onClick={leaveRoom}>Leave</button>
        </div>
      </header>

      {/* ── Mobile Tab Bar (no dice — always at bottom) ── */}
      <div className="dm-mobile-tabs">
        {MOBILE_TABS.map(tab => (
          <button
            key={tab.key}
            className={`dm-tab-btn${activePanel === tab.key ? ' active' : ''}`}
            onClick={() => setActivePanel(tab.key)}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {/* ── Main Grid (desktop) / Split (mobile) ── */}
      <main className="dm-main">

        {/* ── Top panels wrapper (mobile: top 50%) ── */}
        <div className="dm-panels-wrapper">
          <section className={`dm-section dm-players${activePanel !== 'players' ? ' dm-hidden-mobile' : ''}`}>
            <div className="section-header">Players</div>
            {players.length === 0 ? (
              <div className="dm-no-players">
                <p>Waiting for players...</p>
                <p className="dm-room-share">Share the code <strong>{room?.code}</strong></p>
              </div>
            ) : (
              <div className="dm-players-grid">
                {players.map(p => (
                  <PlayerCard key={p.id} player={p} onClick={() => setSelectedPlayer(p)} />
                ))}
              </div>
            )}
          </section>

          <section className={`dm-section dm-map${activePanel !== 'map' ? ' dm-hidden-mobile' : ''}`}>
            <MapViewer readonly={false} />
          </section>

          <section className={`dm-section dm-initiative${activePanel !== 'initiative' ? ' dm-hidden-mobile' : ''}`}>
            <InitiativeTracker readonly={false} />
          </section>

          <section className={`dm-section dm-books${activePanel !== 'books' ? ' dm-hidden-mobile' : ''}`}>
            <DriveFilesBrowser />
          </section>
        </div>

        {/* ── Dice — always visible (mobile: bottom 50%) ── */}
        <section className="dm-section dm-dice">
          <DiceRoller />
        </section>
      </main>

      {selectedPlayer && (
        <Modal onClose={() => setSelectedPlayer(null)} maxWidth="1100px">
          <CharacterSheet
            player={selectedPlayer}
            readonly={false}
            onSave={(updates) => handleSavePlayer(selectedPlayer.id, updates)}
          />
        </Modal>
      )}
    </div>
  )
}
