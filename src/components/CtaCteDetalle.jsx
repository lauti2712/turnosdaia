import { useEffect, useState } from 'react'
import {
  subscribeMovimientos,
  registrarPago,
  registrarAjuste,
  eliminarMovimiento,
  calcularSaldo,
  mesesTranscurridos,
} from '../data/movimientos'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)
const hoy = () => new Date().toISOString().slice(0, 10)

export default function CtaCteDetalle({ alumno }) {
  const [movimientos, setMovimientos] = useState([])
  const [tipo, setTipo] = useState('pago')
  const [monto, setMonto] = useState(alumno.montoMensual || '')
  const [fecha, setFecha] = useState(hoy())
  const [formaPago, setFormaPago] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setMonto(alumno.montoMensual || '')
    return subscribeMovimientos(alumno.id, setMovimientos)
  }, [alumno.id])

  const saldo = calcularSaldo(alumno, movimientos)
  const meses = mesesTranscurridos(alumno.fechaInicio)
  const deudaTotal = meses * (alumno.montoMensual || 0)
  const pagado = movimientos.filter((m) => m.tipo === 'pago').reduce((a, m) => a + m.monto, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!monto) return
    setGuardando(true)
    try {
      if (tipo === 'pago') {
        await registrarPago({ alumnoId: alumno.id, monto, fecha, formaPago, descripcion })
      } else {
        await registrarAjuste({ alumnoId: alumno.id, monto, fecha, descripcion })
      }
      setMonto(alumno.montoMensual || '')
      setDescripcion('')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="card">
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

      <form onSubmit={handleSubmit} style={{ marginBottom: 18 }}>
        <div className="form-row">
          <div className="field">
            <label>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="pago">Pago</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </div>
          <div className="field">
            <label>Monto {tipo === 'ajuste' && '(+ suma deuda, − la resta)'}</label>
            <input
              type="number"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
          {tipo === 'pago' && (
            <div className="field">
              <label>Forma de pago</label>
              <input
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
                placeholder="Efectivo, transferencia..."
              />
            </div>
          )}
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label>Descripción {tipo === 'ajuste' && '(motivo, obligatorio)'}</label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required={tipo === 'ajuste'}
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            Registrar {tipo === 'pago' ? 'pago' : 'ajuste'}
          </button>
        </div>
      </form>

      {movimientos.length === 0 ? (
        <div className="empty-state">Todavía no hay movimientos registrados.</div>
      ) : (
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
      )}
    </div>
  )
}
