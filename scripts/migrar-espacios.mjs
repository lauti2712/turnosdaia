import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
} from 'firebase/firestore'

const COLECCIONES = ['actividades', 'alumnos', 'movimientos', 'turnos', 'pagosVivi']

async function migrar(db, etiqueta) {
  // 1. Crear el espacio "Pilates y Yoga" si no existe todavía.
  const espSnap = await getDocs(collection(db, 'espacios'))
  let espacioId = espSnap.docs.find((d) => d.data().nombre === 'Pilates y Yoga')?.id

  if (!espacioId) {
    const ref = await addDoc(collection(db, 'espacios'), {
      nombre: 'Pilates y Yoga',
      socioNombre: 'Vivi',
      creadoTs: Date.now(),
    })
    espacioId = ref.id
    console.log(`  [${etiqueta}] creado espacio Pilates y Yoga (${espacioId})`)
  } else {
    console.log(`  [${etiqueta}] espacio Pilates y Yoga ya existía (${espacioId})`)
  }

  // 2. Asignarle ese espacioId a todos los documentos existentes que todavía
  // no lo tengan, en cada colección que ahora vive scoped por espacio.
  for (const nombreColeccion of COLECCIONES) {
    const snap = await getDocs(collection(db, nombreColeccion))
    let actualizados = 0
    for (const d of snap.docs) {
      if (d.data().espacioId) continue
      await updateDoc(doc(db, nombreColeccion, d.id), { espacioId })
      actualizados++
    }
    console.log(`  [${etiqueta}] ${nombreColeccion}: ${actualizados} documentos con espacioId asignado`)
  }
}

// SOLO EMULADOR. Ya se corrió contra producción cuando se introdujo el
// sistema de Espacios. El chequeo "ya existe" busca por nombre === 'Pilates
// y Yoga' — si ese espacio se renombra (como pasó: ahora es 'Vivi'), el
// chequeo no lo encuentra y crea un espacio duplicado y huérfano. Ya pasó
// dos veces. No volver a correr esto contra prod.
const emuladorApp = initializeApp(
  { apiKey: 'demo-api-key', projectId: 'demo-pilates-yoga' },
  'emulador',
)
const emuladorDb = getFirestore(emuladorApp)
connectFirestoreEmulator(emuladorDb, '127.0.0.1', 8080)
await migrar(emuladorDb, 'emulador')

console.log('\nListo.')
