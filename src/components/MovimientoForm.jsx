import { useEffect, useState } from 'react'
import { registrarPago } from '../data/movimientos'
import { porcentajeViviDeAlumno } from '../data/actividades'
import { mostrarSocio } from '../data/espacios'
import { useEspacio } from '../context/EspacioContext'

const hoy = () => new Date().toISOString().slice(0, 10)

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0)

export default function MovimientoForm({ alumno, actividades = [], onGuardado }) {
  const { espacioActual } = useEspacio()
  const socioNombre = espacioActual?.socioNombre || 'el socio'
  const conSocio = mostrarSocio(espacioActual)
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
  const montoNum = Number(monto) || 0
  const montoVivi = montoNum * (porcentajeVivi / 100)
  const montoPropio = montoNum - montoVivi

  async function handleSubmit(e) {
    e.preventDefault()
    if (!monto) return
    setGuardando(true)
    try {
      await registrarPago({
        espacioId: alumno.espacioId,
        alumnoId: alumno.id,
        monto,
        fecha,
        formaPago,
        descripcion,
        abonadoAVivi: conSocio ? abonadoAVivi : false,
        porcentajeVivi: conSocio ? porcentajeVivi : 0,
      })
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
          <label>Monto</label>
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
        <div className="field">
          <label>Forma de pago</label>
          <input
            value={formaPago}
            onChange={(e) => setFormaPago(e.target.value)}
            placeholder="Efectivo, transferencia..."
          />
        </div>
      </div>
      <div className="field" style={{ marginTop: 10 }}>
        <label>Descripción</label>
        <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </div>
      {conSocio && (
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
            La alumna le pagó directamente a {socioNombre} (no a mí)
          </label>
          <div className="muted" style={{ fontSize: '0.78rem', marginTop: 4, marginLeft: 22 }}>
            {fmtMoney(montoVivi)} ({porcentajeVivi}%) corresponde a {socioNombre}, {fmtMoney(montoPropio)} a mí.
          </div>
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={guardando}>
          Registrar pago
        </button>
      </div>
    </form>
  )
}
