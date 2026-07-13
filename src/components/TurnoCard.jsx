import { useState } from 'react'
import { DIAS, DIAS_LABEL, asignarAlumno, quitarAlumno, eliminarTurno } from '../data/turnos'

function AsignarSelect({ opciones, onAsignar }) {
  const [resetKey, setResetKey] = useState(0)

  if (opciones.length === 0) {
    return <span className="muted" style={{ fontSize: '0.78rem' }}>Sin alumnos disponibles</span>
  }

  return (
    <select
      key={resetKey}
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) {
          onAsignar(e.target.value)
          setResetKey((k) => k + 1)
        }
      }}
    >
      <option value="" disabled>
        + Asignar alumno
      </option>
      {opciones.map((a) => (
        <option key={a.id} value={a.id}>
          {a.apellido}, {a.nombre}
        </option>
      ))}
    </select>
  )
}

export default function TurnoCard({
  turno,
  alumnosPorId,
  alumnosActivos,
  diasAsignadosPorAlumno,
  onEditar,
}) {
  async function handleEliminarTurno() {
    if (confirm(`¿Eliminar el turno "${turno.nombre}"?`)) {
      await eliminarTurno(turno.id)
    }
  }

  return (
    <div className="card">
      <div className="page-title" style={{ marginBottom: 10 }}>
        <div>
          <strong>{turno.nombre}</strong>
          {turno.horario && <span className="muted"> · {turno.horario}</span>}
          <span className="muted"> · cupo {turno.cupoMaximo}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" onClick={() => onEditar(turno)}>
            Editar
          </button>
          <button className="btn btn-sm btn-danger" onClick={handleEliminarTurno}>
            Eliminar
          </button>
        </div>
      </div>

      <div className="turnos-grid">
        {DIAS.map((dia) => {
          const asignados = turno.dias[dia] || []
          const hayCupo = asignados.length < turno.cupoMaximo
          const idsAsignados = new Set(asignados)
          const disponibles = alumnosActivos.filter((a) => !idsAsignados.has(a.id))

          return (
            <div className="turnos-grid-col" key={dia}>
              <div className="turnos-grid-col-header">{DIAS_LABEL[dia]}</div>
              {asignados.map((alumnoId) => {
                const alumno = alumnosPorId[alumnoId]
                const asignadosSemana = diasAsignadosPorAlumno[alumnoId] || 0
                const objetivo = alumno?.diasPorSemana || 0
                return (
                  <div className="turnos-grid-cell" key={alumnoId}>
                    <span>
                      {alumno ? `${alumno.apellido}, ${alumno.nombre}` : '(alumno eliminado)'}
                      {alumno && (
                        <span
                          className="muted"
                          style={{
                            marginLeft: 4,
                            color: asignadosSemana > objetivo ? 'var(--danger)' : undefined,
                          }}
                        >
                          ({asignadosSemana}/{objetivo})
                        </span>
                      )}
                    </span>
                    <button
                      className="icon-btn"
                      aria-label="Quitar"
                      onClick={() => quitarAlumno(turno.id, dia, alumnoId)}
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
              {hayCupo && (
                <div className="turnos-grid-cell empty">
                  <AsignarSelect
                    opciones={disponibles}
                    onAsignar={(alumnoId) => asignarAlumno(turno.id, dia, alumnoId)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
