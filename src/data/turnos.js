import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from '../firebase'

const turnosRef = collection(db, 'turnos')

export const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
export const DIAS_LABEL = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
}

function diasVacios() {
  return Object.fromEntries(DIAS.map((d) => [d, []]))
}

export function subscribeTurnos(callback) {
  const q = query(turnosRef, orderBy('nombre'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, dias: diasVacios(), ...d.data() })))
  })
}

export function crearTurno({ nombre, horario, cupoMaximo }) {
  return addDoc(turnosRef, {
    nombre,
    horario: horario || '',
    cupoMaximo: Number(cupoMaximo) || 1,
    dias: diasVacios(),
    creadoTs: Date.now(),
  })
}

export function actualizarTurno(id, cambios) {
  return updateDoc(doc(db, 'turnos', id), cambios)
}

export function eliminarTurno(id) {
  return deleteDoc(doc(db, 'turnos', id))
}

export function asignarAlumno(turnoId, dia, alumnoId) {
  return updateDoc(doc(db, 'turnos', turnoId), {
    [`dias.${dia}`]: arrayUnion(alumnoId),
  })
}

export function quitarAlumno(turnoId, dia, alumnoId) {
  return updateDoc(doc(db, 'turnos', turnoId), {
    [`dias.${dia}`]: arrayRemove(alumnoId),
  })
}
