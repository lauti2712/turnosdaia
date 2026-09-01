import { useState } from 'react'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function etiquetaMes(mesId) {
  const [anio, mes] = mesId.split('-').map(Number)
  return `${MESES[mes - 1]} ${anio}`
}

export default function BonificacionEditModal({ bonificacion, onSave, onClose }) {
  const [tipo, setTipo] = useState(bonificacion.tipo || 'porcentaje')
  const [valor, setValor] = useState(bonificacion.valor ?? 100)
  const [motivo, setMotivo] = useState(bonificacion.motivo || '')
  const [guardando, setGuardando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      await onSave({ tipo, valor: Number(valor) || 0, motivo })
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Editar bonificación de {etiquetaMes(bonificacion.mes)}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label>Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="porcentaje">% del mes</option>
                <option value="monto">Monto fijo</option>
              </select>
            </div>
            <div className="field">
              <label>{tipo === 'porcentaje' ? 'Porcentaje' : 'Monto'}</label>
              <input
                type="number"
                min="0"
                max={tipo === 'porcentaje' ? 100 : undefined}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>Motivo</label>
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
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
