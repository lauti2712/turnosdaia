import { useEffect, useState } from 'react'
import { subscribeAlumnos } from '../data/alumnos'
import { subscribeActividades, montoMensualEfectivo } from '../data/actividades'
import { registrarPagoVivi } from '../data/pagosVivi'
import AlumnoBuscador from './AlumnoBuscador'
import MovimientoForm from './MovimientoForm'

const hoy = () => new Date().toISOString().slice(0, 10)

export default function NuevoPagoModal({ onClose }) {
  const [destino, setDestino] = useState('alumno') // 'alumno' | 'vivi'
  const [alumnos, setAlumnos] = useState([])
  const [actividades, setActividades] = useState([])
  const [alumno, setAlumno] = useState(null)

  const [montoVivi, setMontoVivi] = useState('')
  const [fechaVivi, setFechaVivi] = useState(hoy())
  const [descripcionVivi, setDescripcionVivi] = useState('')
  const [guardandoVivi, setGuardandoVivi] = useState(false)

  useEffect(() => subscribeAlumnos(setAlumnos), [])
  useEffect(() => subscribeActividades(setActividades), [])

  const activos = alumnos.filter((a) => a.activo !== false)
  const alumnoConPrecio = alumno
    ? { ...alumno, montoMensual: montoMensualEfectivo(alumno, actividades) }
    : null

  async function handleSubmitVivi(e) {
    e.preventDefault()
    if (!montoVivi) return
    setGuardandoVivi(true)
    try {
      await registrarPagoVivi({ monto: montoVivi, fecha: fechaVivi, descripcion: descripcionVivi })
      onClose()
    } finally {
      setGuardandoVivi(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="page-title" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Nuevo pago</h3>
          <button className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button
            type="button"
            className={`btn ${destino === 'alumno' ? 'btn-primary' : ''}`}
            onClick={() => setDestino('alumno')}
          >
            Alumno
          </button>
          <button
            type="button"
            className={`btn ${destino === 'vivi' ? 'btn-primary' : ''}`}
            onClick={() => setDestino('vivi')}
          >
            A Vivi
          </button>
        </div>

        {destino === 'alumno' ? (
          <>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Alumno</label>
              {alumno ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}
                >
                  <span>
                    {alumno.apellido}, {alumno.nombre}
                  </span>
                  <button type="button" className="btn btn-sm" onClick={() => setAlumno(null)}>
                    Cambiar
                  </button>
                </div>
              ) : (
                <AlumnoBuscador alumnos={activos} onSeleccionar={setAlumno} autoFocus />
              )}
            </div>

            {alumnoConPrecio ? (
              <MovimientoForm
                alumno={alumnoConPrecio}
                actividades={actividades}
                tipoInicial="pago"
                onGuardado={onClose}
              />
            ) : (
              <p className="muted" style={{ fontSize: '0.85rem' }}>
                Buscá y elegí un alumno para cargar el pago.
              </p>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmitVivi}>
            <p className="muted" style={{ fontSize: '0.85rem', marginTop: 0 }}>
              Registrá un pago que le hacés a Vivi de lo que fuiste cobrando, cuando vos quieras.
            </p>
            <div className="form-row">
              <div className="field">
                <label>Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={montoVivi}
                  onChange={(e) => setMontoVivi(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="field">
                <label>Fecha</label>
                <input
                  type="date"
                  value={fechaVivi}
                  onChange={(e) => setFechaVivi(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label>Descripción (opcional)</label>
              <input value={descripcionVivi} onChange={(e) => setDescripcionVivi(e.target.value)} />
            </div>
            <div style={{ marginTop: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={guardandoVivi}>
                Registrar pago a Vivi
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
