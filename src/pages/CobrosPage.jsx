import { useEffect, useState } from 'react'
import { subscribeAlumnos, actualizarAlumno, coincideBusqueda } from '../data/alumnos'
import { subscribeActividades } from '../data/actividades'
import { subscribeTurnos, sincronizarAsignaciones, turnosActualesDeAlumno } from '../data/turnos'
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
import AlumnoModal from '../components/AlumnoModal'
import { mostrarSocio } from '../data/espacios'
import { useEspacio } from '../context/EspacioContext'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0)

export default function CobrosPage() {
  const { espacioActualId, espacioActual } = useEspacio()
  const socioNombre = espacioActual?.socioNombre || 'el socio'
  const conSocio = mostrarSocio(espacioActual)
  const [alumnosTodos, setAlumnosTodos] = useState([])
  const [actividadesTodas, setActividadesTodas] = useState([])
  const [turnosTodos, setTurnosTodos] = useState([])
  const [movimientosTodos, setMovimientosTodos] = useState([])
  const [seleccionadoId, setSeleccionadoId] = useState(null)
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false)
  const [soloDeudores, setSoloDeudores] = useState(false)
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false)
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false)
  const [modalViviAbierto, setModalViviAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => subscribeAlumnos(setAlumnosTodos), [])
  useEffect(() => subscribeActividades(setActividadesTodas), [])
  useEffect(() => subscribeTurnos(setTurnosTodos), [])
  useEffect(() => subscribeTodosMovimientos(setMovimientosTodos), [])

  const alumnos = alumnosTodos.filter((a) => a.espacioId === espacioActualId)
  const actividades = actividadesTodas.filter((a) => a.espacioId === espacioActualId)
  const turnos = turnosTodos.filter((t) => t.espacioId === espacioActualId)
  const movimientos = movimientosTodos.filter((m) => m.espacioId === espacioActualId)

  const activos = alumnos.filter((a) => a.activo !== false)

  const filasCompletas = activos.map((a) => {
    const movsAlumno = movimientos.filter((m) => m.alumnoId === a.id)
    return { alumno: a, saldo: calcularSaldo(a, movsAlumno, actividades) }
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

  // LO MÍO: de lo que cobré yo (bruto), cuánto de eso es en realidad de
  // Vivi según el % de la actividad de cada alumna (no es lo que ya le
  // pagué — eso se registra aparte desde "Nuevo pago" → "A Vivi" — sino lo
  // que le corresponde).
  const cobradoPorMi = pagosMiosDelMes.reduce((acc, m) => acc + m.monto, 0)
  const corresponderiaAVivi = pagosMiosDelMes.reduce((acc, m) => acc + montoViviDePago(m), 0)

  // VIVI: todo lo que cobró ella directamente (bruto — son las alumnas que
  // le pagan a ella, marcadas al cargar el pago), y de eso cuánto es mío.
  const totalCobradoPorVivi = pagosDeViviDelMes.reduce((acc, m) => acc + m.monto, 0)
  const meCorrespondeDeVivi = pagosDeViviDelMes.reduce((acc, m) => acc + montoPropioDePago(m), 0)

  // TOTALES: cuánto es de cada uno en neto este mes, sin importar quién lo
  // cobró físicamente — es la suma de "mi parte" y "la parte de Vivi" de
  // TODOS los pagos del mes (los míos + los de ella).
  const totalMeCorresponde = pagosDelMes.reduce((acc, m) => acc + montoPropioDePago(m), 0)
  const totalCorrespondeAVivi = pagosDelMes.reduce((acc, m) => acc + montoViviDePago(m), 0)

  // Sin reparto por actividad (monto fijo o sin socio): un solo total, sin
  // separar por porcentaje.
  const cobradoTotalDelMes = pagosDelMes.reduce((acc, m) => acc + m.monto, 0)

  // Deuda pendiente: es un acumulado de siempre, no de este mes.
  const totalAdeudado = filasCompletas.reduce((acc, f) => acc + Math.max(f.saldo, 0), 0)

  const seleccionado = activos.find((a) => a.id === seleccionadoId)

  async function handleGuardarPerfil(datos) {
    const turnosAntes = turnosActualesDeAlumno(seleccionado.id, turnos)
    await actualizarAlumno(seleccionado.id, datos)
    await sincronizarAsignaciones(seleccionado.id, turnosAntes, datos.turnos)
  }

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
          {conSocio && (
            <button className="btn" onClick={() => setModalViviAbierto(true)}>
              Cuenta de {socioNombre}
            </button>
          )}
        </div>
      </div>

      <p className="muted" style={{ fontSize: '0.82rem', marginBottom: 4 }}>
        Cobros de este mes — la deuda pendiente de abajo es acumulada, no solo de este mes.
      </p>
      <div className="stats-row">
        {conSocio ? (
          <>
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
                  <div className="stat-split-label">Corresponde a {socioNombre}</div>
                  <div className="stat-split-value">{fmtMoney(corresponderiaAVivi)}</div>
                </div>
              </div>
            </div>
            <div
              className="stat-tile stat-tile-wide"
              style={{ cursor: 'pointer' }}
              onClick={() => setModalViviAbierto(true)}
              title={`Ver los cobros de alumnas que le pagaron a ${socioNombre} este mes`}
            >
              <div className="stat-label">{socioNombre}</div>
              <div className="stat-split">
                <div>
                  <div className="stat-split-label">Total cobrado por {socioNombre}</div>
                  <div className="stat-split-value">{fmtMoney(totalCobradoPorVivi)}</div>
                </div>
                <div>
                  <div className="stat-split-label">Me corresponde a mí</div>
                  <div className="stat-split-value">{fmtMoney(meCorrespondeDeVivi)}</div>
                </div>
              </div>
            </div>
            <div className="stat-tile stat-tile-wide">
              <div className="stat-label">Totales del mes (neto, sin importar quién cobró)</div>
              <div className="stat-split">
                <div>
                  <div className="stat-split-label">Me corresponde a mí</div>
                  <div className="stat-split-value" style={{ color: 'var(--success)' }}>
                    {fmtMoney(totalMeCorresponde)}
                  </div>
                </div>
                <div>
                  <div className="stat-split-label">Corresponde a {socioNombre}</div>
                  <div className="stat-split-value">{fmtMoney(totalCorrespondeAVivi)}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="stat-tile">
            <div className="stat-label">Cobrado este mes</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {fmtMoney(cobradoTotalDelMes)}
            </div>
          </div>
        )}
        {espacioActual?.modoCobroSocio === 'montoFijo' && (
          <div className="stat-tile">
            <div className="stat-label">{socioNombre} (monto fijo)</div>
            <div className="stat-value">{fmtMoney(espacioActual.montoFijoSocio)}</div>
          </div>
        )}
        <div className="stat-tile">
          <div className="stat-label">Pendiente por cobrar (acumulado)</div>
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
            <CtaCteDetalle
              alumno={seleccionado}
              actividades={actividades}
              sinTarjeta
              onVerPerfil={() => setModalPerfilAbierto(true)}
            />
          </div>
        </div>
      )}

      {modalPerfilAbierto && seleccionado && (
        <AlumnoModal
          alumno={seleccionado}
          actividades={actividades}
          turnos={turnos}
          onSave={handleGuardarPerfil}
          onClose={() => setModalPerfilAbierto(false)}
          onVerCtaCte={() => setModalPerfilAbierto(false)}
        />
      )}

      {modalPagoAbierto && <NuevoPagoModal onClose={() => setModalPagoAbierto(false)} />}

      {modalHistorialAbierto && (
        <HistorialCobrosModal onClose={() => setModalHistorialAbierto(false)} />
      )}

      {conSocio && modalViviAbierto && <CuentaViviModal onClose={() => setModalViviAbierto(false)} />}
    </div>
  )
}
