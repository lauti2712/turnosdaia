import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from '../firebase'
import { marcarEliminado } from './papelera'

const turnosRef = collection(db, 'turnos')

export const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
export const DIAS_LABEL = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
}
export const DIAS_INICIAL = {
  lunes: 'L',
  martes: 'M',
  miercoles: 'Mi',
  jueves: 'J',
  viernes: 'V',
}

function diasVacios() {
  return Object.fromEntries(DIAS.map((d) => [d, []]))
}

export function construirNombreTurno({ actividad, diasActivos, horario }) {
  const iniciales = DIAS.filter((d) => (diasActivos || []).includes(d))
    .map((d) => DIAS_INICIAL[d])
    .join(', ')
  return [actividad, iniciales, horario].filter(Boolean).join(' ')
}

export function subscribeTurnos(callback) {
  const q = query(turnosRef, orderBy('orden'))
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs
        .map((d) => ({ id: d.id, dias: diasVacios(), diasActivos: [], ...d.data() }))
        .filter((t) => !t.eliminadoTs),
    )
  })
}

export function crearTurno({ espacioId, actividad, diasActivos, horario, cupoMaximo }) {
  return addDoc(turnosRef, {
    espacioId,
    actividad: actividad || '',
    diasActivos: diasActivos || [],
    horario: horario || '',
    cupoMaximo: Number(cupoMaximo) || 1,
    nombre: construirNombreTurno({ actividad, diasActivos, horario }),
    dias: diasVacios(),
    orden: Date.now(),
    creadoTs: Date.now(),
  })
}

export function actualizarOrdenTurno(id, orden) {
  return updateDoc(doc(db, 'turnos', id), { orden })
}

export function actualizarTurno(id, { actividad, diasActivos, horario, cupoMaximo }) {
  return updateDoc(doc(db, 'turnos', id), {
    actividad: actividad || '',
    diasActivos: diasActivos || [],
    horario: horario || '',
    cupoMaximo: Number(cupoMaximo) || 1,
    nombre: construirNombreTurno({ actividad, diasActivos, horario }),
  })
}

export function eliminarTurno(id) {
  return marcarEliminado('turnos', id)
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
