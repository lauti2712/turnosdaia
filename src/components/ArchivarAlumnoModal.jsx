import { useState } from 'react'

const hoy = () => new Date().toISOString().slice(0, 10)

export default function ArchivarAlumnoModal({ alumno, onConfirmar, onClose }) {
  const [fechaBaja, setFechaBaja] = useState(hoy())
  const [guardando, setGuardando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      await onConfirmar(fechaBaja)
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Dar de baja a {alumno.apellido}, {alumno.nombre}</h3>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Fecha de baja</label>
            <input
              type="date"
              value={fechaBaja}
              onChange={(e) => setFechaBaja(e.target.value)}
              autoFocus
              required
            />
            <div className="muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
              A partir de ese mes la cuenta corriente deja de generar deuda nueva.
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              Dar de baja
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
