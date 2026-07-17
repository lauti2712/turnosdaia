import { useEffect, useState } from 'react'
import { subscribeAlumnos } from '../data/alumnos'
import { subscribeActividades } from '../data/actividades'
import { subscribeTodosMovimientos, montoViviDePago, montoPropioDePago } from '../data/movimientos'
import { subscribePagosVivi, eliminarPagoVivi } from '../data/pagosVivi'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)

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

export default function CuentaViviModal({ onClose }) {
  const [alumnos, setAlumnos] = useState([])
  const [actividades, setActividades] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [pagosVivi, setPagosVivi] = useState([])
  const [mes, setMes] = useState(mesActualId())

  useEffect(() => subscribeAlumnos(setAlumnos), [])
  useEffect(() => subscribeActividades(setActividades), [])
  useEffect(() => subscribeTodosMovimientos(setMovimientos), [])
  useEffect(() => subscribePagosVivi(setPagosVivi), [])

  const alumnosPorId = Object.fromEntries(alumnos.map((a) => [a.id, a]))
  const actividadesPorId = Object.fromEntries(actividades.map((a) => [a.id, a]))

  const pagosDelMes = movimientos.filter(
    (m) => m.tipo === 'pago' && (m.fecha || '').startsWith(mes),
  )
  const pagosDeVivi = pagosDelMes.filter((m) => m.abonadoAVivi)
  const pagosViviDelMes = pagosVivi.filter((p) => (p.fecha || '').startsWith(mes))

  const mePagoVivi = pagosDeVivi.reduce((acc, m) => acc + montoPropioDePago(m), 0)
  const lePagaronAVivi = pagosDeVivi.reduce((acc, m) => acc + montoViviDePago(m), 0)
  const lePagueAVivi = pagosViviDelMes.reduce((acc, p) => acc + p.monto, 0)
  const totalCobradoPorVivi = lePagaronAVivi + lePagueAVivi

  const filas = [
    ...pagosDelMes.map((m) => {
      const alumno = alumnosPorId[m.alumnoId]
      const actividad = actividadesPorId[alumno?.actividadId]
      return {
        id: `pago-${m.id}`,
        fecha: m.fecha,
        alumna: alumno ? `${alumno.apellido}, ${alumno.nombre}` : '(alumno eliminado)',
        actividad: actividad?.nombre || '—',
        cobro: m.abonadoAVivi ? 'Vivi' : 'Yo',
        monto: m.monto,
        porcentaje: `${m.porcentajeVivi ?? 0}%`,
        deVivi: montoViviDePago(m),
        propio: montoPropioDePago(m),
        eliminable: false,
      }
    }),
    ...pagosViviDelMes.map((p) => ({
      id: `vivi-${p.id}`,
      fecha: p.fecha,
      alumna: '—',
      actividad: '—',
      cobro: 'Le pagué a Vivi',
      monto: p.monto,
      porcentaje: '—',
      deVivi: p.monto,
      propio: 0,
      eliminable: true,
      onEliminar: () => eliminarPagoVivi(p.id),
    })),
  ].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))

  async function handleEliminar(fila) {
    if (confirm(`¿Eliminar este pago a Vivi de ${fmtMoney(fila.monto)}?`)) {
      await fila.onEliminar()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="page-title" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Cuenta de Vivi</h3>
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
                <div className="stat-split-label">Me pagó Vivi</div>
                <div className="stat-split-value">{fmtMoney(mePagoVivi)}</div>
              </div>
              <div>
                <div className="stat-split-label">Le pagaron a Vivi</div>
                <div className="stat-split-value">{fmtMoney(lePagaronAVivi)}</div>
              </div>
              <div>
                <div className="stat-split-label">Le pagué a Vivi</div>
                <div className="stat-split-value">{fmtMoney(lePagueAVivi)}</div>
              </div>
              <div className="stat-split-total">
                <div className="stat-split-label">Total cobrado por Vivi</div>
                <div className="stat-split-value">{fmtMoney(totalCobradoPorVivi)}</div>
              </div>
            </div>
          </div>
        </div>

        {filas.length === 0 ? (
          <div className="empty-state">No hay movimientos de Vivi en {etiquetaMes(mes)}.</div>
        ) : (
          <div className="scroll-x">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Alumna</th>
                  <th>Actividad</th>
                  <th>Cobró</th>
                  <th>Monto</th>
                  <th>% Vivi</th>
                  <th>De Vivi</th>
                  <th>Propio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    <td>{f.fecha}</td>
                    <td>{f.alumna}</td>
                    <td className="muted">{f.actividad}</td>
                    <td>
                      {f.cobro === 'Vivi' ? (
                        <span className="badge badge-warning">Vivi</span>
                      ) : f.cobro === 'Yo' ? (
                        <span className="badge badge-success">Yo</span>
                      ) : (
                        <span className="badge badge-danger">{f.cobro}</span>
                      )}
                    </td>
                    <td>{fmtMoney(f.monto)}</td>
                    <td className="muted">{f.porcentaje}</td>
                    <td>{fmtMoney(f.deVivi)}</td>
                    <td>{fmtMoney(f.propio)}</td>
                    <td>
                      {f.eliminable && (
                        <button className="icon-btn" aria-label="Eliminar" onClick={() => handleEliminar(f)}>
                          ✕
                        </button>
                      )}
                    </td>
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
