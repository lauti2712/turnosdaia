import { useEffect, useState } from 'react'
import {
  subscribeAlumnos,
  crearAlumno,
  actualizarAlumno,
  archivarAlumno,
  eliminarAlumno,
  coincideBusqueda,
} from '../data/alumnos'
import { subscribeActividades, montoMensualEfectivo } from '../data/actividades'
import { subscribeTurnos, sincronizarAsignaciones, turnosActualesDeAlumno } from '../data/turnos'
import AlumnoModal from '../components/AlumnoModal'
import { useEspacio } from '../context/EspacioContext'
import { fmtFecha } from '../utils/fechas'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)

export default function AlumnosPage() {
  const { espacioActualId } = useEspacio()
  const [alumnosTodos, setAlumnosTodos] = useState([])
  const [actividadesTodas, setActividadesTodas] = useState([])
  const [turnosTodos, setTurnosTodos] = useState([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [ordenColumna, setOrdenColumna] = useState('nombre')
  const [ordenAsc, setOrdenAsc] = useState(true)

  useEffect(() => subscribeAlumnos(setAlumnosTodos), [])
  useEffect(() => subscribeActividades(setActividadesTodas), [])
  useEffect(() => subscribeTurnos(setTurnosTodos), [])

  const alumnos = alumnosTodos.filter((a) => a.espacioId === espacioActualId)
  const actividades = actividadesTodas.filter((a) => a.espacioId === espacioActualId)
  const turnos = turnosTodos.filter((t) => t.espacioId === espacioActualId)
  const actividadesPorId = Object.fromEntries(actividades.map((a) => [a.id, a]))
  const turnosPorId = Object.fromEntries(turnos.map((t) => [t.id, t]))

  function turnoTexto(alumno) {
    // Si el alumno nunca se guardó desde la ficha nueva, alumno.turnos está
    // vacío aunque sí tenga una asignación real (hecha desde la grilla de
    // Turnos) — se reconstruye leyendo turno.dias directamente.
    const asignaciones = alumno.turnos?.length
      ? alumno.turnos
      : turnosActualesDeAlumno(alumno.id, turnos)
    if (!asignaciones.length) return ''
    return asignaciones
      .map((t) => turnosPorId[t.turnoId]?.nombre)
      .filter(Boolean)
      .join(' + ')
  }

  const columnas = {
    nombre: (a) => `${a.apellido}, ${a.nombre}`.toLowerCase(),
    turno: (a) => turnoTexto(a).toLowerCase(),
    actividad: (a) => (actividadesPorId[a.actividadId]?.nombre || '').toLowerCase(),
    dias: (a) => a.diasPorSemana || 0,
    monto: (a) => montoMensualEfectivo(a, actividades),
    fechaInicio: (a) => a.fechaInicio || '',
    estado: (a) => (a.activo === false ? 0 : 1),
  }

  function ordenarPor(columna) {
    if (ordenColumna === columna) {
      setOrdenAsc((v) => !v)
    } else {
      setOrdenColumna(columna)
      setOrdenAsc(true)
    }
  }

  function flechaDe(columna) {
    if (ordenColumna !== columna) return null
    return ordenAsc ? ' ▲' : ' ▼'
  }

  async function handleSave(datos) {
    if (editando) {
      const turnosAntes = turnosActualesDeAlumno(editando.id, turnos)
      await actualizarAlumno(editando.id, datos)
      await sincronizarAsignaciones(editando.id, turnosAntes, datos.turnos)
    } else {
      const ref = await crearAlumno({ ...datos, espacioId: espacioActualId })
      await sincronizarAsignaciones(ref.id, [], datos.turnos)
    }
  }

  function abrirNuevo() {
    setEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(alumno) {
    setEditando(alumno)
    setModalAbierto(true)
  }

  async function handleEliminar(alumno) {
    if (confirm(`¿Eliminar a ${alumno.nombre} ${alumno.apellido}? Esto no borra su historial de pagos.`)) {
      await eliminarAlumno(alumno.id)
    }
  }

  const visibles = alumnos
    .filter((a) => mostrarInactivos || a.activo !== false)
    .filter((a) => coincideBusqueda(a, busqueda))
    .sort((x, y) => {
      const accessor = columnas[ordenColumna]
      const vx = accessor(x)
      const vy = accessor(y)
      const cmp = typeof vx === 'number' ? vx - vy : String(vx).localeCompare(String(vy), 'es')
      return ordenAsc ? cmp : -cmp
    })

  return (
    <div>
      <div className="page-title">
        <h2>Alumnos</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="muted" style={{ fontSize: '0.85rem', display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            Mostrar inactivos
          </label>
          <button className="btn btn-primary" onClick={abrirNuevo}>
            + Nuevo alumno
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o apellido..."
        />
      </div>

      <div className="card">
        {visibles.length === 0 ? (
          <div className="empty-state">
            {busqueda ? 'No hay alumnos que coincidan con la búsqueda.' : 'No hay alumnos cargados todavía.'}
          </div>
        ) : (
          <div className="scroll-x">
          <table>
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => ordenarPor('nombre')}>
                  Nombre{flechaDe('nombre')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => ordenarPor('actividad')}>
                  Actividad{flechaDe('actividad')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => ordenarPor('turno')}>
                  Turno{flechaDe('turno')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => ordenarPor('dias')}>
                  Días/semana{flechaDe('dias')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => ordenarPor('monto')}>
                  Monto mensual{flechaDe('monto')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => ordenarPor('fechaInicio')}>
                  Fecha inicio{flechaDe('fechaInicio')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => ordenarPor('estado')}>
                  Estado{flechaDe('estado')}
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.apellido}, {a.nombre}
                  </td>
                  <td>
                    {actividadesPorId[a.actividadId]?.nombre || <span className="muted">—</span>}
                  </td>
                  <td className="muted">{turnoTexto(a) || '—'}</td>
                  <td>{a.diasPorSemana}</td>
                  <td>
                    {fmtMoney(montoMensualEfectivo(a, actividades))}
                    {a.precioManual != null && (
                      <span className="badge badge-warning" style={{ marginLeft: 6 }}>
                        Manual
                      </span>
                    )}
                  </td>
                  <td>{fmtFecha(a.fechaInicio)}</td>
                  <td>
                    {a.activo === false ? (
                      <span className="badge badge-danger">Inactivo</span>
                    ) : (
                      <span className="badge badge-success">Activo</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn btn-sm" onClick={() => abrirEditar(a)}>
                        Editar
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => archivarAlumno(a.id, a.activo === false)}
                      >
                        {a.activo === false ? 'Reactivar' : 'Archivar'}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(a)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {modalAbierto && (
        <AlumnoModal
          alumno={editando}
          actividades={actividades}
          turnos={turnos}
          onSave={handleSave}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}
