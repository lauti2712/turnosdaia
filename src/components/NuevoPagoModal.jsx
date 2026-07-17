import { useEffect, useState } from 'react'
import { subscribeAlumnos } from '../data/alumnos'
import { subscribeActividades, montoMensualEfectivo } from '../data/actividades'
import AlumnoBuscador from './AlumnoBuscador'
import MovimientoForm from './MovimientoForm'

export default function NuevoPagoModal({ onClose }) {
  const [alumnos, setAlumnos] = useState([])
  const [actividades, setActividades] = useState([])
  const [alumno, setAlumno] = useState(null)

  useEffect(() => subscribeAlumnos(setAlumnos), [])
  useEffect(() => subscribeActividades(setActividades), [])

  const activos = alumnos.filter((a) => a.activo !== false)
  const alumnoConPrecio = alumno
    ? { ...alumno, montoMensual: montoMensualEfectivo(alumno, actividades) }
    : null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="page-title" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Nuevo pago</h3>
          <button className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            ✕
          </button>
        </div>

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
      </div>
    </div>
  )
}
