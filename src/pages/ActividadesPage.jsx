import { useEffect, useState } from 'react'
import {
  subscribeActividades,
  crearActividad,
  actualizarActividad,
  eliminarActividad,
  precioVigente,
  mesActualId,
  DIAS_PRECIO,
} from '../data/actividades'
import ActividadModal from '../components/ActividadModal'
import { useEspacio } from '../context/EspacioContext'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)

export default function ActividadesPage() {
  const { espacioActualId, espacioActual } = useEspacio()
  const socioNombre = espacioActual?.socioNombre || 'el socio'
  const [actividadesTodas, setActividadesTodas] = useState([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)

  useEffect(() => subscribeActividades(setActividadesTodas), [])

  const actividades = actividadesTodas.filter((a) => a.espacioId === espacioActualId)

  async function handleSave(datos) {
    if (editando) {
      await actualizarActividad(editando.id, datos, editando.historialPrecios)
    } else {
      await crearActividad({ ...datos, espacioId: espacioActualId })
    }
  }

  function abrirNueva() {
    setEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(actividad) {
    setEditando(actividad)
    setModalAbierto(true)
  }

  async function handleEliminar(actividad) {
    if (
      confirm(
        `¿Eliminar la actividad "${actividad.nombre}"? Las alumnas que la tengan asignada quedarían sin precio automático.`,
      )
    ) {
      await eliminarActividad(actividad.id)
    }
  }

  return (
    <div>
      <div className="page-title">
        <h2>Actividades</h2>
        <button className="btn btn-primary" onClick={abrirNueva}>
          + Nueva actividad
        </button>
      </div>

      {actividades.length === 0 ? (
        <div className="card">
          <div className="empty-state">No hay actividades creadas todavía.</div>
        </div>
      ) : (
        actividades.map((act) => {
          const precios = precioVigente(act, mesActualId())
          const diasConPrecio = DIAS_PRECIO.filter((d) => precios?.[d] != null)
          return (
            <div className="card" key={act.id}>
              <div className="page-title" style={{ marginBottom: 10 }}>
                <div>
                  <strong>{act.nombre}</strong>
                  <span className="muted"> · {act.porcentajeVivi}% para {socioNombre}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-sm" onClick={() => abrirEditar(act)}>
                    Editar
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(act)}>
                    Eliminar
                  </button>
                </div>
              </div>

              {diasConPrecio.length === 0 ? (
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  Todavía no tiene precios cargados.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {diasConPrecio.map((dia) => (
                    <div key={dia}>
                      <div className="muted" style={{ fontSize: '0.75rem' }}>
                        {dia} {dia === 1 ? 'día' : 'días'}/semana
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                        {fmtMoney(precios[dia])}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}

      {modalAbierto && (
        <ActividadModal actividad={editando} onSave={handleSave} onClose={() => setModalAbierto(false)} />
      )}
    </div>
  )
}
