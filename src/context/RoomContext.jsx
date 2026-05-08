import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const RoomContext = createContext(null)

export function RoomProvider({ children }) {
  const [room, setRoom]               = useState(null)      // { code, map_url, map_config }
  const [role, setRole]               = useState(null)      // 'dm' | 'player'
  const [currentPlayer, setCurrentPlayer] = useState(null)  // player row for this user
  const [players, setPlayers]         = useState([])
  const [initiative, setInitiative]   = useState({ entries: [], current_index: 0 })
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const channelRef = useRef(null)

  // ── Helpers ────────────────────────────────────────────────
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
          code,
          dm_name: dmName,
          map_url: null,
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
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Join room (Player) ────────────────────────────────────
  const joinRoom = useCallback(async (code, playerName) => {
    setLoading(true); setError(null)
    try {
      const upperCode = code.toUpperCase()
      if (isConfigured()) {
        const { data: roomData, error: roomErr } = await supabase
          .from('rooms').select('*').eq('code', upperCode).single()
        if (roomErr) throw new Error('Room not found')
        setRoom(roomData)

        // upsert player
        const { data: playerData, error: playerErr } = await supabase
          .from('room_players')
          .upsert({ room_code: upperCode, player_name: playerName }, { onConflict: 'room_code,player_name' })
          .select().single()
        if (playerErr) throw playerErr
        setCurrentPlayer(playerData)
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
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
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

  // ── Fetch players ─────────────────────────────────────────
  const fetchPlayers = useCallback(async (code) => {
    if (!isConfigured() || !code) return
    const { data } = await supabase.from('room_players').select('*').eq('room_code', code)
    if (data) setPlayers(data)
  }, [])

  // ── Fetch initiative ──────────────────────────────────────
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
      if (data) setCurrentPlayer(data)
    } else {
      setCurrentPlayer(prev => ({ ...prev, ...updates }))
    }
  }, [currentPlayer])

  // ── Update map (DM only) ──────────────────────────────────
  const updateMap = useCallback(async (mapUrl, mapConfig) => {
    if (!room) return
    const updates = {}
    if (mapUrl !== undefined) updates.map_url = mapUrl
    if (mapConfig !== undefined) updates.map_config = mapConfig
    if (isConfigured()) {
      await supabase.from('rooms').update(updates).eq('code', room.code)
    }
    setRoom(prev => ({ ...prev, ...updates }))
  }, [room])

  // ── Update initiative (DM only) ───────────────────────────
  const updateInitiative = useCallback(async (entries, currentIndex) => {
    const update = { entries, current_index: currentIndex ?? initiative.current_index }
    if (isConfigured()) {
      await supabase.from('initiative_tracker')
        .upsert({ room_code: room?.code, ...update }, { onConflict: 'room_code' })
    }
    setInitiative(update)
  }, [room, initiative.current_index])

  // ── Upload map image to Supabase Storage ──────────────────
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
  const leaveRoom = useCallback(() => {
    if (channelRef.current) channelRef.current.unsubscribe()
    setRoom(null); setRole(null); setCurrentPlayer(null); setPlayers([]); setInitiative({ entries: [], current_index: 0 })
    localStorage.removeItem('dnd_room')
    localStorage.removeItem('dnd_role')
    localStorage.removeItem('dnd_player_id')
    localStorage.removeItem('dnd_player_name')
    localStorage.removeItem('dnd_dm_name')
  }, [])

  return (
    <RoomContext.Provider value={{
      room, role, currentPlayer, players, initiative,
      loading, error, modifierOf,
      createRoom, joinRoom, leaveRoom,
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
