import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

const actividadesRef = collection(db, 'actividades')

export const DIAS_PRECIO = [1, 2, 3, 4, 5, 6, 7]

function normalizarPrecios(precios) {
  const out = {}
  for (const dia of DIAS_PRECIO) {
    const v = precios?.[dia]
    out[dia] = v === '' || v == null ? null : Number(v)
  }
  return out
}

export function subscribeActividades(callback) {
  const q = query(actividadesRef, orderBy('nombre'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, precios: {}, ...d.data() })))
  })
}

export function crearActividad({ nombre, porcentajeVivi, precios }) {
  return addDoc(actividadesRef, {
    nombre,
    porcentajeVivi: Number(porcentajeVivi) || 0,
    precios: normalizarPrecios(precios),
    creadoTs: Date.now(),
  })
}

export function actualizarActividad(id, { nombre, porcentajeVivi, precios }) {
  return updateDoc(doc(db, 'actividades', id), {
    nombre,
    porcentajeVivi: Number(porcentajeVivi) || 0,
    precios: normalizarPrecios(precios),
  })
}

export function eliminarActividad(id) {
  return deleteDoc(doc(db, 'actividades', id))
}

// Monto mensual real de un alumno: si tiene un precio manual cargado, ese
// gana; si no, se calcula desde la tabla de precios de su actividad según
// los días por semana. Así, cambiar el precio de una actividad actualiza
// a todas las alumnas de una sin tener que tocarlas una por una.
export function montoMensualEfectivo(alumno, actividades) {
  if (alumno.precioManual != null && alumno.precioManual !== '') {
    return Number(alumno.precioManual) || 0
  }
  const actividad = actividades.find((a) => a.id === alumno.actividadId)
  if (!actividad) return 0
  return actividad.precios?.[alumno.diasPorSemana] || 0
}

export function porcentajeViviDeAlumno(alumno, actividades) {
  const actividad = actividades.find((a) => a.id === alumno.actividadId)
  return actividad?.porcentajeVivi ?? 0
}
