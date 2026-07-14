import { useState } from 'react'
import { DIAS, DIAS_LABEL, construirNombreTurno } from '../data/turnos'

const TURNO_VACIO = { actividad: '', horario: '', cupoMaximo: 6, diasActivos: [] }

export default function TurnoModal({ turno, onSave, onClose }) {
  const [form, setForm] = useState(
    turno
      ? { ...TURNO_VACIO, ...turno, diasActivos: turno.diasActivos ? [...turno.diasActivos] : [] }
      : TURNO_VACIO,
  )
  const [guardando, setGuardando] = useState(false)

  function setCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function toggleDia(dia) {
    setForm((f) => ({
      ...f,
      diasActivos: f.diasActivos.includes(dia)
        ? f.diasActivos.filter((d) => d !== dia)
        : [...f.diasActivos, dia],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  const previewNombre = construirNombreTurno(form)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{turno ? 'Editar turno' : 'Nuevo turno'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid" style={{ gap: 10 }}>
            <div className="field">
              <label>Actividad</label>
              <input
                value={form.actividad}
                onChange={(e) => setCampo('actividad', e.target.value)}
                placeholder="Pilates, Yoga..."
                autoFocus
              />
            </div>

            <div className="field">
              <label>Días</label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {DIAS.map((dia) => (
                  <label
                    key={dia}
                    style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: '0.85rem' }}
                  >
                    <input
                      type="checkbox"
                      style={{ width: 'auto' }}
                      checked={form.diasActivos.includes(dia)}
                      onChange={() => toggleDia(dia)}
                    />
                    {DIAS_LABEL[dia]}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Horario</label>
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

            {previewNombre && (
              <div className="muted" style={{ fontSize: '0.8rem' }}>
                Nombre: <strong>{previewNombre}</strong>
              </div>
            )}
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
