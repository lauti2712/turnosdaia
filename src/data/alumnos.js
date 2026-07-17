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

const alumnosRef = collection(db, 'alumnos')

export function subscribeAlumnos(callback) {
  const q = query(alumnosRef, orderBy('apellido'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
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
}) {
  return {
    nombre,
    apellido,
    diasPorSemana: Number(diasPorSemana) || 0,
    actividadId: actividadId || null,
    precioManual: precioManual === '' || precioManual == null ? null : Number(precioManual),
    fechaInicio,
    extra: extra || [],
  }
}

export function crearAlumno(datos) {
  return addDoc(alumnosRef, {
    ...normalizarAlumno(datos),
    activo: true,
    creadoTs: Date.now(),
  })
}

export function actualizarAlumno(id, datos) {
  return updateDoc(doc(db, 'alumnos', id), normalizarAlumno(datos))
}

export function archivarAlumno(id, activo) {
  return updateDoc(doc(db, 'alumnos', id), { activo })
}

export function eliminarAlumno(id) {
  return deleteDoc(doc(db, 'alumnos', id))
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
