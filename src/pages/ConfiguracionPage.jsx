import { useEffect, useState } from 'react'
import {
  subscribeFormasPago,
  crearFormaPago,
  actualizarFormaPago,
  eliminarFormaPago,
} from '../data/formasPago'
import { useEspacio } from '../context/EspacioContext'

export default function ConfiguracionPage() {
  const { espacioActualId } = useEspacio()
  const [formasPagoTodas, setFormasPagoTodas] = useState([])
  const [nombreNueva, setNombreNueva] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [nombreEditado, setNombreEditado] = useState('')

  useEffect(() => subscribeFormasPago(setFormasPagoTodas), [])

  const formasPago = formasPagoTodas.filter((f) => f.espacioId === espacioActualId)

  async function handleAgregar(e) {
    e.preventDefault()
    if (!nombreNueva.trim()) return
    await crearFormaPago({ espacioId: espacioActualId, nombre: nombreNueva.trim() })
    setNombreNueva('')
  }

  function abrirEditar(f) {
    setEditandoId(f.id)
    setNombreEditado(f.nombre)
  }

  async function guardarEdicion(id) {
    if (nombreEditado.trim()) {
      await actualizarFormaPago(id, { nombre: nombreEditado.trim() })
    }
    setEditandoId(null)
  }

  return (
    <div>
      <div className="page-title">
        <h2>Configuración</h2>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Formas de pago</h3>
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Se eligen desde una lista al registrar un cobro (Efectivo, Transferencia...).
        </p>

        {formasPago.length === 0 ? (
          <div className="empty-state">Todavía no hay formas de pago creadas.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {formasPago.map((f) => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '6px 10px',
                }}
              >
                {editandoId === f.id ? (
                  <>
                    <input
                      value={nombreEditado}
                      onChange={(e) => setNombreEditado(e.target.value)}
                      autoFocus
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-sm" onClick={() => guardarEdicion(f.id)}>
                      Guardar
                    </button>
                    <button className="btn btn-sm" onClick={() => setEditandoId(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1 }}>{f.nombre}</span>
                    <button className="btn btn-sm" onClick={() => abrirEditar(f)}>
                      Editar
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => eliminarFormaPago(f.id)}>
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAgregar} style={{ display: 'flex', gap: 8 }}>
          <input
            value={nombreNueva}
            onChange={(e) => setNombreNueva(e.target.value)}
            placeholder="Nombre de la forma de pago..."
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            + Agregar
          </button>
        </form>
      </div>
    </div>
  )
}
