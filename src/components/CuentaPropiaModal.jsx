import { useEffect, useState } from 'react'
import { subscribeAlumnos } from '../data/alumnos'
import { subscribeActividades } from '../data/actividades'
import { subscribeTodosMovimientos, montoViviDePago, montoPropioDePago } from '../data/movimientos'
import { mostrarSocio } from '../data/espacios'
import { useEspacio } from '../context/EspacioContext'
import { fmtFecha } from '../utils/fechas'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0)

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function mesActualId() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function sumarMeses(mesId, delta) {
  const [anio, mes] = mesId.split('-').map(Number)
  const fecha = new Date(anio, mes - 1 + delta, 1)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}

function etiquetaMes(mesId) {
  const [anio, mes] = mesId.split('-').map(Number)
  return `${MESES[mes - 1]} ${anio}`
}

export default function CuentaPropiaModal({ onClose }) {
  const { espacioActualId, espacioActual } = useEspacio()
  const socioNombre = espacioActual?.socioNombre || 'el socio'
  const conSocio = mostrarSocio(espacioActual)
  const [alumnos, setAlumnos] = useState([])
  const [actividades, setActividades] = useState([])
  const [movimientosTodos, setMovimientosTodos] = useState([])
  const [mes, setMes] = useState(mesActualId())

  useEffect(() => subscribeAlumnos(setAlumnos), [])
  useEffect(() => subscribeActividades(setActividades), [])
  useEffect(() => subscribeTodosMovimientos(setMovimientosTodos), [])

  const alumnosPorId = Object.fromEntries(alumnos.map((a) => [a.id, a]))
  const actividadesPorId = Object.fromEntries(actividades.map((a) => [a.id, a]))
  const movimientos = movimientosTodos.filter((m) => m.espacioId === espacioActualId)

  const pagosDelMes = movimientos.filter(
    (m) => m.tipo === 'pago' && (m.fecha || '').startsWith(mes),
  )
  const pagosMios = pagosDelMes.filter((m) => !m.abonadoAVivi)

  const cobradoPorMi = pagosMios.reduce((acc, m) => acc + m.monto, 0)
  const corresponderiaASocio = conSocio
    ? pagosMios.reduce((acc, m) => acc + montoViviDePago(m), 0)
    : 0

  const filas = pagosMios
    .map((m) => {
      const alumno = alumnosPorId[m.alumnoId]
      const actividad = actividadesPorId[alumno?.actividadId]
      return {
        id: m.id,
        fecha: m.fecha,
        alumna: alumno ? `${alumno.apellido}, ${alumno.nombre}` : '(alumno eliminado)',
        actividad: actividad?.nombre || '—',
        monto: m.monto,
        porcentaje: `${m.porcentajeVivi ?? 0}%`,
        deSocio: montoViviDePago(m),
        propio: montoPropioDePago(m),
      }
    })
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="page-title" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Lo mío</h3>
          <button className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <button className="icon-btn" aria-label="Mes anterior" onClick={() => setMes((m) => sumarMeses(m, -1))}>
            ◀
          </button>
          <strong>{etiquetaMes(mes)}</strong>
          <button className="icon-btn" aria-label="Mes siguiente" onClick={() => setMes((m) => sumarMeses(m, 1))}>
            ▶
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-tile stat-tile-wide">
            <div className="stat-split">
              <div>
                <div className="stat-split-label">Cobrado por mí</div>
                <div className="stat-split-value" style={{ color: 'var(--success)' }}>
                  {fmtMoney(cobradoPorMi)}
                </div>
              </div>
              {conSocio && (
                <div>
                  <div className="stat-split-label">Corresponde a {socioNombre}</div>
                  <div className="stat-split-value">{fmtMoney(corresponderiaASocio)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {filas.length === 0 ? (
          <div className="empty-state">Todavía no cobré nada en {etiquetaMes(mes)}.</div>
        ) : (
          <div className="scroll-x">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Alumna</th>
                  <th>Actividad</th>
                  <th>Monto</th>
                  {conSocio && (
                    <>
                      <th>% {socioNombre}</th>
                      <th>De {socioNombre}</th>
                      <th>Propio</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    <td>{fmtFecha(f.fecha)}</td>
                    <td>{f.alumna}</td>
                    <td className="muted">{f.actividad}</td>
                    <td>{fmtMoney(f.monto)}</td>
                    {conSocio && (
                      <>
                        <td className="muted">{f.porcentaje}</td>
                        <td>{fmtMoney(f.deSocio)}</td>
                        <td>{fmtMoney(f.propio)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
