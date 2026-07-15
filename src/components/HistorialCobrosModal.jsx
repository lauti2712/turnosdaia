import { useEffect, useState } from 'react'
import { subscribeAlumnos } from '../data/alumnos'
import { subscribeTodosMovimientos, eliminarMovimiento } from '../data/movimientos'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function mesActualId() {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
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

export default function HistorialCobrosModal({ onClose }) {
  const [alumnos, setAlumnos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [mes, setMes] = useState(mesActualId())

  useEffect(() => subscribeAlumnos(setAlumnos), [])
  useEffect(() => subscribeTodosMovimientos(setMovimientos), [])

  const alumnosPorId = Object.fromEntries(alumnos.map((a) => [a.id, a]))

  const delMes = movimientos.filter((m) => (m.fecha || '').startsWith(mes))
  const totalPagos = delMes.filter((m) => m.tipo === 'pago').reduce((acc, m) => acc + m.monto, 0)
  const totalAjustes = delMes.filter((m) => m.tipo === 'ajuste').reduce((acc, m) => acc + m.monto, 0)

  async function handleEliminar(m) {
    const alumno = alumnosPorId[m.alumnoId]
    const nombre = alumno ? `${alumno.apellido}, ${alumno.nombre}` : 'este alumno'
    if (confirm(`¿Eliminar el ${m.tipo} de ${fmtMoney(m.monto)} de ${nombre}?`)) {
      await eliminarMovimiento(m.id)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="page-title" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Historial de cobros</h3>
          <button className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="icon-btn" aria-label="Mes anterior" onClick={() => setMes((m) => sumarMeses(m, -1))}>
              ◀
            </button>
            <strong>{etiquetaMes(mes)}</strong>
            <button className="icon-btn" aria-label="Mes siguiente" onClick={() => setMes((m) => sumarMeses(m, 1))}>
              ▶
            </button>
          </div>
          <div className="muted" style={{ fontSize: '0.85rem' }}>
            Pagos: <strong style={{ color: 'var(--success)' }}>{fmtMoney(totalPagos)}</strong>
            {totalAjustes !== 0 && (
              <>
                {' · '}Ajustes: <strong>{fmtMoney(totalAjustes)}</strong>
              </>
            )}
          </div>
        </div>

        {delMes.length === 0 ? (
          <div className="empty-state">No hay movimientos en {etiquetaMes(mes)}.</div>
        ) : (
          <div className="scroll-x">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Alumno</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Detalle</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {delMes.map((m) => {
                  const alumno = alumnosPorId[m.alumnoId]
                  return (
                    <tr key={m.id}>
                      <td>{m.fecha}</td>
                      <td>{alumno ? `${alumno.apellido}, ${alumno.nombre}` : '(alumno eliminado)'}</td>
                      <td>
                        {m.tipo === 'pago' ? (
                          <span className="badge badge-success">Pago</span>
                        ) : (
                          <span className="badge badge-warning">Ajuste</span>
                        )}
                      </td>
                      <td>{fmtMoney(m.monto)}</td>
                      <td className="muted">{[m.formaPago, m.descripcion].filter(Boolean).join(' · ')}</td>
                      <td>
                        <button className="icon-btn" aria-label="Eliminar" onClick={() => handleEliminar(m)}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
