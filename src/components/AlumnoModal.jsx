import { useState } from 'react'
import { montoMensualEfectivo } from '../data/actividades'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)

const ALUMNO_VACIO = {
  nombre: '',
  apellido: '',
  diasPorSemana: 2,
  actividadId: '',
  precioManual: '',
  fechaInicio: new Date().toISOString().slice(0, 10),
  extra: [],
}

export default function AlumnoModal({ alumno, actividades, onSave, onClose }) {
  const [form, setForm] = useState(
    alumno
      ? {
          ...ALUMNO_VACIO,
          ...alumno,
          actividadId: alumno.actividadId || '',
          precioManual: alumno.precioManual ?? '',
          extra: alumno.extra ? [...alumno.extra] : [],
        }
      : ALUMNO_VACIO,
  )
  const [usarPrecioManual, setUsarPrecioManual] = useState(alumno?.precioManual != null)
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

  const precioCalculado = montoMensualEfectivo(
    { actividadId: form.actividadId, diasPorSemana: form.diasPorSemana, precioManual: null },
    actividades,
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      await onSave({
        ...form,
        precioManual: usarPrecioManual ? form.precioManual : '',
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
                />
              </div>
              <div className="field">
                <label>Apellido</label>
                <input
                  value={form.apellido}
                  onChange={(e) => setCampo('apellido', e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Actividad</label>
                <select
                  value={form.actividadId}
                  onChange={(e) => setCampo('actividadId', e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {actividades.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.nombre}
                    </option>
                  ))}
                </select>
              </div>
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
            </div>

            <div className="field">
              <label>Precio mensual</label>
              {!usarPrecioManual ? (
                <div
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}
                >
                  <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    {fmtMoney(precioCalculado)}
                  </div>
                  <div className="muted" style={{ fontSize: '0.75rem' }}>
                    Según la tabla de precios de la actividad. Cambia sola si se actualiza la
                    tarifa.
                  </div>
                </div>
              ) : (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precioManual}
                  onChange={(e) => setCampo('precioManual', e.target.value)}
                />
              )}
              <label
                className="muted"
                style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.82rem', marginTop: 6 }}
              >
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={usarPrecioManual}
                  onChange={(e) => setUsarPrecioManual(e.target.checked)}
                />
                Usar un monto manual distinto (beca, descuento, arreglo especial)
              </label>
            </div>

            <div className="field">
              <label>Fecha de inicio</label>
              <input
                type="date"
                value={form.fechaInicio}
                onChange={(e) => setCampo('fechaInicio', e.target.value)}
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
