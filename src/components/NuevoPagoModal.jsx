import { useEffect, useState } from 'react'
import { subscribeAlumnos } from '../data/alumnos'
import MovimientoForm from './MovimientoForm'

export default function NuevoPagoModal({ onClose }) {
  const [alumnos, setAlumnos] = useState([])
  const [alumnoId, setAlumnoId] = useState('')

  useEffect(() => subscribeAlumnos(setAlumnos), [])

  const activos = alumnos
    .filter((a) => a.activo !== false)
    .sort((a, b) => (a.apellido || '').localeCompare(b.apellido || ''))

  const alumno = activos.find((a) => a.id === alumnoId)

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
          <select value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)} autoFocus>
            <option value="">Elegir alumno...</option>
            {activos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.apellido}, {a.nombre}
              </option>
            ))}
          </select>
        </div>

        {alumno ? (
          <MovimientoForm alumno={alumno} tipoInicial="pago" onGuardado={onClose} />
        ) : (
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            Elegí un alumno para cargar el pago.
          </p>
        )}
      </div>
    </div>
  )
}
