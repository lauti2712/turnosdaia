import { useState } from 'react'
import { DIAS_PRECIO } from '../data/actividades'

const ACTIVIDAD_VACIA = { nombre: '', porcentajeVivi: 50, precios: {} }

export default function ActividadModal({ actividad, onSave, onClose }) {
  const [form, setForm] = useState(
    actividad
      ? { ...ACTIVIDAD_VACIA, ...actividad, precios: { ...actividad.precios } }
      : ACTIVIDAD_VACIA,
  )
  const [guardando, setGuardando] = useState(false)

  function setCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function setPrecio(dia, valor) {
    setForm((f) => ({ ...f, precios: { ...f.precios, [dia]: valor } }))
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{actividad ? 'Editar actividad' : 'Nueva actividad'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid" style={{ gap: 10 }}>
            <div className="form-row">
              <div className="field">
                <label>Nombre</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setCampo('nombre', e.target.value)}
                  placeholder="Pilates, Yoga..."
                  autoFocus
                  required
                />
              </div>
              <div className="field">
                <label>% para Vivi</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.porcentajeVivi}
                  onChange={(e) => setCampo('porcentajeVivi', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>Precio mensual según días por semana (dejar vacío el que no aplique)</label>
              <div className="form-row">
                {DIAS_PRECIO.map((dia) => (
                  <div className="field" key={dia}>
                    <label className="muted" style={{ fontSize: '0.75rem' }}>
                      {dia} {dia === 1 ? 'día' : 'días'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.precios?.[dia] ?? ''}
                      onChange={(e) => setPrecio(dia, e.target.value)}
                    />
                  </div>
                ))}
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
