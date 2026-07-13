import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore'

const app = initializeApp({ apiKey: 'demo-api-key', projectId: 'demo-pilates-yoga' })
const db = getFirestore(app)
connectFirestoreEmulator(db, '127.0.0.1', 8080)

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
const diasVacios = () => Object.fromEntries(DIAS.map((d) => [d, []]))

async function crearTurno({ nombre, horario, cupoMaximo }) {
  const ref = await addDoc(collection(db, 'turnos'), {
    nombre,
    horario: horario || '',
    cupoMaximo: Number(cupoMaximo) || 1,
    dias: diasVacios(),
    creadoTs: Date.now(),
  })
  return ref.id
}

async function crearAlumno({ nombre, apellido, diasPorSemana, montoMensual, fechaInicio }) {
  const ref = await addDoc(collection(db, 'alumnos'), {
    nombre,
    apellido,
    diasPorSemana: Number(diasPorSemana) || 0,
    montoMensual: Number(montoMensual) || 0,
    fechaInicio,
    extra: [],
    activo: true,
    creadoTs: Date.now(),
  })
  return ref.id
}

async function asignar(turnoId, dia, alumnoId) {
  await updateDoc(doc(db, 'turnos', turnoId), { [`dias.${dia}`]: arrayUnion(alumnoId) })
}

const hoy = new Date().toISOString().slice(0, 10)
const MONTO = 50000

const turnosData = [
  {
    nombre: 'Lunes, Miércoles y Viernes 8:30 - Pilates',
    horario: '8:30',
    dias: ['lunes', 'miercoles', 'viernes'],
    alumnos: [
      ['Gonzalez', 'Gabriela'],
      ['Horacio', 'Bautista'],
      ['Bochini', 'Marina'],
      ['Oguero', 'Noelia'],
      ['Federesi', 'Pamela'],
      ['Nose', 'Rosana'],
      ['Vega', 'Silvia'],
    ],
  },
  {
    nombre: 'Lunes, Miércoles y Viernes 9:30 - Pilates',
    horario: '9:30',
    dias: ['lunes', 'miercoles', 'viernes'],
    alumnos: [
      ['Nose', 'Anabellia'],
      ['Vallone', 'Andrea'],
      ['Nose', 'Angelita'],
      ['Gomez', 'Marcela'],
      ['Nose', 'Elena'],
      ['Nose', 'Santino'],
      ['Nose', 'Maru'],
    ],
  },
  {
    nombre: 'Lunes, Miércoles y Viernes 15:00 - Pilates',
    horario: '15:00',
    dias: ['lunes', 'miercoles', 'viernes'],
    alumnos: [
      ['Funes', 'Ana'],
      ['Ortiz', 'Argentina'],
      ['Guiñazu', 'Laura'],
      ['Nose', 'Lilian'],
      ['Sabattini', 'Pau'],
      ['Gil', 'Viviana'],
      ['Nose', 'Nadia'],
      ['Nose', 'Yoana'],
    ],
  },
  {
    nombre: 'Lunes, Miércoles y Viernes 16:30 - Pilates',
    horario: '16:30',
    dias: ['lunes', 'miercoles', 'viernes'],
    alumnos: [
      ['Nose', 'Aymeé'],
      ['Zanon', 'Ana'],
      ['Quiroga', 'Daniela'],
      ['Abeldaño', 'Jenny'],
      ['Quipildor', 'Johana'],
      ['Gonzalez', 'Julieta'],
      ['Gonzalez', 'Janet'],
      ['Salvador', 'Laura'],
      ['Nose', 'Roxana'],
      ['Nose', 'Stella Maris'],
    ],
  },
  {
    nombre: 'Martes y Jueves 10:00 - Pilates',
    horario: '10:00',
    dias: ['martes', 'jueves'],
    alumnos: [
      ['Marin', 'Leticia'],
      ['Zanon', 'Melany'],
      ['Lorenzo', 'Susana'],
      ['Sanchez', 'Susana'],
      ['Corvalan', 'Teresa'],
      ['Medero', 'Virginia'],
    ],
  },
  {
    nombre: 'Martes y Jueves 8:30 - Yoga',
    horario: '8:30',
    dias: ['martes', 'jueves'],
    alumnos: [
      ['Tutor', 'Adriana'],
      ['Lampugnani', 'Estela'],
      ['Nose', 'Juanita'],
      ['Nose', 'Maitena'],
      ['Robazza', 'Marina'],
      ['Deblassi', 'Marta'],
      ['Tagua', 'Rosa'],
      ['Foureret', 'Walter'],
      ['Nose', 'Evangelina'],
    ],
  },
]

let totalAlumnos = 0

for (const t of turnosData) {
  const turnoId = await crearTurno({
    nombre: t.nombre,
    horario: t.horario,
    cupoMaximo: t.alumnos.length,
  })
  for (const [apellido, nombre] of t.alumnos) {
    const alumnoId = await crearAlumno({
      nombre,
      apellido,
      diasPorSemana: t.dias.length,
      montoMensual: MONTO,
      fechaInicio: hoy,
    })
    for (const dia of t.dias) {
      await asignar(turnoId, dia, alumnoId)
    }
    totalAlumnos++
  }
  console.log(`✓ "${t.nombre}" — ${t.alumnos.length} alumnos`)
}

console.log(`\nListo: ${turnosData.length} turnos, ${totalAlumnos} alumnos.`)
