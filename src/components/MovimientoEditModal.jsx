import { useState } from 'react'

// tipo: 'pago' | 'ajuste' | 'pagoSocio' — determina qué campos mostrar.
export default function MovimientoEditModal({ movimiento, tipo, socioNombre, onSave, onClose }) {
  const [monto, setMonto] = useState(movimiento.monto)
  const [fecha, setFecha] = useState(movimiento.fecha)
  const [formaPago, setFormaPago] = useState(movimiento.formaPago || '')
  const [descripcion, setDescripcion] = useState(movimiento.descripcion || '')
  const [abonadoAVivi, setAbonadoAVivi] = useState(!!movimiento.abonadoAVivi)
  const [guardando, setGuardando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      const datos = { monto, fecha, descripcion }
      if (tipo === 'pago') {
        datos.formaPago = formaPago
        datos.abonadoAVivi = abonadoAVivi
      }
      await onSave(datos)
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  const titulo = tipo === 'pago' ? 'Editar pago' : tipo === 'ajuste' ? 'Editar ajuste' : `Editar pago a ${socioNombre}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label>Monto {tipo === 'ajuste' && '(+ suma deuda, − la resta)'}</label>
              <input
                type="number"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="field">
              <label>Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            {tipo === 'pago' && (
              <div className="field">
                <label>Forma de pago</label>
                <input
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value)}
                  placeholder="Efectivo, transferencia..."
                />
              </div>
            )}
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>Descripción {tipo === 'ajuste' && '(motivo)'}</label>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          {tipo === 'pago' && (
            <label
              className="muted"
              style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.85rem', marginTop: 10 }}
            >
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={abonadoAVivi}
                onChange={(e) => setAbonadoAVivi(e.target.checked)}
              />
              Abonado a {socioNombre} (lo cobró directamente)
            </label>
          )}

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
