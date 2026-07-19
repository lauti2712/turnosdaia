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
import AlumnoModal from '../components/AlumnoModal'
import { useEspacio } from '../context/EspacioContext'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)

export default function AlumnosPage() {
  const { espacioActualId } = useEspacio()
  const [alumnosTodos, setAlumnosTodos] = useState([])
  const [actividadesTodas, setActividadesTodas] = useState([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => subscribeAlumnos(setAlumnosTodos), [])
  useEffect(() => subscribeActividades(setActividadesTodas), [])

  const alumnos = alumnosTodos.filter((a) => a.espacioId === espacioActualId)
  const actividades = actividadesTodas.filter((a) => a.espacioId === espacioActualId)
  const actividadesPorId = Object.fromEntries(actividades.map((a) => [a.id, a]))

  async function handleSave(datos) {
    if (editando) {
      await actualizarAlumno(editando.id, datos)
    } else {
      await crearAlumno({ ...datos, espacioId: espacioActualId })
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
                <th>Nombre</th>
                <th>Actividad</th>
                <th>Días/semana</th>
                <th>Monto mensual</th>
                <th>Fecha inicio</th>
                <th>Estado</th>
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
                  <td>{a.diasPorSemana}</td>
                  <td>
                    {fmtMoney(montoMensualEfectivo(a, actividades))}
                    {a.precioManual != null && (
                      <span className="badge badge-warning" style={{ marginLeft: 6 }}>
                        Manual
                      </span>
                    )}
                  </td>
                  <td>{a.fechaInicio}</td>
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
          onSave={handleSave}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}
