import { useEffect, useState } from 'react'
import { subscribeAlumnos } from '../data/alumnos'
import {
  subscribeEliminados,
  restaurar,
  eliminarDefinitivo,
  VENTANA_RESTAURACION_MS,
} from '../data/papelera'
import { useEspacio } from '../context/EspacioContext'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)

const COLECCIONES = [
  { nombre: 'alumnos', label: 'Alumno', tieneEspacio: true },
  { nombre: 'actividades', label: 'Actividad', tieneEspacio: true },
  { nombre: 'turnos', label: 'Turno', tieneEspacio: true },
  { nombre: 'movimientos', label: 'Movimiento', tieneEspacio: true },
  { nombre: 'pagosVivi', label: 'Pago a socio', tieneEspacio: true },
  { nombre: 'espacios', label: 'Espacio', tieneEspacio: false },
]

function tiempoRestante(eliminadoTs) {
  const restanteMs = VENTANA_RESTAURACION_MS - (Date.now() - eliminadoTs)
  const horas = Math.floor(restanteMs / (60 * 60 * 1000))
  const minutos = Math.floor((restanteMs % (60 * 60 * 1000)) / (60 * 1000))
  if (restanteMs <= 0) return 'vencido'
  if (horas > 0) return `${horas}h ${minutos}m`
  return `${minutos}m`
}

function etiquetaFila(coleccion, item, alumnosPorId, socioNombre) {
  switch (coleccion) {
    case 'alumnos':
      return `${item.apellido}, ${item.nombre}`
    case 'actividades':
      return item.nombre
    case 'turnos':
      return item.nombre
    case 'movimientos': {
      const alumno = alumnosPorId[item.alumnoId]
      const quien = alumno ? `${alumno.apellido}, ${alumno.nombre}` : '(alumno no disponible)'
      const tipo = item.tipo === 'pago' ? 'Pago' : 'Ajuste'
      return `${tipo} de ${fmtMoney(item.monto)} — ${quien}`
    }
    case 'pagosVivi':
      return `Pago a ${socioNombre}: ${fmtMoney(item.monto)}`
    case 'espacios':
      return item.nombre
    default:
      return item.id
  }
}

export default function PapeleraPage() {
  const { espacioActualId, espacioActual } = useEspacio()
  const socioNombre = espacioActual?.socioNombre || 'el socio'
  const [alumnos, setAlumnos] = useState([])
  const [eliminadosPorColeccion, setEliminadosPorColeccion] = useState({})

  useEffect(() => subscribeAlumnos(setAlumnos), [])

  useEffect(() => {
    const unsubs = COLECCIONES.map(({ nombre }) =>
      subscribeEliminados(nombre, (items) => {
        setEliminadosPorColeccion((prev) => ({ ...prev, [nombre]: items }))
      }),
    )
    return () => unsubs.forEach((u) => u())
  }, [])

  const alumnosPorId = Object.fromEntries(alumnos.map((a) => [a.id, a]))

  // Purga automática: lo que ya superó la ventana de restauración se borra
  // definitivamente, así no queda ocupando espacio para siempre.
  useEffect(() => {
    for (const { nombre } of COLECCIONES) {
      for (const item of eliminadosPorColeccion[nombre] || []) {
        if (Date.now() - item.eliminadoTs >= VENTANA_RESTAURACION_MS) {
          eliminarDefinitivo(nombre, item.id)
        }
      }
    }
  }, [eliminadosPorColeccion])

  const filas = COLECCIONES.flatMap(({ nombre, label, tieneEspacio }) =>
    (eliminadosPorColeccion[nombre] || [])
      .filter((item) => !tieneEspacio || item.espacioId === espacioActualId)
      .filter((item) => Date.now() - item.eliminadoTs < VENTANA_RESTAURACION_MS)
      .map((item) => ({
        id: `${nombre}-${item.id}`,
        coleccion: nombre,
        label,
        detalle: etiquetaFila(nombre, item, alumnosPorId, socioNombre),
        eliminadoTs: item.eliminadoTs,
        onRestaurar: () => restaurar(nombre, item.id),
      })),
  ).sort((a, b) => b.eliminadoTs - a.eliminadoTs)

  return (
    <div>
      <div className="page-title">
        <h2>Papelera</h2>
      </div>
      <p className="muted" style={{ fontSize: '0.85rem' }}>
        Lo que borrás queda acá por 6 horas por si hace falta recuperarlo. Pasado ese tiempo se
        elimina en forma definitiva.
      </p>

      {filas.length === 0 ? (
        <div className="card">
          <div className="empty-state">No hay nada en la papelera.</div>
        </div>
      ) : (
        <div className="card">
          <div className="scroll-x">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Detalle</th>
                  <th>Tiempo restante</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <span className="badge badge-warning">{f.label}</span>
                    </td>
                    <td>{f.detalle}</td>
                    <td className="muted">{tiempoRestante(f.eliminadoTs)}</td>
                    <td>
                      <button className="btn btn-sm" onClick={f.onRestaurar}>
                        Restaurar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
