import { Routes, Route, Navigate } from 'react-router-dom'
import { RoomProvider, useRoom } from './context/RoomContext'
import EntryScreen    from './pages/EntryScreen'
import DMDashboard    from './pages/DMDashboard'
import PlayerDashboard from './pages/PlayerDashboard'

function AppRoutes() {
  const { room, role } = useRoom()

  if (!room || !role) return <EntryScreen />
  if (role === 'dm')     return <DMDashboard />
  return <PlayerDashboard />
}

export default function App() {
  return (
    <RoomProvider>
      <Routes>
        <Route path="*" element={<AppRoutes />} />
      </Routes>
    </RoomProvider>
  )
}
