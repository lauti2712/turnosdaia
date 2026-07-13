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

export function crearAlumno({
  nombre,
  apellido,
  diasPorSemana,
  montoMensual,
  fechaInicio,
  extra = [],
}) {
  return addDoc(alumnosRef, {
    nombre,
    apellido,
    diasPorSemana: Number(diasPorSemana) || 0,
    montoMensual: Number(montoMensual) || 0,
    fechaInicio,
    extra,
    activo: true,
    creadoTs: Date.now(),
  })
}

export function actualizarAlumno(id, cambios) {
  return updateDoc(doc(db, 'alumnos', id), cambios)
}

export function archivarAlumno(id, activo) {
  return updateDoc(doc(db, 'alumnos', id), { activo })
}

export function eliminarAlumno(id) {
  return deleteDoc(doc(db, 'alumnos', id))
}
