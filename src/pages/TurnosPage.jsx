import { useEffect, useState } from 'react'
import { subscribeTurnos, crearTurno, actualizarTurno } from '../data/turnos'
import { subscribeAlumnos } from '../data/alumnos'
import TurnoCard from '../components/TurnoCard'
import TurnoModal from '../components/TurnoModal'

export default function TurnosPage() {
  const [turnos, setTurnos] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)

  useEffect(() => subscribeTurnos(setTurnos), [])
  useEffect(() => subscribeAlumnos(setAlumnos), [])

  const alumnosPorId = Object.fromEntries(alumnos.map((a) => [a.id, a]))
  const alumnosActivos = alumnos.filter((a) => a.activo !== false)

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
        <button className="btn btn-primary" onClick={abrirNuevo}>
          + Nuevo turno
        </button>
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
            onEditar={abrirEditar}
          />
        ))
      )}

      {modalAbierto && (
        <TurnoModal turno={editando} onSave={handleSave} onClose={() => setModalAbierto(false)} />
      )}
    </div>
  )
}
