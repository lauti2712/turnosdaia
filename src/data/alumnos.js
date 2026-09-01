import { collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { marcarEliminado } from './papelera'

const alumnosRef = collection(db, 'alumnos')

export function subscribeAlumnos(callback) {
  const q = query(alumnosRef, orderBy('apellido'))
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => !a.eliminadoTs)
        // orderBy('apellido') de Firestore no ordena por nombre dentro de un
        // mismo apellido, ni maneja bien tildes/mayúsculas — se reordena acá
        // con localeCompare para un alfabético real.
        .sort((a, b) =>
          `${a.apellido}, ${a.nombre}`.localeCompare(`${b.apellido}, ${b.nombre}`, 'es'),
        ),
    )
  })
}

function normalizarAlumno({
  nombre,
  apellido,
  diasPorSemana,
  actividadId,
  precioManual,
  fechaInicio,
  extra,
  turnos,
  multiTurno,
  historialTarifas,
}) {
  return {
    nombre,
    apellido,
    diasPorSemana: Number(diasPorSemana) || 0,
    actividadId: actividadId || null,
    precioManual: precioManual === '' || precioManual == null ? null : Number(precioManual),
    fechaInicio,
    extra: extra || [],
    turnos: turnos || [],
    multiTurno: !!multiTurno,
    historialTarifas: historialTarifas || [],
  }
}

// Fecha centinela para la primera versión de tarifa de un alumno, cuando se
// arma el historial por primera vez — cubre "desde siempre" sin necesitar
// saber la fecha real del cambio anterior.
export const DESDE_INICIAL = '2000-01'

function normPrecioManual(v) {
  return v === '' || v == null ? null : Number(v)
}

export function tarifasIguales(a, b) {
  return (
    (a.actividadId || null) === (b.actividadId || null) &&
    Number(a.diasPorSemana || 0) === Number(b.diasPorSemana || 0) &&
    normPrecioManual(a.precioManual) === normPrecioManual(b.precioManual)
  )
}

// Tarifa (actividad + días + precio manual) vigente para un alumno en un mes
// dado. Si nunca tuvo un cambio registrado, usa sus campos actuales — así
// los alumnos existentes siguen funcionando igual que siempre hasta que se
// les carga el primer cambio de tarifa.
export function tarifaVigente(alumno, mesId) {
  const historial = alumno.historialTarifas || []
  const validas = historial.filter((h) => h.desde <= mesId).sort((a, b) => a.desde.localeCompare(b.desde))
  if (validas.length === 0) {
    // ?? null/0 en vez de leer el campo tal cual: Firestore no acepta
    // `undefined` en un documento, y alumnos viejos pueden no tener alguno
    // de estos campos seteado todavía.
    return {
      actividadId: alumno.actividadId ?? null,
      diasPorSemana: alumno.diasPorSemana ?? 0,
      precioManual: alumno.precioManual ?? null,
    }
  }
  return validas[validas.length - 1]
}

// Arma el historial actualizado al registrar un cambio de tarifa. Si es el
// primer cambio de este alumno, primero sella cómo fue la tarifa desde
// siempre (con sus campos actuales) para no perder esa referencia, y recién
// después agrega/reemplaza la versión desde el mes elegido.
export function conNuevaTarifa(alumno, tarifaNueva, mesDesde) {
  const base = alumno.historialTarifas?.length
    ? [...alumno.historialTarifas]
    : [{ desde: DESDE_INICIAL, ...tarifaVigente(alumno, DESDE_INICIAL) }]
  const idx = base.findIndex((h) => h.desde === mesDesde)
  if (idx >= 0) {
    base[idx] = { desde: mesDesde, ...tarifaNueva }
  } else {
    base.push({ desde: mesDesde, ...tarifaNueva })
  }
  return base
}

export function crearAlumno({ espacioId, ...datos }) {
  return addDoc(alumnosRef, {
    espacioId,
    ...normalizarAlumno(datos),
    activo: true,
    creadoTs: Date.now(),
  })
}

export function actualizarAlumno(id, datos) {
  return updateDoc(doc(db, 'alumnos', id), normalizarAlumno(datos))
}

// Al dar de baja (activo:false) se guarda desde cuándo, para que la cuenta
// corriente deje de generar deuda a partir de ese mes, y se limpia el campo
// `turnos` (la baja de turno.dias en sí la hace sincronizarAsignaciones, en
// el llamador, que tiene el estado real de turnos a mano). Al reactivar se
// borra la fecha así vuelve a devengar con normalidad — pero no se reasigna
// ningún turno solo, hay que hacerlo a mano.
export function archivarAlumno(id, activo, fechaBaja) {
  return updateDoc(doc(db, 'alumnos', id), {
    activo,
    fechaBaja: activo ? null : fechaBaja || null,
    ...(activo ? {} : { turnos: [] }),
  })
}

// Bonifica un mes (ej. no asistió, o empezó a medio mes): reduce el cargo de
// ese mes por un % o un monto fijo, según bonificacion.tipo — deudaGenerada()
// aplica el descuento en vez de cobrar el mes completo. Si ya había una
// bonificación cargada para ese mes, la reemplaza (permite corregirla).
export function bonificarMes(id, bonificacion, bonificacionesActuales = []) {
  const otras = bonificacionesActuales.filter((b) => b.mes !== bonificacion.mes)
  return updateDoc(doc(db, 'alumnos', id), {
    bonificaciones: [...otras, bonificacion],
  })
}

export function quitarBonificacion(id, mes, bonificacionesActuales = []) {
  return updateDoc(doc(db, 'alumnos', id), {
    bonificaciones: bonificacionesActuales.filter((b) => b.mes !== mes),
  })
}

// Bonificaciones y cambios de tarifa no son "movimientos" (no están en la
// colección `movimientos`, son arrays del propio alumno) — se arman acá como
// filas sintéticas para poder mostrarlos mezclados cronológicamente con los
// pagos/ajustes reales, tanto en la cuenta corriente de cada alumno como en
// el historial general de Cobros.
export function eventosBonificacionYTarifa(alumno) {
  const bonificaciones = (alumno.bonificaciones || []).map((b) => ({
    id: `bonif-${alumno.id}-${b.mes}`,
    tipo: 'bonificacion',
    fecha: `${b.mes}-01`,
    mes: b.mes,
    tipoBonif: b.tipo || 'porcentaje',
    valor: b.valor ?? 100,
    motivo: b.motivo,
    alumnoId: alumno.id,
  }))
  const cambiosTarifa = (alumno.historialTarifas || [])
    .filter((t) => t.desde !== DESDE_INICIAL)
    .map((t) => ({
      id: `tarifa-${alumno.id}-${t.desde}`,
      tipo: 'cambio_tarifa',
      fecha: `${t.desde}-01`,
      desde: t.desde,
      tarifa: t,
      alumnoId: alumno.id,
    }))
  return [...bonificaciones, ...cambiosTarifa]
}

export function eliminarAlumno(id) {
  return marcarEliminado('alumnos', id)
}

function normalizar(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function coincideBusqueda(alumno, busqueda) {
  const q = normalizar(busqueda).trim()
  if (!q) return true
  return normalizar(alumno.nombre).includes(q) || normalizar(alumno.apellido).includes(q)
}
