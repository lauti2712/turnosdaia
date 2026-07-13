import { useEffect, useState } from 'react'
import { DIAS, subscribeTurnos, crearTurno, actualizarTurno } from '../data/turnos'
import { subscribeAlumnos, crearAlumno } from '../data/alumnos'
import TurnoCard from '../components/TurnoCard'
import TurnoModal from '../components/TurnoModal'
import AlumnoModal from '../components/AlumnoModal'

export default function TurnosPage() {
  const [turnos, setTurnos] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [modalAlumnoAbierto, setModalAlumnoAbierto] = useState(false)
  const [ocultarDiasVacios, setOcultarDiasVacios] = useState(false)

  useEffect(() => subscribeTurnos(setTurnos), [])
  useEffect(() => subscribeAlumnos(setAlumnos), [])

  const alumnosPorId = Object.fromEntries(alumnos.map((a) => [a.id, a]))
  const alumnosActivos = alumnos.filter((a) => a.activo !== false)

  const diasAsignadosPorAlumno = {}
  for (const turno of turnos) {
    for (const dia of DIAS) {
      for (const alumnoId of turno.dias[dia] || []) {
        diasAsignadosPorAlumno[alumnoId] = (diasAsignadosPorAlumno[alumnoId] || 0) + 1
      }
    }
  }

  async function handleSave(datos) {
    if (editando) {
      await actualizarTurno(editando.id, {
        nombre: datos.nombre,
        horario: datos.horario,
        cupoMaximo: Number(datos.cupoMaximo) || 1,
      })
    } else {
      await crearTurno(datos)
    }
  }

  function abrirNuevo() {
    setEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(turno) {
    setEditando(turno)
    setModalAbierto(true)
  }

  return (
    <div>
      <div className="page-title">
        <h2>Turnos</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label className="muted" style={{ fontSize: '0.85rem', display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={ocultarDiasVacios}
              onChange={(e) => setOcultarDiasVacios(e.target.checked)}
            />
            Ocultar días sin alumnos
          </label>
          <button className="btn btn-primary" onClick={() => setModalAlumnoAbierto(true)}>
            + Nuevo alumno
          </button>
          <button className="btn btn-primary" onClick={abrirNuevo}>
            + Nuevo turno
          </button>
        </div>
      </div>

      {turnos.length === 0 ? (
        <div className="card">
          <div className="empty-state">No hay turnos creados todavía.</div>
        </div>
      ) : (
        turnos.map((turno) => (
          <TurnoCard
            key={turno.id}
            turno={turno}
            alumnosPorId={alumnosPorId}
            alumnosActivos={alumnosActivos}
            diasAsignadosPorAlumno={diasAsignadosPorAlumno}
            ocultarDiasVacios={ocultarDiasVacios}
            onEditar={abrirEditar}
          />
        ))
      )}

      {modalAbierto && (
        <TurnoModal turno={editando} onSave={handleSave} onClose={() => setModalAbierto(false)} />
      )}

      {modalAlumnoAbierto && (
        <AlumnoModal onSave={crearAlumno} onClose={() => setModalAlumnoAbierto(false)} />
      )}
    </div>
  )
}
