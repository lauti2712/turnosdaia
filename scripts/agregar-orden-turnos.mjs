import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
} from 'firebase/firestore'

async function agregarOrden(db, etiqueta) {
  const snap = await getDocs(query(collection(db, 'turnos'), orderBy('nombre')))
  let n = 0
  let orden = 0
  for (const d of snap.docs) {
    const turno = d.data()
    if (turno.orden !== undefined) {
      orden = Math.max(orden, turno.orden + 1)
      continue
    }
    await updateDoc(doc(db, 'turnos', d.id), { orden })
    console.log(`  "${turno.nombre}" → orden ${orden}`)
    orden++
    n++
  }
  console.log(`✓ [${etiqueta}] ${n} turnos actualizados (de ${snap.size})`)
}

const emuladorApp = initializeApp(
  { apiKey: 'demo-api-key', projectId: 'demo-pilates-yoga' },
  'emulador',
)
const emuladorDb = getFirestore(emuladorApp)
connectFirestoreEmulator(emuladorDb, '127.0.0.1', 8080)
await agregarOrden(emuladorDb, 'emulador')

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
await agregarOrden(prodDb, 'produccion')

console.log('\nListo.')
