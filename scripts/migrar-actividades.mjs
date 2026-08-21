import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteField,
} from 'firebase/firestore'

const DIAS_PRECIO = [1, 2, 3, 4, 5, 6, 7]

function preciosVacios(overrides) {
  const p = {}
  for (const d of DIAS_PRECIO) p[d] = overrides[d] ?? null
  return p
}

async function migrar(db, etiqueta) {
  // 1. Crear las actividades si no existen todavía.
  const actSnap = await getDocs(collection(db, 'actividades'))
  let pilatesId = actSnap.docs.find((d) => d.data().nombre?.toLowerCase() === 'pilates')?.id
  let yogaId = actSnap.docs.find((d) => d.data().nombre?.toLowerCase() === 'yoga')?.id

  if (!pilatesId) {
    const ref = await addDoc(collection(db, 'actividades'), {
      nombre: 'Pilates',
      porcentajeVivi: 50,
      precios: preciosVacios({ 2: 42500, 3: 50000 }),
      creadoTs: Date.now(),
    })
    pilatesId = ref.id
    console.log(`  [${etiqueta}] creada actividad Pilates (${pilatesId})`)
  }
  if (!yogaId) {
    const ref = await addDoc(collection(db, 'actividades'), {
      nombre: 'Yoga',
      porcentajeVivi: 60,
      precios: preciosVacios({ 2: 32000 }),
      creadoTs: Date.now(),
    })
    yogaId = ref.id
    console.log(`  [${etiqueta}] creada actividad Yoga (${yogaId})`)
  }

  const porcentajePorActividad = { [pilatesId]: 50, [yogaId]: 60 }

  // 2. A partir de los turnos, armar un mapa alumnoId -> actividadId.
  const turnosSnap = await getDocs(collection(db, 'turnos'))
  const alumnoActividad = {}

  for (const tDoc of turnosSnap.docs) {
    const turno = tDoc.data()
    const actTexto = (turno.actividad || '').trim().toLowerCase()
    let actividadId = null
    if (actTexto === 'pilates') actividadId = pilatesId
    else if (actTexto === 'yoga') actividadId = yogaId
    if (!actividadId) continue

    const dias = turno.dias || {}
    for (const dia of Object.keys(dias)) {
      for (const alumnoId of dias[dia] || []) {
        alumnoActividad[alumnoId] = actividadId
      }
    }
  }

  // 3. Asignar actividadId a cada alumno y sacar el montoMensual viejo
  // (ahora el precio se calcula solo desde la actividad).
  const alumnosSnap = await getDocs(collection(db, 'alumnos'))
  let alumnosActualizados = 0
  let alumnosSinTurno = 0
  for (const aDoc of alumnosSnap.docs) {
    const actividadId = alumnoActividad[aDoc.id]
    if (!actividadId) {
      alumnosSinTurno++
      continue
    }
    await updateDoc(doc(db, 'alumnos', aDoc.id), {
      actividadId,
      montoMensual: deleteField(),
    })
    alumnosActualizados++
  }
  console.log(
    `  [${etiqueta}] ${alumnosActualizados} alumnos con actividad asignada` +
      (alumnosSinTurno ? `, ${alumnosSinTurno} sin turno (sin tocar)` : ''),
  )

  // 4. Recalcular el % de Vivi en todos los pagos ya cargados, según la
  // actividad recién asignada a cada alumna.
  const movsSnap = await getDocs(collection(db, 'movimientos'))
  let pagosActualizados = 0
  for (const mDoc of movsSnap.docs) {
    const mov = mDoc.data()
    if (mov.tipo !== 'pago') continue
    const actividadId = alumnoActividad[mov.alumnoId]
    const pct = actividadId ? porcentajePorActividad[actividadId] : 0
    await updateDoc(doc(db, 'movimientos', mDoc.id), { porcentajeVivi: pct })
    pagosActualizados++
  }
  console.log(`  [${etiqueta}] ${pagosActualizados} pagos recalculados`)
}

// SOLO EMULADOR. Esta migración ya se corrió contra producción (una única
// vez, cuando se introdujo el sistema de Actividades) y usa datos hoy
// obsoletos (busca turno.actividad como texto, que ya no existe — se
// reemplazó por actividadId; y hardcodea 50/60% en vez de leer el % real de
// cada actividad). Volver a correrla contra prod pisaría con estos valores
// viejos el porcentajeVivi correcto de pagos reales. Si hace falta re-seedear
// el emulador, esto alcanza; para producción, no se debe tocar más.
const emuladorApp = initializeApp(
  { apiKey: 'demo-api-key', projectId: 'demo-pilates-yoga' },
  'emulador',
)
const emuladorDb = getFirestore(emuladorApp)
connectFirestoreEmulator(emuladorDb, '127.0.0.1', 8080)
await migrar(emuladorDb, 'emulador')

console.log('\nListo.')
