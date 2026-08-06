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
  }
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

export function archivarAlumno(id, activo) {
  return updateDoc(doc(db, 'alumnos', id), { activo })
}

// Marca un mes como bonificado (ej. no asistió): ese mes no genera deuda ni
// corresponde ningún pago — deudaGenerada() lo salta directamente.
export function bonificarMes(id, mes, motivo, bonificacionesActuales = []) {
  if (bonificacionesActuales.some((b) => b.mes === mes)) return Promise.resolve()
  return updateDoc(doc(db, 'alumnos', id), {
    bonificaciones: [...bonificacionesActuales, { mes, motivo: motivo || '' }],
  })
}

export function quitarBonificacion(id, mes, bonificacionesActuales = []) {
  return updateDoc(doc(db, 'alumnos', id), {
    bonificaciones: bonificacionesActuales.filter((b) => b.mes !== mes),
  })
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
