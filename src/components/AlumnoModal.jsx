import { useState } from 'react'
import { montoMensualEfectivo, mesActualId } from '../data/actividades'
import { tarifaVigente, tarifasIguales, conNuevaTarifa } from '../data/alumnos'
import { DIAS_LABEL, turnosActualesDeAlumno } from '../data/turnos'

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0)

const ALUMNO_VACIO = {
  nombre: '',
  apellido: '',
  actividadId: '',
  precioManual: '',
  fechaInicio: new Date().toISOString().slice(0, 10),
  extra: [],
}

const BLOQUE_VACIO = { turnoId: '', dias: [] }

function librasEnDia(turno, dia, alumnoId) {
  const ocupados = (turno.dias?.[dia] || []).filter((id) => id !== alumnoId).length
  return Math.max((turno.cupoMaximo || 0) - ocupados, 0)
}

export default function AlumnoModal({
  alumno,
  actividades,
  turnos = [],
  onSave,
  onClose,
  onVerCtaCte,
  onArchivarClick,
}) {
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
  // Si el alumno ya tiene el campo `turnos` (se editó alguna vez desde esta
  // ficha), se usa tal cual. Si no, se reconstruye desde turno.dias real —
  // cubre alumnos viejos asignados a mano desde la grilla de Turnos, para no
  // perder ni duplicar su asignación real al guardar por primera vez acá.
  const turnosIniciales = alumno?.turnos?.length
    ? alumno.turnos.map((t) => ({ ...t, dias: [...t.dias] }))
    : alumno
      ? turnosActualesDeAlumno(alumno.id, turnos)
      : []
  const [turnosSel, setTurnosSel] = useState(
    turnosIniciales.length ? turnosIniciales : [{ ...BLOQUE_VACIO }],
  )
  const [multiTurno, setMultiTurno] = useState(alumno?.multiTurno ?? turnosIniciales.length > 1)
  const [usarPrecioManual, setUsarPrecioManual] = useState(alumno?.precioManual != null)
  const [guardando, setGuardando] = useState(false)
  const [mesVigencia, setMesVigencia] = useState(mesActualId())

  function setCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function cambiarActividad(actividadId) {
    setForm((f) => ({ ...f, actividadId }))
    setTurnosSel([{ ...BLOQUE_VACIO }])
    setMultiTurno(false)
  }

  const turnosDeActividad = turnos.filter((t) => t.actividadId === form.actividadId)

  function turnosDisponiblesPara(indice) {
    const elegidosEnOtrosBloques = new Set(
      turnosSel.filter((_, i) => i !== indice).map((t) => t.turnoId),
    )
    return turnosDeActividad.filter((t) => !elegidosEnOtrosBloques.has(t.id))
  }

  function elegirTurno(indice, turnoId) {
    const turno = turnos.find((t) => t.id === turnoId)
    setTurnosSel((bloques) =>
      bloques.map((b, i) => (i === indice ? { turnoId, dias: turno ? [...turno.diasActivos] : [] } : b)),
    )
  }

  function toggleDia(indice, dia) {
    setTurnosSel((bloques) =>
      bloques.map((b, i) =>
        i === indice
          ? { ...b, dias: b.dias.includes(dia) ? b.dias.filter((d) => d !== dia) : [...b.dias, dia] }
          : b,
      ),
    )
  }

  function agregarBloque() {
    setTurnosSel((bloques) => [...bloques, { ...BLOQUE_VACIO }])
  }

  function quitarBloque(indice) {
    setTurnosSel((bloques) => bloques.filter((_, i) => i !== indice))
  }

  function toggleMultiTurno(activar) {
    setMultiTurno(activar)
    if (!activar) setTurnosSel((bloques) => bloques.slice(0, 1))
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

  const totalDias = turnosSel.reduce((acc, t) => acc + t.dias.length, 0)
  const precioManualFinal = usarPrecioManual ? form.precioManual : ''

  const precioCalculado = montoMensualEfectivo(
    { actividadId: form.actividadId, diasPorSemana: totalDias, precioManual: null },
    actividades,
  )

  // Si esto es una edición y lo que se está por guardar (actividad, días o
  // precio manual) difiere de la tarifa vigente hoy, hace falta saber desde
  // cuándo rige el cambio para no reescribir la cuenta corriente ya
  // devengada — se pide el mes recién en ese caso.
  const tarifaNueva = {
    actividadId: form.actividadId || null,
    diasPorSemana: totalDias,
    precioManual: precioManualFinal === '' || precioManualFinal == null ? null : Number(precioManualFinal),
  }
  const cambioTarifa = !!alumno && !tarifasIguales(tarifaVigente(alumno, mesActualId()), tarifaNueva)

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      const historialTarifas = cambioTarifa
        ? conNuevaTarifa(alumno, tarifaNueva, mesVigencia)
        : alumno?.historialTarifas || []
      await onSave({
        ...form,
        diasPorSemana: totalDias,
        turnos: turnosSel.filter((t) => t.turnoId && t.dias.length > 0),
        multiTurno,
        precioManual: precioManualFinal,
        extra: form.extra.filter((x) => x.clave.trim()),
        historialTarifas,
      })
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {alumno ? 'Editar alumno' : 'Nuevo alumno'}
          {alumno && onVerCtaCte && (
            <button type="button" className="btn btn-sm" onClick={onVerCtaCte}>
              Ver cuenta corriente
            </button>
          )}
          {alumno && onArchivarClick && (
            <button type="button" className="btn btn-sm" onClick={() => onArchivarClick(alumno)}>
              {alumno.activo === false ? 'Reactivar' : 'Dar de baja'}
            </button>
          )}
        </h3>
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

            <div className="field">
              <label>Actividad</label>
              <select value={form.actividadId} onChange={(e) => cambiarActividad(e.target.value)}>
                <option value="">Sin asignar</option>
                {actividades.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.nombre}
                  </option>
                ))}
              </select>
            </div>

            {form.actividadId && (
              <div className="field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ marginBottom: 0 }}>Turno</label>
                  <label
                    className="muted"
                    style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.78rem' }}
                  >
                    <input
                      type="checkbox"
                      style={{ width: 'auto' }}
                      checked={multiTurno}
                      onChange={(e) => toggleMultiTurno(e.target.checked)}
                    />
                    Va a más de un turno
                  </label>
                </div>

                {turnosDeActividad.length === 0 ? (
                  <div className="muted" style={{ fontSize: '0.82rem' }}>
                    No hay turnos creados todavía para esta actividad.
                  </div>
                ) : (
                  turnosSel.map((bloque, i) => {
                    const turno = turnos.find((t) => t.id === bloque.turnoId)
                    return (
                      <div
                        key={i}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: 10,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <select
                            value={bloque.turnoId}
                            onChange={(e) => elegirTurno(i, e.target.value)}
                            style={{ flex: 1 }}
                          >
                            <option value="">Elegir turno...</option>
                            {turnosDisponiblesPara(i).map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.nombre}
                              </option>
                            ))}
                          </select>
                          {multiTurno && turnosSel.length > 1 && (
                            <button
                              type="button"
                              className="icon-btn"
                              aria-label="Quitar turno"
                              onClick={() => quitarBloque(i)}
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {turno && (
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                            {turno.diasActivos.map((dia) => (
                              <label
                                key={dia}
                                style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: '0.82rem' }}
                              >
                                <input
                                  type="checkbox"
                                  style={{ width: 'auto' }}
                                  checked={bloque.dias.includes(dia)}
                                  onChange={() => toggleDia(i, dia)}
                                />
                                {DIAS_LABEL[dia]}
                                <span className="muted">
                                  {' '}
                                  ({librasEnDia(turno, dia, alumno?.id)} libres)
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}

                {multiTurno && turnosDeActividad.length > turnosSel.length && (
                  <button type="button" className="btn btn-sm" onClick={agregarBloque}>
                    + Agregar otro turno
                  </button>
                )}

                <div className="muted" style={{ fontSize: '0.8rem', marginTop: 6 }}>
                  Total: {totalDias} {totalDias === 1 ? 'día' : 'días'}/semana
                </div>
              </div>
            )}

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
                    Según la tabla de precios de la actividad y los días elegidos arriba.
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

            {cambioTarifa && (
              <div
                className="field"
                style={{ background: 'var(--warning-bg)', padding: 10, borderRadius: 8 }}
              >
                <label style={{ fontSize: '0.82rem' }}>Este cambio afecta la tarifa — ¿desde cuándo rige?</label>
                <input
                  type="month"
                  value={mesVigencia}
                  onChange={(e) => setMesVigencia(e.target.value)}
                  required
                />
                <div className="muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                  Los meses anteriores a ese mes van a seguir calculándose con la tarifa anterior.
                </div>
              </div>
            )}

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
