import { useEffect, useState } from 'react'
import { registrarPago, registrarAjuste } from '../data/movimientos'
import { porcentajeViviDeAlumno } from '../data/actividades'
import { useEspacio } from '../context/EspacioContext'

const hoy = () => new Date().toISOString().slice(0, 10)

export default function MovimientoForm({ alumno, actividades = [], tipoInicial = 'pago', onGuardado }) {
  const { espacioActual } = useEspacio()
  const socioNombre = espacioActual?.socioNombre || 'el socio'
  const [tipo, setTipo] = useState(tipoInicial)
  const [monto, setMonto] = useState(alumno.montoMensual || '')
  const [fecha, setFecha] = useState(hoy())
  const [formaPago, setFormaPago] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [abonadoAVivi, setAbonadoAVivi] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setMonto(alumno.montoMensual || '')
  }, [alumno.id])

  const porcentajeVivi = porcentajeViviDeAlumno(alumno, actividades)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!monto) return
    setGuardando(true)
    try {
      if (tipo === 'pago') {
        await registrarPago({
          espacioId: alumno.espacioId,
          alumnoId: alumno.id,
          monto,
          fecha,
          formaPago,
          descripcion,
          abonadoAVivi,
          porcentajeVivi,
        })
      } else {
        await registrarAjuste({ espacioId: alumno.espacioId, alumnoId: alumno.id, monto, fecha, descripcion })
      }
      setMonto(alumno.montoMensual || '')
      setDescripcion('')
      setAbonadoAVivi(false)
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
      {tipo === 'pago' && (
        <div style={{ marginTop: 10 }}>
          <label
            className="muted"
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              fontSize: '0.85rem',
            }}
          >
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={abonadoAVivi}
              onChange={(e) => setAbonadoAVivi(e.target.checked)}
            />
            Abonado a {socioNombre} (lo cobró directamente)
          </label>
          <div className="muted" style={{ fontSize: '0.78rem', marginTop: 4, marginLeft: 22 }}>
            De este pago, {porcentajeVivi}% le corresponde a {socioNombre} según su actividad
            {abonadoAVivi
              ? ' (te debe el resto).'
              : ` — se lo pagás cuando quieras desde "Nuevo pago" → "A ${socioNombre}".`}
          </div>
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={guardando}>
          Registrar {tipo === 'pago' ? 'pago' : 'ajuste'}
        </button>
      </div>
    </form>
  )
}
