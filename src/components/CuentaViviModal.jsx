import { useEffect, useState } from 'react'
import { subscribeAlumnos } from '../data/alumnos'
import { subscribeTodosMovimientos, eliminarMovimiento } from '../data/movimientos'
import {
  subscribeEntregasVivi,
  registrarEntregaVivi,
  eliminarEntregaVivi,
} from '../data/entregasVivi'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const hoy = () => new Date().toISOString().slice(0, 10)

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
  const [movimientos, setMovimientos] = useState([])
  const [entregas, setEntregas] = useState([])
  const [mes, setMes] = useState(mesActualId())
  const [mostrarForm, setMostrarForm] = useState(false)
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => subscribeAlumnos(setAlumnos), [])
  useEffect(() => subscribeTodosMovimientos(setMovimientos), [])
  useEffect(() => subscribeEntregasVivi(setEntregas), [])

  const alumnosPorId = Object.fromEntries(alumnos.map((a) => [a.id, a]))

  const cobradoPorVivi = movimientos.filter(
    (m) => m.tipo === 'pago' && m.abonadoAVivi && (m.fecha || '').startsWith(mes),
  )
  const entregadoDelMes = entregas.filter((e) => (e.fecha || '').startsWith(mes))

  const totalCobradoPorVivi = cobradoPorVivi.reduce((acc, m) => acc + m.monto, 0)
  const totalEntregado = entregadoDelMes.reduce((acc, e) => acc + e.monto, 0)

  const filas = [
    ...cobradoPorVivi.map((m) => ({
      id: `pago-${m.id}`,
      fecha: m.fecha,
      tipo: 'cobrado',
      alumno: alumnosPorId[m.alumnoId],
      monto: m.monto,
      detalle: [m.formaPago, m.descripcion].filter(Boolean).join(' · '),
      onEliminar: () => eliminarMovimiento(m.id),
    })),
    ...entregadoDelMes.map((e) => ({
      id: `entrega-${e.id}`,
      fecha: e.fecha,
      tipo: 'entregado',
      alumno: null,
      monto: e.monto,
      detalle: e.descripcion,
      onEliminar: () => eliminarEntregaVivi(e.id),
    })),
  ].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))

  async function handleEliminar(fila) {
    const tipoTexto = fila.tipo === 'cobrado' ? 'cobro de Vivi' : 'entrega a Vivi'
    if (confirm(`¿Eliminar este ${tipoTexto} de ${fmtMoney(fila.monto)}?`)) {
      await fila.onEliminar()
    }
  }

  async function handleSubmitEntrega(e) {
    e.preventDefault()
    if (!monto) return
    setGuardando(true)
    try {
      await registrarEntregaVivi({ monto, fecha, descripcion })
      setMonto('')
      setDescripcion('')
      setFecha(hoy())
      setMostrarForm(false)
    } finally {
      setGuardando(false)
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
          <button className="btn btn-sm" onClick={() => setMostrarForm((v) => !v)}>
            + Registrar entrega a Vivi
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-tile stat-tile-wide">
            <div className="stat-split">
              <div>
                <div className="stat-split-label">Abonado a Vivi</div>
                <div className="stat-split-value">{fmtMoney(totalCobradoPorVivi)}</div>
              </div>
              <div>
                <div className="stat-split-label">Entregado a Vivi</div>
                <div className="stat-split-value">{fmtMoney(totalEntregado)}</div>
              </div>
              <div className="stat-split-total">
                <div className="stat-split-label">Total cobrado por Vivi</div>
                <div className="stat-split-value">{fmtMoney(totalCobradoPorVivi + totalEntregado)}</div>
              </div>
            </div>
          </div>
        </div>

        {mostrarForm && (
          <form onSubmit={handleSubmitEntrega} className="card" style={{ marginBottom: 14 }}>
            <div className="form-row">
              <div className="field">
                <label>Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="field">
                <label>Fecha</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
              </div>
              <div className="field">
                <label>Descripción (opcional)</label>
                <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                Registrar entrega
              </button>
            </div>
          </form>
        )}

        {filas.length === 0 ? (
          <div className="empty-state">No hay movimientos de Vivi en {etiquetaMes(mes)}.</div>
        ) : (
          <div className="scroll-x">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Alumna</th>
                  <th>Monto</th>
                  <th>Detalle</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    <td>{f.fecha}</td>
                    <td>
                      {f.tipo === 'cobrado' ? (
                        <span className="badge badge-warning">Cobrado por Vivi</span>
                      ) : (
                        <span className="badge badge-danger">Entregado a Vivi</span>
                      )}
                    </td>
                    <td>{f.alumno ? `${f.alumno.apellido}, ${f.alumno.nombre}` : '—'}</td>
                    <td>{fmtMoney(f.monto)}</td>
                    <td className="muted">{f.detalle}</td>
                    <td>
                      <button className="icon-btn" aria-label="Eliminar" onClick={() => handleEliminar(f)}>
                        ✕
                      </button>
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
