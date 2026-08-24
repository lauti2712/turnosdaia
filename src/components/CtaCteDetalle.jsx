import { useEffect, useState } from 'react'
import {
  subscribeMovimientos,
  eliminarMovimiento,
  actualizarMovimientoPago,
  actualizarMovimientoAjuste,
  calcularSaldo,
  deudaGenerada,
  mesesTranscurridos,
  montoViviDePago,
  montoPropioDePago,
} from '../data/movimientos'
import { montoMensualEfectivo } from '../data/actividades'
import { bonificarMes, quitarBonificacion, DESDE_INICIAL } from '../data/alumnos'
import MovimientoForm from './MovimientoForm'
import MovimientoEditModal from './MovimientoEditModal'
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

function etiquetaMes(mesId) {
  const [anio, mes] = mesId.split('-').map(Number)
  return `${MESES[mes - 1]} ${anio}`
}

function mesActualId() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MOTIVOS_PRESET = {
  no_asistio: 'No asistió',
  medio_mes: 'Comienzo a medio mes',
  libre: null, // se completa con el texto libre
}

export default function CtaCteDetalle({ alumno, actividades, sinTarjeta = false, onVerPerfil }) {
  const { espacioActual } = useEspacio()
  const socioNombre = espacioActual?.socioNombre || 'el socio'
  const [movimientos, setMovimientos] = useState([])
  const [editando, setEditando] = useState(null)
  const [mesABonificar, setMesABonificar] = useState(mesActualId())
  const [tipoBonificacion, setTipoBonificacion] = useState('porcentaje')
  const [valorBonificacion, setValorBonificacion] = useState('100')
  const [motivoTipo, setMotivoTipo] = useState('no_asistio')
  const [motivoLibre, setMotivoLibre] = useState('')

  const bonificaciones = alumno.bonificaciones || []
  const actividadesPorId = Object.fromEntries(actividades.map((a) => [a.id, a]))

  async function handleBonificar(e) {
    e.preventDefault()
    const motivo = motivoTipo === 'libre' ? motivoLibre : MOTIVOS_PRESET[motivoTipo]
    await bonificarMes(
      alumno.id,
      { mes: mesABonificar, tipo: tipoBonificacion, valor: Number(valorBonificacion) || 0, motivo },
      bonificaciones,
    )
    setMotivoLibre('')
  }

  async function handleGuardarEdicion(datos) {
    if (editando.tipo === 'pago') {
      await actualizarMovimientoPago(editando.id, datos)
    } else {
      await actualizarMovimientoAjuste(editando.id, datos)
    }
  }

  useEffect(() => subscribeMovimientos(alumno.id, setMovimientos), [alumno.id])

  const montoMensual = montoMensualEfectivo(alumno, actividades)
  const alumnoConPrecio = { ...alumno, montoMensual }
  const saldo = calcularSaldo(alumno, movimientos, actividades)
  const meses = mesesTranscurridos(alumno.fechaInicio)
  const deudaTotal = deudaGenerada(alumno, actividades)
  const pagado = movimientos.filter((m) => m.tipo === 'pago').reduce((a, m) => a + m.monto, 0)

  return (
    <div className={sinTarjeta ? '' : 'card'}>
      <div className="page-title" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          {alumno.apellido}, {alumno.nombre}
          {onVerPerfil && (
            <button type="button" className="btn btn-sm" onClick={onVerPerfil}>
              Ver perfil
            </button>
          )}
        </h2>
        <span className={`badge ${saldo > 0 ? 'badge-danger' : 'badge-success'}`}>
          Saldo: {fmtMoney(saldo)}
        </span>
      </div>

      <p className="muted" style={{ fontSize: '0.85rem', marginTop: 0 }}>
        Cliente desde {fmtFecha(alumno.fechaInicio)} · {meses} {meses === 1 ? 'mes' : 'meses'} devengados ·
        deuda generada {fmtMoney(deudaTotal)} · pagado {fmtMoney(pagado)}
        {bonificaciones.length > 0 &&
          ` · ${bonificaciones.length} ${bonificaciones.length === 1 ? 'mes bonificado' : 'meses bonificados'}`}
      </p>

      {alumno.historialTarifas?.length > 0 && (
        <p className="muted" style={{ fontSize: '0.8rem' }}>
          <strong>Historial de tarifa:</strong>{' '}
          {[...alumno.historialTarifas]
            .sort((a, b) => a.desde.localeCompare(b.desde))
            .map((t, i) => {
              const desdeTexto = t.desde === DESDE_INICIAL ? 'el inicio' : etiquetaMes(t.desde)
              const precioTexto =
                t.precioManual != null
                  ? `${fmtMoney(t.precioManual)} (manual)`
                  : `${t.diasPorSemana} días/semana${
                      actividadesPorId[t.actividadId] ? ' — ' + actividadesPorId[t.actividadId].nombre : ''
                    }`
              return (
                <span key={i}>
                  {i > 0 && ' → '}
                  Desde {desdeTexto}: {precioTexto}
                </span>
              )
            })}
        </p>
      )}

      <div style={{ marginBottom: 18, border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
        <label style={{ fontSize: '0.78rem' }}>Bonificar un mes</label>
        <form onSubmit={handleBonificar} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="muted" style={{ fontSize: '0.75rem' }}>
              Mes
            </label>
            <input
              type="month"
              value={mesABonificar}
              onChange={(e) => setMesABonificar(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="muted" style={{ fontSize: '0.75rem' }}>
              Tipo
            </label>
            <select value={tipoBonificacion} onChange={(e) => setTipoBonificacion(e.target.value)}>
              <option value="porcentaje">% del mes</option>
              <option value="monto">Monto fijo</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="muted" style={{ fontSize: '0.75rem' }}>
              {tipoBonificacion === 'porcentaje' ? 'Porcentaje' : 'Monto'}
            </label>
            <input
              type="number"
              min="0"
              max={tipoBonificacion === 'porcentaje' ? 100 : undefined}
              value={valorBonificacion}
              onChange={(e) => setValorBonificacion(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="muted" style={{ fontSize: '0.75rem' }}>
              Motivo
            </label>
            <select value={motivoTipo} onChange={(e) => setMotivoTipo(e.target.value)}>
              <option value="no_asistio">No asistió</option>
              <option value="medio_mes">Comienzo a medio mes</option>
              <option value="libre">Texto libre</option>
            </select>
          </div>
          {motivoTipo === 'libre' && (
            <div className="field" style={{ marginBottom: 0, flex: 1 }}>
              <label className="muted" style={{ fontSize: '0.75rem' }}>
                Detalle
              </label>
              <input
                value={motivoLibre}
                onChange={(e) => setMotivoLibre(e.target.value)}
                placeholder="Motivo..."
                required
              />
            </div>
          )}
          <button type="submit" className="btn btn-sm">
            Bonificar
          </button>
        </form>

        {bonificaciones.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {bonificaciones
              .slice()
              .sort((a, b) => b.mes.localeCompare(a.mes))
              .map((b) => {
                const tipo = b.tipo || 'porcentaje'
                const valor = b.valor ?? 100
                return (
                  <span
                    key={b.mes}
                    className="badge badge-warning"
                    style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                  >
                    {etiquetaMes(b.mes)} · {tipo === 'porcentaje' ? `${valor}%` : fmtMoney(valor)}
                    {b.motivo && ` · ${b.motivo}`}
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Quitar bonificación"
                      onClick={() => quitarBonificacion(alumno.id, b.mes, bonificaciones)}
                    >
                      ✕
                    </button>
                  </span>
                )
              })}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 18 }}>
        <MovimientoForm alumno={alumnoConPrecio} actividades={actividades} />
      </div>

      {movimientos.length === 0 ? (
        <div className="empty-state">Todavía no hay movimientos registrados.</div>
      ) : (
        <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Detalle</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id}>
                <td>{fmtFecha(m.fecha)}</td>
                <td>
                  {m.tipo === 'pago' ? (
                    <span className="badge badge-success">Pago</span>
                  ) : (
                    <span className="badge badge-warning">Ajuste</span>
                  )}
                  {m.tipo === 'pago' && m.abonadoAVivi && (
                    <span className="badge badge-warning" style={{ marginLeft: 4 }}>
                      Cobró {socioNombre}
                    </span>
                  )}
                </td>
                <td>{fmtMoney(m.monto)}</td>
                <td className="muted">
                  {m.tipo === 'pago' && m.abonadoAVivi ? (
                    <>
                      {m.porcentajeVivi ?? 0}% {socioNombre} ({fmtMoney(montoViviDePago(m))}) · propio (
                      {fmtMoney(montoPropioDePago(m))})
                      {(m.formaPago || m.descripcion) &&
                        ' · ' + [m.formaPago, m.descripcion].filter(Boolean).join(' · ')}
                    </>
                  ) : (
                    [m.formaPago, m.descripcion].filter(Boolean).join(' · ')
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm" onClick={() => setEditando(m)}>
                      Editar
                    </button>
                    <button className="icon-btn" onClick={() => eliminarMovimiento(m.id)}>
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {editando && (
        <MovimientoEditModal
          movimiento={editando}
          tipo={editando.tipo}
          socioNombre={socioNombre}
          onSave={handleGuardarEdicion}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  )
}
