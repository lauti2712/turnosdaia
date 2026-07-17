import { useEffect, useState } from 'react'
import {
  subscribeMovimientos,
  eliminarMovimiento,
  calcularSaldo,
  mesesTranscurridos,
} from '../data/movimientos'
import { montoMensualEfectivo } from '../data/actividades'
import MovimientoForm from './MovimientoForm'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)

export default function CtaCteDetalle({ alumno, actividades, sinTarjeta = false }) {
  const [movimientos, setMovimientos] = useState([])

  useEffect(() => subscribeMovimientos(alumno.id, setMovimientos), [alumno.id])

  const montoMensual = montoMensualEfectivo(alumno, actividades)
  const alumnoConPrecio = { ...alumno, montoMensual }
  const saldo = calcularSaldo(alumnoConPrecio, movimientos)
  const meses = mesesTranscurridos(alumno.fechaInicio)
  const deudaTotal = meses * montoMensual
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
                </td>
                <td>{fmtMoney(m.monto)}</td>
                <td className="muted">{[m.formaPago, m.descripcion].filter(Boolean).join(' · ')}</td>
                <td>
                  <button className="icon-btn" onClick={() => eliminarMovimiento(m.id)}>
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
  )
}
