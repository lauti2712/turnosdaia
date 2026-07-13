import { DIAS, DIAS_LABEL } from '../data/turnos'

export default function DisponibilidadGrid({ turnos }) {
  const filas = turnos
    .map((turno) => {
      const diasConAlumnos = DIAS.filter((dia) => (turno.dias[dia] || []).length > 0)
      const diasActivos = diasConAlumnos.length > 0 ? diasConAlumnos : DIAS
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

  return (
    <div className="card">
      <table>
        <thead>
          <tr>
            <th>Turno</th>
            {DIAS.map((dia) => (
              <th key={dia}>{DIAS_LABEL[dia]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map(({ turno, disponiblesPorDia }) => (
            <tr key={turno.id}>
              <td>
                {turno.nombre}
                {turno.horario && <span className="muted"> · {turno.horario}</span>}
              </td>
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
  )
}
