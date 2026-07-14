import { useEffect, useState } from 'react'
import { registrarPago, registrarAjuste } from '../data/movimientos'

const hoy = () => new Date().toISOString().slice(0, 10)

export default function MovimientoForm({ alumno, tipoInicial = 'pago', onGuardado }) {
  const [tipo, setTipo] = useState(tipoInicial)
  const [monto, setMonto] = useState(alumno.montoMensual || '')
  const [fecha, setFecha] = useState(hoy())
  const [formaPago, setFormaPago] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setMonto(alumno.montoMensual || '')
  }, [alumno.id])

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
      onGuardado?.()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
  )
}
