import { useEffect, useState } from 'react'
import {
  subscribeMovimientos,
  eliminarMovimiento,
  actualizarMovimientoPago,
  actualizarMovimientoAjuste,
  calcularSaldo,
  montoViviDePago,
  montoPropioDePago,
} from '../data/movimientos'
import { montoMensualEfectivo } from '../data/actividades'
import { bonificarMes, quitarBonificacion, DESDE_INICIAL, eventosBonificacionYTarifa } from '../data/alumnos'
import { mostrarSocio } from '../data/espacios'
import MovimientoForm from './MovimientoForm'
import MovimientoEditModal from './MovimientoEditModal'
import BonificacionEditModal from './BonificacionEditModal'
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

export default function CtaCteDetalle({
  alumno,
  actividades,
  sinTarjeta = false,
  onVerPerfil,
  onArchivarClick,
}) {
  const { espacioActual } = useEspacio()
  const socioNombre = espacioActual?.socioNombre || 'el socio'
  const conSocio = mostrarSocio(espacioActual)
  const [movimientos, setMovimientos] = useState([])
  const [editando, setEditando] = useState(null)
  const [editandoBonificacion, setEditandoBonificacion] = useState(null)
  const [modalTarifaAbierto, setModalTarifaAbierto] = useState(false)
  const [mesABonificar, setMesABonificar] = useState(mesActualId())
  const [tipoBonificacion, setTipoBonificacion] = useState('porcentaje')
  const [valorBonificacion, setValorBonificacion] = useState('100')
  const [motivoTipo, setMotivoTipo] = useState('no_asistio')
  const [motivoLibre, setMotivoLibre] = useState('')

  const bonificaciones = alumno.bonificaciones || []
  const actividadesPorId = Object.fromEntries(actividades.map((a) => [a.id, a]))

  const precioMesABonificar = montoMensualEfectivo(alumno, actividades, mesABonificar)
  const valorBonificacionNum = Number(valorBonificacion) || 0
  const descuentoPreview =
    tipoBonificacion === 'porcentaje'
      ? precioMesABonificar * (valorBonificacionNum / 100)
      : valorBonificacionNum
  const pendientePreview = Math.max(precioMesABonificar - descuentoPreview, 0)

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

  async function handleGuardarBonificacion(datos) {
    await bonificarMes(alumno.id, { mes: editandoBonificacion.mes, ...datos }, bonificaciones)
  }

  useEffect(() => subscribeMovimientos(alumno.id, setMovimientos), [alumno.id])

  const montoMensual = montoMensualEfectivo(alumno, actividades)
  const alumnoConPrecio = { ...alumno, montoMensual }
  const saldo = calcularSaldo(alumno, movimientos, actividades)

  // Bonificaciones y cambios de tarifa no son movimientos reales (no están
  // en la colección `movimientos`), pero se muestran igual en la lista para
  // tener el historial completo en un solo lugar, ordenado por fecha.
  const filas = [...movimientos, ...eventosBonificacionYTarifa(alumno)].sort((a, b) =>
    (b.fecha || '').localeCompare(a.fecha || ''),
  )

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
          {onArchivarClick && (
            <button type="button" className="btn btn-sm" onClick={() => onArchivarClick(alumno)}>
              {alumno.activo === false ? 'Reactivar' : 'Dar de baja'}
            </button>
          )}
        </h2>
        <span className={`badge ${saldo > 0 ? 'badge-danger' : 'badge-success'}`}>
          Saldo: {fmtMoney(saldo)}
        </span>
      </div>

      <p className="muted" style={{ fontSize: '0.85rem', marginTop: 0 }}>
        Alumno desde {fmtFecha(alumno.fechaInicio)}
        {saldo > 0 && ` · debe ${fmtMoney(saldo)}`}
      </p>

      {alumno.historialTarifas?.length > 0 && (
        <button
          type="button"
          className="btn btn-sm"
          style={{ marginBottom: 10 }}
          onClick={() => setModalTarifaAbierto(true)}
        >
          Historial de tarifa
        </button>
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

        <p className="muted" style={{ fontSize: '0.78rem', marginTop: 8, marginBottom: 0 }}>
          Mes {etiquetaMes(mesABonificar)}: {fmtMoney(precioMesABonificar)} · descuento{' '}
          {fmtMoney(descuentoPreview)} · quedaría pendiente {fmtMoney(pendientePreview)}
        </p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <MovimientoForm alumno={alumnoConPrecio} actividades={actividades} />
      </div>

      {filas.length === 0 ? (
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
            {filas.map((f) => {
              if (f.tipo === 'bonificacion') {
                return (
                  <tr key={f.id}>
                    <td>{etiquetaMes(f.mes)}</td>
                    <td>
                      <span className="badge badge-warning">Bonificación</span>
                    </td>
                    <td>
                      {f.tipoBonif === 'porcentaje' ? `${f.valor}%` : fmtMoney(f.valor)}
                    </td>
                    <td className="muted">{f.motivo || ''}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => setEditandoBonificacion({ mes: f.mes, tipo: f.tipoBonif, valor: f.valor, motivo: f.motivo })}
                        >
                          Editar
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => quitarBonificacion(alumno.id, f.mes, bonificaciones)}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              }
              if (f.tipo === 'cambio_tarifa') {
                const t = f.tarifa
                const precioTexto =
                  t.precioManual != null
                    ? `${fmtMoney(t.precioManual)} (manual)`
                    : `${t.diasPorSemana} días/semana${
                        actividadesPorId[t.actividadId] ? ' — ' + actividadesPorId[t.actividadId].nombre : ''
                      }`
                return (
                  <tr key={f.id}>
                    <td>{etiquetaMes(f.desde)}</td>
                    <td>
                      <span className="badge badge-warning">Cambio de tarifa</span>
                    </td>
                    <td></td>
                    <td className="muted">Rige desde {etiquetaMes(f.desde)}: {precioTexto}</td>
                    <td></td>
                  </tr>
                )
              }
              const m = f
              return (
                <tr key={m.id}>
                  <td>{fmtFecha(m.fecha)}</td>
                  <td>
                    {m.tipo === 'pago' ? (
                      <span className="badge badge-success">Pago</span>
                    ) : (
                      <span className="badge badge-warning">Ajuste</span>
                    )}
                    {conSocio && m.tipo === 'pago' && m.abonadoAVivi && (
                      <span className="badge badge-warning" style={{ marginLeft: 4 }}>
                        Cobró {socioNombre}
                      </span>
                    )}
                  </td>
                  <td>{fmtMoney(m.monto)}</td>
                  <td className="muted">
                    {conSocio && m.tipo === 'pago' && m.abonadoAVivi ? (
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
              )
            })}
          </tbody>
        </table>
        </div>
      )}

      {editando && (
        <MovimientoEditModal
          movimiento={editando}
          tipo={editando.tipo}
          socioNombre={socioNombre}
          conSocio={conSocio}
          onSave={handleGuardarEdicion}
          onClose={() => setEditando(null)}
        />
      )}

      {editandoBonificacion && (
        <BonificacionEditModal
          bonificacion={editandoBonificacion}
          onSave={handleGuardarBonificacion}
          onClose={() => setEditandoBonificacion(null)}
        />
      )}

      {modalTarifaAbierto && (
        <div className="modal-overlay" onClick={() => setModalTarifaAbierto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="page-title" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Historial de tarifa</h3>
              <button className="icon-btn" aria-label="Cerrar" onClick={() => setModalTarifaAbierto(false)}>
                ✕
              </button>
            </div>
            <div className="scroll-x">
              <table>
                <thead>
                  <tr>
                    <th>Desde</th>
                    <th>Actividad</th>
                    <th>Días/semana</th>
                    <th>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {[...alumno.historialTarifas]
                    .sort((a, b) => a.desde.localeCompare(b.desde))
                    .map((t, i) => {
                      const desdeTexto = t.desde === DESDE_INICIAL ? 'El inicio' : etiquetaMes(t.desde)
                      const precio = montoMensualEfectivo(
                        { actividadId: t.actividadId, diasPorSemana: t.diasPorSemana, precioManual: t.precioManual },
                        actividades,
                        t.desde,
                      )
                      return (
                        <tr key={i}>
                          <td>{desdeTexto}</td>
                          <td>{t.precioManual != null ? '—' : actividadesPorId[t.actividadId]?.nombre || '—'}</td>
                          <td>{t.precioManual != null ? '—' : t.diasPorSemana}</td>
                          <td>
                            {fmtMoney(precio)}
                            {t.precioManual != null && ' (manual)'}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
