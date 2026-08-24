import { useState } from 'react'

const ESPACIO_VACIO = { nombre: '', socioNombre: '', modoCobroSocio: 'porActividad', montoFijoSocio: '' }

export default function EspacioModal({ espacio, onSave, onClose }) {
  const [form, setForm] = useState(
    espacio
      ? {
          ...ESPACIO_VACIO,
          ...espacio,
          modoCobroSocio: espacio.modoCobroSocio || 'porActividad',
          montoFijoSocio: espacio.montoFijoSocio ?? '',
        }
      : ESPACIO_VACIO,
  )
  const [guardando, setGuardando] = useState(false)

  function setCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
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
        <h3>{espacio ? 'Editar espacio' : 'Nuevo espacio'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid" style={{ gap: 10 }}>
            <div className="field">
              <label>Nombre del espacio</label>
              <input
                value={form.nombre}
                onChange={(e) => setCampo('nombre', e.target.value)}
                placeholder="Pilates y Yoga, Centro Cultural..."
                autoFocus
                required
              />
            </div>
            <div className="field">
              <label>Cobro del socio</label>
              <select
                value={form.modoCobroSocio}
                onChange={(e) => setCampo('modoCobroSocio', e.target.value)}
              >
                <option value="porActividad">Por actividad (% definido en cada actividad)</option>
                <option value="montoFijo">Monto fijo</option>
                <option value="ninguno">No cobra</option>
              </select>
            </div>

            {form.modoCobroSocio !== 'ninguno' && (
              <div className="field">
                <label>Nombre del socio/dueño</label>
                <input
                  value={form.socioNombre}
                  onChange={(e) => setCampo('socioNombre', e.target.value)}
                  placeholder="Vivi..."
                  required
                />
              </div>
            )}

            {form.modoCobroSocio === 'montoFijo' && (
              <div className="field">
                <label>Monto fijo</label>
                <input
                  type="number"
                  min="0"
                  value={form.montoFijoSocio}
                  onChange={(e) => setCampo('montoFijoSocio', e.target.value)}
                  placeholder="Monto que cobra el socio, sin relación a lo cobrado a las alumnas"
                  required
                />
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
