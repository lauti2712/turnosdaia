import { useState } from 'react'

const ALUMNO_VACIO = {
  nombre: '',
  apellido: '',
  diasPorSemana: 1,
  montoMensual: '',
  fechaInicio: new Date().toISOString().slice(0, 10),
  extra: [],
}

export default function AlumnoModal({ alumno, onSave, onClose }) {
  const [form, setForm] = useState(
    alumno
      ? { ...ALUMNO_VACIO, ...alumno, extra: alumno.extra ? [...alumno.extra] : [] }
      : ALUMNO_VACIO,
  )
  const [guardando, setGuardando] = useState(false)

  function setCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function setExtra(i, key, value) {
    setForm((f) => {
      const extra = [...f.extra]
      extra[i] = { ...extra[i], [key]: value }
      return { ...f, extra }
    })
  }

  function agregarExtra() {
    setForm((f) => ({ ...f, extra: [...f.extra, { clave: '', valor: '' }] }))
  }

  function quitarExtra(i) {
    setForm((f) => ({ ...f, extra: f.extra.filter((_, idx) => idx !== i) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.apellido.trim()) return
    setGuardando(true)
    try {
      await onSave({
        ...form,
        extra: form.extra.filter((x) => x.clave.trim()),
      })
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{alumno ? 'Editar alumno' : 'Nuevo alumno'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid" style={{ gap: 10 }}>
            <div className="form-row">
              <div className="field">
                <label>Nombre</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setCampo('nombre', e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="field">
                <label>Apellido</label>
                <input
                  value={form.apellido}
                  onChange={(e) => setCampo('apellido', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Días por semana</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={form.diasPorSemana}
                  onChange={(e) => setCampo('diasPorSemana', e.target.value)}
                />
              </div>
              <div className="field">
                <label>Monto mensual</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.montoMensual}
                  onChange={(e) => setCampo('montoMensual', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label>Fecha de inicio</label>
              <input
                type="date"
                value={form.fechaInicio}
                onChange={(e) => setCampo('fechaInicio', e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Campos adicionales</label>
              {form.extra.map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input
                    placeholder="Nombre del campo"
                    value={x.clave}
                    onChange={(e) => setExtra(i, 'clave', e.target.value)}
                  />
                  <input
                    placeholder="Valor"
                    value={x.valor}
                    onChange={(e) => setExtra(i, 'valor', e.target.value)}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => quitarExtra(i)}
                    aria-label="Quitar campo"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-sm" onClick={agregarExtra}>
                + Agregar campo
              </button>
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
