import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteField,
} from 'firebase/firestore'

// Fecha muy anterior a cualquier fechaInicio real, para que la primera
// versión del historial cubra todo lo ya devengado sin cambiar los números.
const DESDE_INICIAL = '2000-01'

async function migrar(db, etiqueta) {
  const snap = await getDocs(collection(db, 'actividades'))
  let actualizadas = 0
  for (const d of snap.docs) {
    const data = d.data()
    if (data.historialPrecios) continue
    await updateDoc(doc(db, 'actividades', d.id), {
      historialPrecios: [{ desde: DESDE_INICIAL, precios: data.precios || {} }],
      precios: deleteField(),
    })
    actualizadas++
  }
  console.log(`  [${etiqueta}] actividades: ${actualizadas} migradas a historialPrecios`)
}

const emuladorApp = initializeApp(
  { apiKey: 'demo-api-key', projectId: 'demo-pilates-yoga' },
  'emulador',
)
const emuladorDb = getFirestore(emuladorApp)
connectFirestoreEmulator(emuladorDb, '127.0.0.1', 8080)
await migrar(emuladorDb, 'emulador')

const prodApp = initializeApp(
  {
    apiKey: 'AIzaSyD71TmEtUL-RCTvFRW9FZJzjC0r3vNWSfo',
    authDomain: 'turnosdaia.firebaseapp.com',
    projectId: 'turnosdaia',
    storageBucket: 'turnosdaia.firebasestorage.app',
    messagingSenderId: '124153856350',
    appId: '1:124153856350:web:28fe476fe7ebd59bc44fcf',
  },
  'produccion',
)
const prodDb = getFirestore(prodApp)
await migrar(prodDb, 'produccion')

console.log('\nListo.')
