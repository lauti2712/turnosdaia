import { useEffect, useState } from 'react'
import { subscribeAlumnos, coincideBusqueda } from '../data/alumnos'
import { subscribeTodosMovimientos, calcularSaldo } from '../data/movimientos'
import { subscribeEntregasVivi } from '../data/entregasVivi'
import CtaCteDetalle from '../components/CtaCteDetalle'
import NuevoPagoModal from '../components/NuevoPagoModal'
import HistorialCobrosModal from '../components/HistorialCobrosModal'
import CuentaViviModal from '../components/CuentaViviModal'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)

export default function CobrosPage() {
  const [alumnos, setAlumnos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [entregas, setEntregas] = useState([])
  const [seleccionadoId, setSeleccionadoId] = useState(null)
  const [soloDeudores, setSoloDeudores] = useState(false)
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false)
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false)
  const [modalViviAbierto, setModalViviAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => subscribeAlumnos(setAlumnos), [])
  useEffect(() => subscribeTodosMovimientos(setMovimientos), [])
  useEffect(() => subscribeEntregasVivi(setEntregas), [])

  const activos = alumnos.filter((a) => a.activo !== false)

  const filasCompletas = activos.map((a) => {
    const movsAlumno = movimientos.filter((m) => m.alumnoId === a.id)
    return { alumno: a, saldo: calcularSaldo(a, movsAlumno) }
  })

  const filas = filasCompletas
    .filter((f) => coincideBusqueda(f.alumno, busqueda))
    .filter((f) => !soloDeudores || f.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo)

  const hoy = new Date()
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  const pagosDelMes = movimientos.filter(
    (m) => m.tipo === 'pago' && (m.fecha || '').startsWith(mesActual),
  )
  const totalCobradoMes = pagosDelMes
    .filter((m) => !m.abonadoAVivi)
    .reduce((acc, m) => acc + m.monto, 0)
  const totalAbonadoAViviMes = pagosDelMes
    .filter((m) => m.abonadoAVivi)
    .reduce((acc, m) => acc + m.monto, 0)
  const totalEntregadoAViviMes = entregas
    .filter((e) => (e.fecha || '').startsWith(mesActual))
    .reduce((acc, e) => acc + e.monto, 0)

  const totalAdeudado = filasCompletas.reduce((acc, f) => acc + Math.max(f.saldo, 0), 0)

  const seleccionado = activos.find((a) => a.id === seleccionadoId)

  return (
    <div>
      <div className="page-title">
        <h2>Cobros</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="muted" style={{ fontSize: '0.85rem', display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={soloDeudores}
              onChange={(e) => setSoloDeudores(e.target.checked)}
            />
            Mostrar solo alumnos que deben
          </label>
          <button className="btn btn-primary" onClick={() => setModalPagoAbierto(true)}>
            + Nuevo pago
          </button>
          <button className="btn" onClick={() => setModalHistorialAbierto(true)}>
            Ver historial
          </button>
          <button className="btn" onClick={() => setModalViviAbierto(true)}>
            Cuenta de Vivi
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-tile">
          <div className="stat-label">Cobrado este mes</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {fmtMoney(totalCobradoMes)}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Abonado a Vivi</div>
          <div className="stat-value" style={{ fontSize: '1.3rem' }}>
            {fmtMoney(totalAbonadoAViviMes)}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Entregado a Vivi</div>
          <div className="stat-value" style={{ fontSize: '1.3rem' }}>
            {fmtMoney(totalEntregadoAViviMes)}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Adeudado total</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>
            {fmtMoney(totalAdeudado)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o apellido..."
        />
      </div>

      <div className="card">
        {filas.length === 0 ? (
          <div className="empty-state">
            {busqueda ? 'No hay alumnos que coincidan con la búsqueda.' : 'No hay alumnos para mostrar.'}
          </div>
        ) : (
          <div className="scroll-x">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Saldo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ alumno, saldo }) => (
                <tr key={alumno.id}>
                  <td>
                    {alumno.apellido}, {alumno.nombre}
                  </td>
                  <td>
                    <span className={`badge ${saldo > 0 ? 'badge-danger' : 'badge-success'}`}>
                      {fmtMoney(saldo)}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm" onClick={() => setSeleccionadoId(alumno.id)}>
                      Ver cuenta
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {seleccionado && (
        <div className="modal-overlay" onClick={() => setSeleccionadoId(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="icon-btn" aria-label="Cerrar" onClick={() => setSeleccionadoId(null)}>
                ✕
              </button>
            </div>
            <CtaCteDetalle alumno={seleccionado} sinTarjeta />
          </div>
        </div>
      )}

      {modalPagoAbierto && <NuevoPagoModal onClose={() => setModalPagoAbierto(false)} />}

      {modalHistorialAbierto && (
        <HistorialCobrosModal onClose={() => setModalHistorialAbierto(false)} />
      )}

      {modalViviAbierto && <CuentaViviModal onClose={() => setModalViviAbierto(false)} />}
    </div>
  )
}
