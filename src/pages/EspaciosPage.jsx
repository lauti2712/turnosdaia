import { useState } from 'react'
import { useEspacio } from '../context/EspacioContext'
import { crearEspacio, actualizarEspacio, eliminarEspacio } from '../data/espacios'
import EspacioModal from '../components/EspacioModal'

export default function EspaciosPage() {
  const { espacios, espacioActualId, setEspacioActualId } = useEspacio()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)

  async function handleSave(datos) {
    if (editando) {
      await actualizarEspacio(editando.id, datos)
    } else {
      await crearEspacio(datos)
    }
  }

  function abrirNuevo() {
    setEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(espacio) {
    setEditando(espacio)
    setModalAbierto(true)
  }

  async function handleEliminar(espacio) {
    if (
      confirm(
        `¿Eliminar el espacio "${espacio.nombre}"? Esto no borra sus alumnos ni movimientos, pero dejarían de ser accesibles desde acá.`,
      )
    ) {
      await eliminarEspacio(espacio.id)
    }
  }

  return (
    <div>
      <div className="page-title">
        <h2>Espacios</h2>
        <button className="btn btn-primary" onClick={abrirNuevo}>
          + Nuevo espacio
        </button>
      </div>

      {espacios.length === 0 ? (
        <div className="card">
          <div className="empty-state">No hay espacios creados todavía.</div>
        </div>
      ) : (
        espacios.map((esp) => (
          <div className="card" key={esp.id}>
            <div className="page-title" style={{ marginBottom: 0 }}>
              <div>
                <strong>{esp.nombre}</strong>
                <span className="muted"> · socio: {esp.socioNombre}</span>
                {esp.id === espacioActualId && (
                  <span className="badge badge-success" style={{ marginLeft: 8 }}>
                    Activo
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {esp.id !== espacioActualId && (
                  <button className="btn btn-sm" onClick={() => setEspacioActualId(esp.id)}>
                    Usar este
                  </button>
                )}
                <button className="btn btn-sm" onClick={() => abrirEditar(esp)}>
                  Editar
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(esp)}>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {modalAbierto && (
        <EspacioModal espacio={editando} onSave={handleSave} onClose={() => setModalAbierto(false)} />
      )}
    </div>
  )
}
