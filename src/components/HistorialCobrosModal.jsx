import { useEffect, useState } from 'react'
import { subscribeAlumnos, eventosBonificacionYTarifa } from '../data/alumnos'
import {
  subscribeTodosMovimientos,
  eliminarMovimiento,
  actualizarMovimientoPago,
  actualizarMovimientoAjuste,
} from '../data/movimientos'
import MovimientoEditModal from './MovimientoEditModal'
import { mostrarSocio } from '../data/espacios'
import { useEspacio } from '../context/EspacioContext'
import { fmtFecha } from '../utils/fechas'

const TIPOS = [
  { valor: 'pago', label: 'Pagos' },
  { valor: 'ajuste', label: 'Ajustes' },
  { valor: 'bonificacion', label: 'Bonificaciones' },
  { valor: 'cambio_tarifa', label: 'Cambios de tarifa' },
]

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
  const { espacioActualId, espacioActual } = useEspacio()
  const socioNombre = espacioActual?.socioNombre || 'el socio'
  const conSocio = mostrarSocio(espacioActual)
  const [alumnos, setAlumnos] = useState([])
  const [movimientosTodos, setMovimientosTodos] = useState([])
  const [mes, setMes] = useState(mesActualId())
  const [editando, setEditando] = useState(null)
  const [tiposVisibles, setTiposVisibles] = useState(TIPOS.map((t) => t.valor))

  useEffect(() => subscribeAlumnos(setAlumnos), [])
  useEffect(() => subscribeTodosMovimientos(setMovimientosTodos), [])

  function toggleTipo(valor) {
    setTiposVisibles((prev) =>
      prev.includes(valor) ? prev.filter((v) => v !== valor) : [...prev, valor],
    )
  }

  async function handleGuardarEdicion(datos) {
    if (editando.tipo === 'pago') {
      await actualizarMovimientoPago(editando.id, datos)
    } else {
      await actualizarMovimientoAjuste(editando.id, datos)
    }
  }

  const alumnosPorId = Object.fromEntries(alumnos.map((a) => [a.id, a]))
  const alumnosDelEspacio = alumnos.filter((a) => a.espacioId === espacioActualId)
  const movimientos = movimientosTodos.filter((m) => m.espacioId === espacioActualId)
  const eventos = alumnosDelEspacio.flatMap((a) => eventosBonificacionYTarifa(a))

  const delMes = [...movimientos, ...eventos]
    .filter((m) => (m.fecha || '').startsWith(mes))
    .filter((m) => tiposVisibles.includes(m.tipo))
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
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

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          {TIPOS.map((t) => (
            <label
              key={t.valor}
              className="muted"
              style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: '0.82rem' }}
            >
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={tiposVisibles.includes(t.valor)}
                onChange={() => toggleTipo(t.valor)}
              />
              {t.label}
            </label>
          ))}
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
                  const nombreAlumno = alumno ? `${alumno.apellido}, ${alumno.nombre}` : '(alumno eliminado)'

                  if (m.tipo === 'bonificacion') {
                    return (
                      <tr key={m.id}>
                        <td>{fmtFecha(m.fecha)}</td>
                        <td>{nombreAlumno}</td>
                        <td>
                          <span className="badge badge-warning">Bonificación</span>
                        </td>
                        <td>{m.tipoBonif === 'porcentaje' ? `${m.valor}%` : fmtMoney(m.valor)}</td>
                        <td className="muted">{m.motivo || ''}</td>
                        <td></td>
                      </tr>
                    )
                  }
                  if (m.tipo === 'cambio_tarifa') {
                    const t = m.tarifa
                    const precioTexto =
                      t.precioManual != null
                        ? `${fmtMoney(t.precioManual)} (manual)`
                        : `${t.diasPorSemana} días/semana`
                    return (
                      <tr key={m.id}>
                        <td>{fmtFecha(m.fecha)}</td>
                        <td>{nombreAlumno}</td>
                        <td>
                          <span className="badge badge-warning">Cambio de tarifa</span>
                        </td>
                        <td></td>
                        <td className="muted">{precioTexto}</td>
                        <td></td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={m.id}>
                      <td>{fmtFecha(m.fecha)}</td>
                      <td>{nombreAlumno}</td>
                      <td>
                        {m.tipo === 'pago' ? (
                          <span className="badge badge-success">Pago</span>
                        ) : (
                          <span className="badge badge-warning">Ajuste</span>
                        )}
                        {conSocio && m.abonadoAVivi && (
                          <span className="badge badge-warning" style={{ marginLeft: 4 }}>
                            {socioNombre} {m.porcentajeVivi ?? 100}%
                          </span>
                        )}
                      </td>
                      <td>{fmtMoney(m.monto)}</td>
                      <td className="muted">{[m.formaPago, m.descripcion].filter(Boolean).join(' · ')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="btn btn-sm" onClick={() => setEditando(m)}>
                            Editar
                          </button>
                          <button className="icon-btn" aria-label="Eliminar" onClick={() => handleEliminar(m)}>
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
      </div>

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
    </div>
  )
}
