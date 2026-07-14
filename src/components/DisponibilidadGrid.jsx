import { DIAS, DIAS_LABEL, actualizarOrdenTurno } from '../data/turnos'
import { useIsMobile } from '../hooks/useIsMobile'

export default function DisponibilidadGrid({ turnos }) {
  const isMobile = useIsMobile()
  const filas = turnos
    .map((turno) => {
      const diasActivos = turno.diasActivos?.length > 0 ? turno.diasActivos : DIAS
      const disponiblesPorDia = Object.fromEntries(
        diasActivos.map((dia) => [
          dia,
          Math.max(turno.cupoMaximo - (turno.dias[dia] || []).length, 0),
        ]),
      )
      const hayDisponibilidad = Object.values(disponiblesPorDia).some((n) => n > 0)
      return { turno, disponiblesPorDia, hayDisponibilidad }
    })
    .filter((f) => f.hayDisponibilidad)

  if (filas.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">No hay turnos con cupos disponibles ahora mismo.</div>
      </div>
    )
  }

  async function mover(index, direccion) {
    const otro = index + direccion
    if (otro < 0 || otro >= filas.length) return
    const a = filas[index].turno
    const b = filas[otro].turno
    await Promise.all([
      actualizarOrdenTurno(a.id, b.orden ?? 0),
      actualizarOrdenTurno(b.id, a.orden ?? 0),
    ])
  }

  return (
    <div className="card">
      <div className="scroll-x">
      <table>
        <thead>
          <tr>
            {!isMobile && <th></th>}
            <th>Turno</th>
            {DIAS.map((dia) => (
              <th key={dia}>{DIAS_LABEL[dia]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map(({ turno, disponiblesPorDia }, index) => (
            <tr key={turno.id}>
              {!isMobile && (
                <td>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button
                      className="icon-btn"
                      aria-label="Subir"
                      disabled={index === 0}
                      onClick={() => mover(index, -1)}
                    >
                      ▲
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Bajar"
                      disabled={index === filas.length - 1}
                      onClick={() => mover(index, 1)}
                    >
                      ▼
                    </button>
                  </div>
                </td>
              )}
              <td>{turno.nombre}</td>
              {DIAS.map((dia) => {
                const disponibles = disponiblesPorDia[dia]
                if (disponibles === undefined) {
                  return (
                    <td key={dia} className="muted">
                      —
                    </td>
                  )
                }
                return (
                  <td key={dia}>
                    {disponibles > 0 ? (
                      <span className="badge badge-success">{disponibles}</span>
                    ) : (
                      <span className="badge badge-danger">0</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
