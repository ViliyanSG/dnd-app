import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const RoomContext = createContext(null)

// ── localStorage helpers ──────────────────────────────────
const CHARS_KEY = 'dnd_saved_characters'

function saveCharacterLocally(player) {
  try {
    const all = JSON.parse(localStorage.getItem(CHARS_KEY) || '{}')
    const list = all[player.room_code] || []
    const idx  = list.findIndex(c => c.player_name === player.player_name)
    const entry = {
      player_name:    player.player_name,
      character_name: player.character_name || '',
      character_data: player.character_data || {},
      hp:        player.hp        ?? 10,
      max_hp:    player.max_hp    ?? 10,
      ac:        player.ac        ?? 10,
      str_score: player.str_score ?? 10,
      dex_score: player.dex_score ?? 10,
      con_score: player.con_score ?? 10,
      int_score: player.int_score ?? 10,
      wis_score: player.wis_score ?? 10,
      cha_score: player.cha_score ?? 10,
      saved_at:  new Date().toISOString(),
    }
    if (idx >= 0) list[idx] = entry
    else list.push(entry)
    all[player.room_code] = list
    localStorage.setItem(CHARS_KEY, JSON.stringify(all))
  } catch(_) {}
}

export function getSavedCharacters(roomCode) {
  try {
    const all = JSON.parse(localStorage.getItem(CHARS_KEY) || '{}')
    return all[roomCode?.toUpperCase()] || []
  } catch(_) { return [] }
}

export function RoomProvider({ children }) {
  const [room, setRoom]               = useState(null)
  const [role, setRole]               = useState(null)
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [players, setPlayers]         = useState([])
  const [initiative, setInitiative]   = useState({ entries: [], current_index: 0 })
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const channelRef = useRef(null)

  const modifierOf = (score) => Math.floor((score - 10) / 2)

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  // ── Create room (DM) ──────────────────────────────────────
  const createRoom = useCallback(async (dmName) => {
    setLoading(true); setError(null)
    try {
      const code = generateCode()
      if (isConfigured()) {
        const { error: err } = await supabase.from('rooms').insert({
          code, dm_name: dmName, map_url: null,
          map_config: { x: 0, y: 0, scale: 1 }
        })
        if (err) throw err
        await supabase.from('initiative_tracker').insert({ room_code: code, entries: [], current_index: 0 })
      }
      setRoom({ code, dm_name: dmName, map_url: null, map_config: { x: 0, y: 0, scale: 1 } })
      setRole('dm')
      localStorage.setItem('dnd_room', code)
      localStorage.setItem('dnd_role', 'dm')
      localStorage.setItem('dnd_dm_name', dmName)
      return code
    } catch (e) {
      setError(e.message); return null
    } finally { setLoading(false) }
  }, [])

  // ── Rejoin room as DM ─────────────────────────────────────
  const rejoinRoom = useCallback(async (code) => {
    setLoading(true); setError(null)
    try {
      const upperCode = code.toUpperCase()
      if (isConfigured()) {
        const { data: roomData, error: roomErr } = await supabase
          .from('rooms').select('*').eq('code', upperCode).single()
        if (roomErr) throw new Error('Room not found')
        setRoom(roomData)
      } else {
        setRoom({ code: upperCode, map_url: null, map_config: { x: 0, y: 0, scale: 1 } })
      }
      setRole('dm')
      localStorage.setItem('dnd_room', upperCode)
      localStorage.setItem('dnd_role', 'dm')
      return upperCode
    } catch (e) {
      setError(e.message); return null
    } finally { setLoading(false) }
  }, [])

  // ── Join room — new character (Player) ────────────────────
  const joinRoom = useCallback(async (code, playerName) => {
    setLoading(true); setError(null)
    try {
      const upperCode = code.toUpperCase()
      if (isConfigured()) {
        const { data: roomData, error: roomErr } = await supabase
          .from('rooms').select('*').eq('code', upperCode).single()
        if (roomErr) throw new Error('Room not found')
        setRoom(roomData)

        const { data: playerData, error: playerErr } = await supabase
          .from('room_players')
          .upsert({ room_code: upperCode, player_name: playerName }, { onConflict: 'room_code,player_name' })
          .select().single()
        if (playerErr) throw playerErr
        setCurrentPlayer(playerData)
        saveCharacterLocally(playerData)
        localStorage.setItem('dnd_player_id', playerData.id)
      } else {
        setRoom({ code: upperCode, map_url: null, map_config: { x: 0, y: 0, scale: 1 } })
      }
      setRole('player')
      localStorage.setItem('dnd_room', upperCode)
      localStorage.setItem('dnd_role', 'player')
      localStorage.setItem('dnd_player_name', playerName)
      return upperCode
    } catch (e) {
      setError(e.message); return null
    } finally { setLoading(false) }
  }, [])

  // ── Join with saved character (restores all data) ─────────
  const joinWithSavedCharacter = useCallback(async (code, savedChar) => {
    setLoading(true); setError(null)
    try {
      const upperCode = code.toUpperCase()
      if (isConfigured()) {
        const { data: roomData, error: roomErr } = await supabase
          .from('rooms').select('*').eq('code', upperCode).single()
        if (roomErr) throw new Error('Room not found')
        setRoom(roomData)

        // Upsert player row
        const { data: playerData, error: playerErr } = await supabase
          .from('room_players')
          .upsert({ room_code: upperCode, player_name: savedChar.player_name }, { onConflict: 'room_code,player_name' })
          .select().single()
        if (playerErr) throw playerErr

        // Restore saved character data
        const restore = {
          character_name: savedChar.character_name,
          character_data: savedChar.character_data,
          hp:        savedChar.hp,
          max_hp:    savedChar.max_hp,
          ac:        savedChar.ac,
          str_score: savedChar.str_score,
          dex_score: savedChar.dex_score,
          con_score: savedChar.con_score,
          int_score: savedChar.int_score,
          wis_score: savedChar.wis_score,
          cha_score: savedChar.cha_score,
        }
        const { data: restored } = await supabase
          .from('room_players').update(restore).eq('id', playerData.id).select().single()

        setCurrentPlayer(restored || { ...playerData, ...restore })
        localStorage.setItem('dnd_player_id', playerData.id)
      } else {
        setRoom({ code: upperCode, map_url: null, map_config: { x: 0, y: 0, scale: 1 } })
      }
      setRole('player')
      localStorage.setItem('dnd_room', upperCode)
      localStorage.setItem('dnd_role', 'player')
      localStorage.setItem('dnd_player_name', savedChar.player_name)
      return upperCode
    } catch (e) {
      setError(e.message); return null
    } finally { setLoading(false) }
  }, [])

  // ── Subscribe to real-time ────────────────────────────────
  const subscribeToRoom = useCallback((code) => {
    if (!isConfigured() || !code) return
    if (channelRef.current) channelRef.current.unsubscribe()

    channelRef.current = supabase
      .channel(`room:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
        (payload) => { if (payload.new) setRoom(payload.new) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_code=eq.${code}` },
        () => fetchPlayers(code))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'initiative_tracker', filter: `room_code=eq.${code}` },
        (payload) => { if (payload.new) setInitiative(payload.new) })
      .subscribe()
  }, [])

  const fetchPlayers = useCallback(async (code) => {
    if (!isConfigured() || !code) return
    const { data } = await supabase.from('room_players').select('*').eq('room_code', code)
    if (data) setPlayers(data)
  }, [])

  const fetchInitiative = useCallback(async (code) => {
    if (!isConfigured() || !code) return
    const { data } = await supabase.from('initiative_tracker').select('*').eq('room_code', code).single()
    if (data) setInitiative(data)
  }, [])

  // ── Load from localStorage on mount ──────────────────────
  useEffect(() => {
    const savedRoom = localStorage.getItem('dnd_room')
    const savedRole = localStorage.getItem('dnd_role')
    if (savedRoom && savedRole) {
      setRole(savedRole)
      if (isConfigured()) {
        supabase.from('rooms').select('*').eq('code', savedRoom).single().then(({ data }) => {
          if (data) {
            setRoom(data)
            fetchPlayers(savedRoom)
            fetchInitiative(savedRoom)
            subscribeToRoom(savedRoom)
          }
        })
        if (savedRole === 'player') {
          const pid = localStorage.getItem('dnd_player_id')
          if (pid) {
            supabase.from('room_players').select('*').eq('id', pid).single().then(({ data }) => {
              if (data) setCurrentPlayer(data)
            })
          }
        }
      }
    }
  }, [])

  useEffect(() => {
    if (room?.code) {
      fetchPlayers(room.code)
      fetchInitiative(room.code)
      subscribeToRoom(room.code)
    }
    return () => { if (channelRef.current) channelRef.current.unsubscribe() }
  }, [room?.code])

  // ── Save character on tab/browser close ──────────────────
  useEffect(() => {
    const handleUnload = () => {
      if (role === 'player' && currentPlayer) saveCharacterLocally(currentPlayer)
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [role, currentPlayer])

  // ── Update player stats (DM) ──────────────────────────────
  const updatePlayer = useCallback(async (playerId, updates) => {
    if (isConfigured()) {
      const { data } = await supabase.from('room_players').update(updates).eq('id', playerId).select().single()
      if (data) setPlayers(prev => prev.map(p => p.id === playerId ? data : p))
    } else {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ...updates } : p))
    }
  }, [])

  // ── Update own character (Player) ─────────────────────────
  const updateMyCharacter = useCallback(async (updates) => {
    if (!currentPlayer) return
    if (isConfigured()) {
      const { data } = await supabase.from('room_players').update(updates).eq('id', currentPlayer.id).select().single()
      if (data) {
        setCurrentPlayer(data)
        saveCharacterLocally(data)
      }
    } else {
      setCurrentPlayer(prev => {
        const merged = { ...prev, ...updates }
        saveCharacterLocally(merged)
        return merged
      })
    }
  }, [currentPlayer])

  // ── Update map (DM only) ──────────────────────────────────
  const updateMap = useCallback(async (mapUrl, mapConfig) => {
    if (!room) return
    const updates = {}
    if (mapUrl    !== undefined) updates.map_url    = mapUrl
    if (mapConfig !== undefined) updates.map_config = mapConfig
    if (isConfigured()) {
      await supabase.from('rooms').update(updates).eq('code', room.code)
    }
    setRoom(prev => ({ ...prev, ...updates }))
  }, [room])

  // ── Update initiative ─────────────────────────────────────
  const updateInitiative = useCallback(async (entries, currentIndex) => {
    const update = { entries, current_index: currentIndex ?? initiative.current_index }
    if (isConfigured()) {
      await supabase.from('initiative_tracker')
        .upsert({ room_code: room?.code, ...update }, { onConflict: 'room_code' })
    }
    setInitiative(update)
  }, [room, initiative.current_index])

  // ── Upload map ────────────────────────────────────────────
  const uploadMap = useCallback(async (file) => {
    if (!isConfigured() || !room) return null
    const ext  = file.name.split('.').pop()
    const path = `maps/${room.code}/map.${ext}`
    const { error } = await supabase.storage.from('dnd-maps').upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('dnd-maps').getPublicUrl(path)
    const url = data.publicUrl
    await updateMap(url, undefined)
    return url
  }, [room, updateMap])

  // ── Leave room ────────────────────────────────────────────
  const leaveRoom = useCallback(async () => {
    if (channelRef.current) channelRef.current.unsubscribe()
    if (role === 'player' && currentPlayer && isConfigured()) {
      saveCharacterLocally(currentPlayer)
      await supabase.from('room_players').delete().eq('id', currentPlayer.id)
    }
    setRoom(null); setRole(null); setCurrentPlayer(null)
    setPlayers([]); setInitiative({ entries: [], current_index: 0 })
    localStorage.removeItem('dnd_room')
    localStorage.removeItem('dnd_role')
    localStorage.removeItem('dnd_player_id')
    localStorage.removeItem('dnd_player_name')
    localStorage.removeItem('dnd_dm_name')
  }, [role, currentPlayer])

  return (
    <RoomContext.Provider value={{
      room, role, currentPlayer, players, initiative,
      loading, error, modifierOf,
      createRoom, joinRoom, joinWithSavedCharacter, rejoinRoom, leaveRoom,
      updatePlayer, updateMyCharacter,
      updateMap, uploadMap, updateInitiative,
    }}>
      {children}
    </RoomContext.Provider>
  )
}

export const useRoom = () => {
  const ctx = useContext(RoomContext)
  if (!ctx) throw new Error('useRoom must be used inside RoomProvider')
  return ctx
}
