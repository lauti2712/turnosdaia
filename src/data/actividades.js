import { collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { marcarEliminado } from './papelera'

const actividadesRef = collection(db, 'actividades')

export const DIAS_PRECIO = [1, 2, 3, 4, 5, 6, 7]

export function mesActualId() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function normalizarPrecios(precios) {
  const out = {}
  for (const dia of DIAS_PRECIO) {
    const v = precios?.[dia]
    out[dia] = v === '' || v == null ? null : Number(v)
  }
  return out
}

function preciosIguales(a, b) {
  return DIAS_PRECIO.every((d) => (a?.[d] ?? null) === (b?.[d] ?? null))
}

// Agrega una nueva versión de precios al historial, vigente desde el mes en
// que se guarda el cambio — así los meses ya devengados no se recalculan
// con la tarifa nueva. Si el precio no cambió, no crea una versión de más.
function conNuevaVersion(historial, preciosNuevos, mesId) {
  const normalizados = normalizarPrecios(preciosNuevos)
  const vigente = historial[historial.length - 1]
  if (vigente && preciosIguales(vigente.precios, normalizados)) return historial
  return [...historial, { desde: mesId, precios: normalizados }]
}

// Versión de precios vigente en un mes dado: la última cuyo "desde" sea
// anterior o igual a ese mes.
export function precioVigente(actividad, mesId) {
  const historial = actividad?.historialPrecios || []
  const validas = historial.filter((h) => h.desde <= mesId)
  if (validas.length === 0) return historial[0]?.precios || {}
  return validas[validas.length - 1].precios
}

export function subscribeActividades(callback) {
  const q = query(actividadesRef, orderBy('nombre'))
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs
        .map((d) => ({ id: d.id, historialPrecios: [], ...d.data() }))
        .filter((a) => !a.eliminadoTs),
    )
  })
}

export function crearActividad({ espacioId, nombre, porcentajeVivi, precios }) {
  return addDoc(actividadesRef, {
    espacioId,
    nombre,
    porcentajeVivi: Number(porcentajeVivi) || 0,
    historialPrecios: [{ desde: mesActualId(), precios: normalizarPrecios(precios) }],
    creadoTs: Date.now(),
  })
}

export function actualizarActividad(id, { nombre, porcentajeVivi, precios }, historialActual) {
  return updateDoc(doc(db, 'actividades', id), {
    nombre,
    porcentajeVivi: Number(porcentajeVivi) || 0,
    historialPrecios: conNuevaVersion(historialActual || [], precios, mesActualId()),
  })
}

export function eliminarActividad(id) {
  return marcarEliminado('actividades', id)
}

// Monto mensual real de un alumno en un mes dado: si tiene un precio manual
// cargado, ese gana (aplica siempre, no tiene historial propio); si no, se
// busca la tarifa vigente de su actividad en ese mes según los días por
// semana. Por default es el mes actual (para mostrar la cuota vigente).
export function montoMensualEfectivo(alumno, actividades, mesId = mesActualId()) {
  if (alumno.precioManual != null && alumno.precioManual !== '') {
    return Number(alumno.precioManual) || 0
  }
  const actividad = actividades.find((a) => a.id === alumno.actividadId)
  if (!actividad) return 0
  return precioVigente(actividad, mesId)?.[alumno.diasPorSemana] || 0
}

export function porcentajeViviDeAlumno(alumno, actividades) {
  const actividad = actividades.find((a) => a.id === alumno.actividadId)
  return actividad?.porcentajeVivi ?? 0
}
