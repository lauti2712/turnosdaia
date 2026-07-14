import { useEffect, useState } from 'react'
import { subscribeAlumnos } from '../data/alumnos'
import AlumnoBuscador from './AlumnoBuscador'
import MovimientoForm from './MovimientoForm'

export default function NuevoPagoModal({ onClose }) {
  const [alumnos, setAlumnos] = useState([])
  const [alumno, setAlumno] = useState(null)

  useEffect(() => subscribeAlumnos(setAlumnos), [])

  const activos = alumnos.filter((a) => a.activo !== false)

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

        {alumno ? (
          <MovimientoForm alumno={alumno} tipoInicial="pago" onGuardado={onClose} />
        ) : (
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            Buscá y elegí un alumno para cargar el pago.
          </p>
        )}
      </div>
    </div>
  )
}
