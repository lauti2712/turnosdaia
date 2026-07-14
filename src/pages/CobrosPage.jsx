import { useEffect, useState } from 'react'
import { subscribeAlumnos } from '../data/alumnos'
import { subscribeTodosMovimientos, calcularSaldo } from '../data/movimientos'
import CtaCteDetalle from '../components/CtaCteDetalle'
import NuevoPagoModal from '../components/NuevoPagoModal'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0)

export default function CobrosPage() {
  const [alumnos, setAlumnos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [seleccionadoId, setSeleccionadoId] = useState(null)
  const [soloDeudores, setSoloDeudores] = useState(false)
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false)

  useEffect(() => subscribeAlumnos(setAlumnos), [])
  useEffect(() => subscribeTodosMovimientos(setMovimientos), [])

  const activos = alumnos.filter((a) => a.activo !== false)

  const filas = activos
    .map((a) => {
      const movsAlumno = movimientos.filter((m) => m.alumnoId === a.id)
      return { alumno: a, saldo: calcularSaldo(a, movsAlumno) }
    })
    .filter((f) => !soloDeudores || f.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo)

  const seleccionado = activos.find((a) => a.id === seleccionadoId)

  return (
    <div>
      <div className="page-title">
        <h2>Cobros</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="muted" style={{ fontSize: '0.85rem', display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={soloDeudores}
              onChange={(e) => setSoloDeudores(e.target.checked)}
            />
            Mostrar solo alumnos que deben
          </label>
          <button className="btn btn-primary" onClick={() => setModalPagoAbierto(true)}>
            + Nuevo pago
          </button>
        </div>
      </div>

      <div className="card">
        {filas.length === 0 ? (
          <div className="empty-state">No hay alumnos para mostrar.</div>
        ) : (
          <div className="scroll-x">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Saldo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ alumno, saldo }) => (
                <tr key={alumno.id}>
                  <td>
                    {alumno.apellido}, {alumno.nombre}
                  </td>
                  <td>
                    <span className={`badge ${saldo > 0 ? 'badge-danger' : 'badge-success'}`}>
                      {fmtMoney(saldo)}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm" onClick={() => setSeleccionadoId(alumno.id)}>
                      Ver cuenta
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {seleccionado && (
        <div style={{ marginTop: 16 }}>
          <CtaCteDetalle alumno={seleccionado} />
        </div>
      )}

      {modalPagoAbierto && <NuevoPagoModal onClose={() => setModalPagoAbierto(false)} />}
    </div>
  )
}
