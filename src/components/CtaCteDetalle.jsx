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
import MovimientoForm from './MovimientoForm'
import MovimientoEditModal from './MovimientoEditModal'
import { useEspacio } from '../context/EspacioContext'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)

export default function CtaCteDetalle({ alumno, actividades, sinTarjeta = false }) {
  const { espacioActual } = useEspacio()
  const socioNombre = espacioActual?.socioNombre || 'el socio'
  const [movimientos, setMovimientos] = useState([])
  const [editando, setEditando] = useState(null)

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
        <h2 style={{ margin: 0 }}>
          {alumno.apellido}, {alumno.nombre}
        </h2>
        <span className={`badge ${saldo > 0 ? 'badge-danger' : 'badge-success'}`}>
          Saldo: {fmtMoney(saldo)}
        </span>
      </div>

      <p className="muted" style={{ fontSize: '0.85rem', marginTop: 0 }}>
        Cliente desde {alumno.fechaInicio} · {meses} {meses === 1 ? 'mes' : 'meses'} devengados ·
        deuda generada {fmtMoney(deudaTotal)} · pagado {fmtMoney(pagado)}
      </p>

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
                <td>{m.fecha}</td>
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
