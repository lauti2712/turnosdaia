import { useState } from 'react'

const TURNO_VACIO = { nombre: '', horario: '', cupoMaximo: 6 }

export default function TurnoModal({ turno, onSave, onClose }) {
  const [form, setForm] = useState(turno ? { ...TURNO_VACIO, ...turno } : TURNO_VACIO)
  const [guardando, setGuardando] = useState(false)

  function setCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setGuardando(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{turno ? 'Editar turno' : 'Nuevo turno'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid" style={{ gap: 10 }}>
            <div className="field">
              <label>Nombre del turno</label>
              <input
                value={form.nombre}
                onChange={(e) => setCampo('nombre', e.target.value)}
                placeholder="Ej: Mañana 9hs"
                autoFocus
                required
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Horario (opcional)</label>
                <input
                  value={form.horario}
                  onChange={(e) => setCampo('horario', e.target.value)}
                  placeholder="09:00 - 10:00"
                />
              </div>
              <div className="field">
                <label>Cupo máximo</label>
                <input
                  type="number"
                  min="1"
                  value={form.cupoMaximo}
                  onChange={(e) => setCampo('cupoMaximo', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
