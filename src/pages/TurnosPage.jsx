import { useEffect, useState } from 'react'
import { DIAS, subscribeTurnos, crearTurno, actualizarTurno } from '../data/turnos'
import { subscribeAlumnos, crearAlumno } from '../data/alumnos'
import TurnoCard from '../components/TurnoCard'
import TurnoModal from '../components/TurnoModal'
import AlumnoModal from '../components/AlumnoModal'
import DisponibilidadGrid from '../components/DisponibilidadGrid'
import NuevoPagoModal from '../components/NuevoPagoModal'

export default function TurnosPage() {
  const [turnos, setTurnos] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [modalAlumnoAbierto, setModalAlumnoAbierto] = useState(false)
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false)
  const [ocultarDiasVacios, setOcultarDiasVacios] = useState(false)
  const [mostrarDisponibilidad, setMostrarDisponibilidad] = useState(true)

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
      await actualizarTurno(editando.id, datos)
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="muted" style={{ fontSize: '0.85rem', display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={ocultarDiasVacios}
              onChange={(e) => setOcultarDiasVacios(e.target.checked)}
            />
            Ocultar días sin alumnos
          </label>
          <button className="btn btn-primary" onClick={() => setModalPagoAbierto(true)}>
            + Nuevo pago
          </button>
          <button className="btn btn-primary" onClick={() => setModalAlumnoAbierto(true)}>
            + Nuevo alumno
          </button>
          <button className="btn btn-primary" onClick={abrirNuevo}>
            + Nuevo turno
          </button>
        </div>
      </div>

      {turnos.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="page-title" style={{ marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setMostrarDisponibilidad((v) => !v)}
              aria-label={mostrarDisponibilidad ? 'Ocultar disponibilidad' : 'Mostrar disponibilidad'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
                font: 'inherit',
                color: 'inherit',
              }}
            >
              <span style={{ fontSize: '0.7rem' }}>{mostrarDisponibilidad ? '▼' : '▶'}</span>
              <strong>Disponibilidad</strong>
            </button>
          </div>
          {mostrarDisponibilidad && <DisponibilidadGrid turnos={turnos} />}
        </div>
      )}

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

      {modalPagoAbierto && <NuevoPagoModal onClose={() => setModalPagoAbierto(false)} />}
    </div>
  )
}
