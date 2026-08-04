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

export function construirNombreTurno({ actividadNombre, diasActivos, horario }) {
  const iniciales = DIAS.filter((d) => (diasActivos || []).includes(d))
    .map((d) => DIAS_INICIAL[d])
    .join(', ')
  return [actividadNombre, iniciales, horario].filter(Boolean).join(' ')
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

export function crearTurno({ espacioId, actividadId, actividadNombre, diasActivos, horario, cupoMaximo }) {
  return addDoc(turnosRef, {
    espacioId,
    actividadId: actividadId || null,
    diasActivos: diasActivos || [],
    horario: horario || '',
    cupoMaximo: Number(cupoMaximo) || 1,
    nombre: construirNombreTurno({ actividadNombre, diasActivos, horario }),
    dias: diasVacios(),
    orden: Date.now(),
    creadoTs: Date.now(),
  })
}

export function actualizarOrdenTurno(id, orden) {
  return updateDoc(doc(db, 'turnos', id), { orden })
}

export function actualizarTurno(id, { actividadId, actividadNombre, diasActivos, horario, cupoMaximo }) {
  return updateDoc(doc(db, 'turnos', id), {
    actividadId: actividadId || null,
    diasActivos: diasActivos || [],
    horario: horario || '',
    cupoMaximo: Number(cupoMaximo) || 1,
    nombre: construirNombreTurno({ actividadNombre, diasActivos, horario }),
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

// Con qué turnos/días está realmente un alumno AHORA MISMO en Firestore,
// mirando turno.dias directamente en vez de confiar en el campo alumno.turnos
// (que puede no existir todavía si nunca se editó desde la ficha nueva, o
// quedar desactualizado si se lo asignó a mano desde la grilla de Turnos).
// Es la base real contra la que se compara al sincronizar.
export function turnosActualesDeAlumno(alumnoId, turnos) {
  const resultado = []
  for (const turno of turnos) {
    const dias = DIAS.filter((dia) => (turno.dias?.[dia] || []).includes(alumnoId))
    if (dias.length > 0) resultado.push({ turnoId: turno.id, dias })
  }
  return resultado
}

// Reconcilia las asignaciones turno+día de un alumno cuando se crea/edita
// desde su ficha: da de baja las combinaciones que ya no están y da de alta
// las nuevas, comparando contra el estado anterior (vacío si es un alumno
// nuevo). turnosAnteriores/turnosNuevos: [{ turnoId, dias: [...] }].
export function sincronizarAsignaciones(alumnoId, turnosAnteriores = [], turnosNuevos = []) {
  const clave = (turnoId, dia) => `${turnoId}:${dia}`
  const antes = new Set(
    turnosAnteriores.flatMap((t) => (t.dias || []).map((d) => clave(t.turnoId, d))),
  )
  const despues = new Set(
    turnosNuevos.flatMap((t) => (t.dias || []).map((d) => clave(t.turnoId, d))),
  )
  const aQuitar = [...antes].filter((x) => !despues.has(x))
  const aAgregar = [...despues].filter((x) => !antes.has(x))

  return Promise.all([
    ...aQuitar.map((x) => {
      const [turnoId, dia] = x.split(':')
      return quitarAlumno(turnoId, dia, alumnoId)
    }),
    ...aAgregar.map((x) => {
      const [turnoId, dia] = x.split(':')
      return asignarAlumno(turnoId, dia, alumnoId)
    }),
  ])
}
