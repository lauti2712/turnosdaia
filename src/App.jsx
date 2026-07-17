import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import TurnosPage from './pages/TurnosPage'
import AlumnosPage from './pages/AlumnosPage'
import CobrosPage from './pages/CobrosPage'
import ActividadesPage from './pages/ActividadesPage'
import { useOnlineStatus } from './hooks/useOnlineStatus'

function App() {
  const online = useOnlineStatus()

  return (
    <BrowserRouter>
      <div className="app-shell">
        {!online && (
          <div className="offline-banner">
            Sin conexión — los cambios se guardan igual y se sincronizan solos cuando vuelva la señal.
          </div>
        )}
        <header className="app-header">
          <h1>Pilates &amp; Yoga</h1>
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
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/turnos" replace />} />
          <Route path="/turnos" element={<TurnosPage />} />
          <Route path="/alumnos" element={<AlumnosPage />} />
          <Route path="/cobros" element={<CobrosPage />} />
          <Route path="/actividades" element={<ActividadesPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
