import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import TurnosPage from './pages/TurnosPage'
import AlumnosPage from './pages/AlumnosPage'
import CobrosPage from './pages/CobrosPage'
import ActividadesPage from './pages/ActividadesPage'
import EspaciosPage from './pages/EspaciosPage'
import PapeleraPage from './pages/PapeleraPage'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { EspacioProvider, useEspacio } from './context/EspacioContext'

function EspacioSelector() {
  const { espacios, espacioActualId, setEspacioActualId } = useEspacio()

  if (espacios.length === 0) return <h1>Sin espacios</h1>

  return (
    <select
      value={espacioActualId || ''}
      onChange={(e) => setEspacioActualId(e.target.value)}
      style={{ fontSize: '1.1rem', fontWeight: 700, width: 'auto' }}
    >
      {espacios.map((e) => (
        <option key={e.id} value={e.id}>
          {e.nombre}
        </option>
      ))}
    </select>
  )
}

function AppShell() {
  const online = useOnlineStatus()

  return (
    <div className="app-shell">
      {!online && (
        <div className="offline-banner">
          Sin conexión — los cambios se guardan igual y se sincronizan solos cuando vuelva la señal.
        </div>
      )}
      <header className="app-header">
        <EspacioSelector />
        <nav className="nav">
          <NavLink to="/turnos" className={({ isActive }) => (isActive ? 'active' : '')}>
            Turnos
          </NavLink>
          <NavLink to="/alumnos" className={({ isActive }) => (isActive ? 'active' : '')}>
            Alumnos
          </NavLink>
          <NavLink to="/cobros" className={({ isActive }) => (isActive ? 'active' : '')}>
            Cobros
          </NavLink>
          <NavLink to="/actividades" className={({ isActive }) => (isActive ? 'active' : '')}>
            Actividades
          </NavLink>
          <NavLink to="/espacios" className={({ isActive }) => (isActive ? 'active' : '')}>
            Espacios
          </NavLink>
          <NavLink to="/papelera" className={({ isActive }) => (isActive ? 'active' : '')}>
            Papelera
          </NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Navigate to="/turnos" replace />} />
        <Route path="/turnos" element={<TurnosPage />} />
        <Route path="/alumnos" element={<AlumnosPage />} />
        <Route path="/cobros" element={<CobrosPage />} />
        <Route path="/actividades" element={<ActividadesPage />} />
        <Route path="/espacios" element={<EspaciosPage />} />
        <Route path="/papelera" element={<PapeleraPage />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <EspacioProvider>
        <AppShell />
      </EspacioProvider>
    </BrowserRouter>
  )
}

export default App
