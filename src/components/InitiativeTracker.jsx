import { useState } from 'react'
import { useRoom } from '../context/RoomContext'
import './InitiativeTracker.css'

export default function InitiativeTracker({ readonly = false }) {
  const { initiative, updateInitiative } = useRoom()
  const [newName, setNewName]   = useState('')
  const [newInit, setNewInit]   = useState('')
  const [dragIdx, setDragIdx]   = useState(null)

  const entries = initiative?.entries || []
  const current = initiative?.current_index ?? 0

  // Sort by initiative descending
  const sorted = [...entries].sort((a, b) => b.initiative - a.initiative)

  const addEntry = () => {
    if (!newName.trim()) return
    const entry = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      initiative: parseInt(newInit) || 0,
      hp: '',
      conditions: []
    }
    const newEntries = [...entries, entry].sort((a, b) => b.initiative - a.initiative)
    updateInitiative(newEntries, 0)
    setNewName(''); setNewInit('')
  }

  const removeEntry = (id) => {
    const newEntries = entries.filter(e => e.id !== id)
    updateInitiative(newEntries, Math.min(current, Math.max(0, newEntries.length - 1)))
  }

  const nextTurn = () => {
    const next = entries.length > 0 ? (current + 1) % entries.length : 0
    updateInitiative(entries, next)
  }

  const prevTurn = () => {
    const prev = entries.length > 0
      ? (current - 1 + entries.length) % entries.length : 0
    updateInitiative(entries, prev)
  }

  // Drag to reorder
  const onDragStart = (e, idx) => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move' }
  const onDragOver  = (e, idx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const reordered = [...entries]
    const [moved]   = reordered.splice(dragIdx, 1)
    reordered.splice(idx, 0, moved)
    updateInitiative(reordered, current)
    setDragIdx(idx)
  }
  const onDragEnd   = () => setDragIdx(null)

  const updateEntryHP = (id, val) => {
    const upd = entries.map(e => e.id === id ? { ...e, hp: val } : e)
    updateInitiative(upd, current)
  }

  // current active name (from sorted list by index in unsorted entries)
  const activeEntry = entries[current]

  return (
    <div className="initiative-tracker panel">
      <div className="init-header">
        <div className="section-header" style={{ marginBottom: 0 }}>Initiative</div>
        {!readonly && entries.length > 0 && (
          <div className="init-turn-controls">
            <button className="btn btn-ghost btn-sm" onClick={prevTurn} title="Previous turn">◀</button>
            <button className="btn btn-red btn-sm"   onClick={nextTurn} title="Next turn">Next ▶</button>
          </div>
        )}
      </div>

      {entries.length === 0 && (
        <p className="init-empty">No entries. {!readonly && 'Add below.'}</p>
      )}

      <ul className="init-list">
        {entries.map((entry, idx) => (
          <li
            key={entry.id}
            className={`init-entry${idx === current ? ' active' : ''}${dragIdx === idx ? ' dragging' : ''}`}
            draggable={!readonly}
            onDragStart={e => onDragStart(e, idx)}
            onDragOver ={e => onDragOver(e, idx)}
            onDragEnd  ={onDragEnd}
          >
            {idx === current && <span className="init-sword" title="Active">⚔</span>}
            <span className="init-turn-num">{idx + 1}</span>
            <span className="init-score">{entry.initiative}</span>
            <span className="init-name">{entry.name}</span>
            {!readonly && (
              <input
                className="init-hp-input"
                type="text"
                placeholder="HP"
                value={entry.hp || ''}
                onChange={e => updateEntryHP(entry.id, e.target.value)}
                onClick={e => e.stopPropagation()}
                title="HP"
              />
            )}
            {!readonly && (
              <button
                className="init-remove-btn"
                onClick={() => removeEntry(entry.id)}
                title="Remove"
              >✕</button>
            )}
          </li>
        ))}
      </ul>

      {!readonly && (
        <div className="init-add-form">
          <input
            type="text"
            placeholder="Name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEntry()}
            className="init-input-name"
          />
          <input
            type="number"
            placeholder="Init"
            value={newInit}
            onChange={e => setNewInit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEntry()}
            className="init-input-score"
          />
          <button className="btn btn-sm" onClick={addEntry}>+ Add</button>
        </div>
      )}

      {readonly && activeEntry && (
        <div className="init-active-banner">
          <span className="init-active-label">Active:</span>
          <span className="init-active-name">{activeEntry.name}</span>
        </div>
      )}
    </div>
  )
}
