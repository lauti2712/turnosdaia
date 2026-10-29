import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const IconTurnos = () => (
  <svg {...ICON_PROPS}>
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)

const IconAlumnos = () => (
  <svg {...ICON_PROPS}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="10" cy="7" r="4" />
    <path d="M21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconCobros = () => (
  <svg {...ICON_PROPS}>
    <rect x="2" y="6" width="20" height="13" rx="3" />
    <path d="M2 10h20M6 15h4" />
  </svg>
)

const IconMas = () => (
  <svg {...ICON_PROPS}>
    <circle cx="5" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="19" cy="12" r="1.2" />
  </svg>
)

const PRINCIPALES = [
  { to: '/turnos', label: 'Turnos', Icon: IconTurnos },
  { to: '/alumnos', label: 'Alumnos', Icon: IconAlumnos },
  { to: '/cobros', label: 'Cobros', Icon: IconCobros },
]

const SECUNDARIAS = [
  { to: '/actividades', label: 'Actividades' },
  { to: '/espacios', label: 'Espacios' },
  { to: '/configuracion', label: 'Configuración' },
  { to: '/papelera', label: 'Papelera' },
]

// Barra inferior para celular: las 3 secciones de uso diario + "Más" con el resto.
export default function TabBar() {
  const [masAbierto, setMasAbierto] = useState(false)
  const { pathname } = useLocation()
  const enSecundaria = SECUNDARIAS.some((s) => pathname.startsWith(s.to))

  return (
    <>
      <nav className="tabbar" aria-label="Secciones">
        {PRINCIPALES.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="tab-icon">
              <Icon />
            </span>
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          className={enSecundaria || masAbierto ? 'active' : ''}
          onClick={() => setMasAbierto(true)}
          aria-haspopup="dialog"
        >
          <span className="tab-icon">
            <IconMas />
          </span>
          Más
        </button>
      </nav>

      {masAbierto && (
        <div className="modal-overlay" onClick={() => setMasAbierto(false)}>
          <div className="modal" role="dialog" aria-label="Más secciones" onClick={(e) => e.stopPropagation()}>
            {SECUNDARIAS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sheet-link${isActive ? ' active' : ''}`}
                onClick={() => setMasAbierto(false)}
              >
                {label}
                <span className="chevron">›</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
