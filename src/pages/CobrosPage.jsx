import { useEffect, useState } from 'react'
import { subscribeAlumnos, coincideBusqueda } from '../data/alumnos'
import { subscribeActividades, montoMensualEfectivo } from '../data/actividades'
import {
  subscribeTodosMovimientos,
  calcularSaldo,
  montoViviDePago,
  montoPropioDePago,
} from '../data/movimientos'
import CtaCteDetalle from '../components/CtaCteDetalle'
import NuevoPagoModal from '../components/NuevoPagoModal'
import HistorialCobrosModal from '../components/HistorialCobrosModal'
import CuentaViviModal from '../components/CuentaViviModal'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)

export default function CobrosPage() {
  const [alumnos, setAlumnos] = useState([])
  const [actividades, setActividades] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [seleccionadoId, setSeleccionadoId] = useState(null)
  const [soloDeudores, setSoloDeudores] = useState(false)
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false)
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false)
  const [modalViviAbierto, setModalViviAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => subscribeAlumnos(setAlumnos), [])
  useEffect(() => subscribeActividades(setActividades), [])
  useEffect(() => subscribeTodosMovimientos(setMovimientos), [])

  const activos = alumnos.filter((a) => a.activo !== false)

  const filasCompletas = activos.map((a) => {
    const movsAlumno = movimientos.filter((m) => m.alumnoId === a.id)
    const montoMensual = montoMensualEfectivo(a, actividades)
    return { alumno: a, saldo: calcularSaldo({ ...a, montoMensual }, movsAlumno) }
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
  const pagosMiosDelMes = pagosDelMes.filter((m) => !m.abonadoAVivi)
  const pagosDeViviDelMes = pagosDelMes.filter((m) => m.abonadoAVivi)

  // Lo que yo cobré de las alumnas (monto bruto, antes de descontar la parte de Vivi).
  const cobradoPorMi = pagosMiosDelMes.reduce((acc, m) => acc + m.monto, 0)
  // De lo que cobré yo, la parte que le corresponde a Vivi y que le tengo que entregar.
  const lePagueAVivi = pagosMiosDelMes.reduce((acc, m) => acc + montoViviDePago(m), 0)
  // De lo que cobró Vivi directamente, la parte que es mía y ella me debe.
  const mePagoVivi = pagosDeViviDelMes.reduce((acc, m) => acc + montoPropioDePago(m), 0)
  // De lo que cobró Vivi directamente, su propia parte (lo que le quedó a ella).
  const lePagaronAVivi = pagosDeViviDelMes.reduce((acc, m) => acc + montoViviDePago(m), 0)
  // Todo lo que le corresponde a Vivi en total (de lo que cobró ella + de lo que cobré yo).
  const totalCobradoPorVivi = lePagaronAVivi + lePagueAVivi

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
        <div className="stat-tile stat-tile-wide">
          <div className="stat-label">Lo mío</div>
          <div className="stat-split">
            <div>
              <div className="stat-split-label">Cobrado por mí</div>
              <div className="stat-split-value" style={{ color: 'var(--success)' }}>
                {fmtMoney(cobradoPorMi)}
              </div>
            </div>
            <div>
              <div className="stat-split-label">Le pagué a Vivi</div>
              <div className="stat-split-value">{fmtMoney(lePagueAVivi)}</div>
            </div>
          </div>
        </div>
        <div className="stat-tile stat-tile-wide">
          <div className="stat-label">Vivi</div>
          <div className="stat-split">
            <div>
              <div className="stat-split-label">Me pagó Vivi</div>
              <div className="stat-split-value">{fmtMoney(mePagoVivi)}</div>
            </div>
            <div>
              <div className="stat-split-label">Le pagaron a Vivi</div>
              <div className="stat-split-value">{fmtMoney(lePagaronAVivi)}</div>
            </div>
            <div className="stat-split-total">
              <div className="stat-split-label">Total cobrado por Vivi</div>
              <div className="stat-split-value">{fmtMoney(totalCobradoPorVivi)}</div>
            </div>
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Pendiente por cobrar</div>
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
            <CtaCteDetalle alumno={seleccionado} actividades={actividades} sinTarjeta />
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
