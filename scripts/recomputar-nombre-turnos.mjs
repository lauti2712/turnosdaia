import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore'

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
const DIAS_INICIAL = { lunes: 'L', martes: 'M', miercoles: 'Mi', jueves: 'J', viernes: 'V' }

function construirNombreTurno({ actividad, diasActivos, horario }) {
  const iniciales = DIAS.filter((d) => (diasActivos || []).includes(d))
    .map((d) => DIAS_INICIAL[d])
    .join(', ')
  return [actividad, iniciales, horario].filter(Boolean).join(' ')
}

async function recomputar(db, etiqueta) {
  const snap = await getDocs(collection(db, 'turnos'))
  let n = 0
  for (const d of snap.docs) {
    const turno = d.data()
    const nombre = construirNombreTurno(turno)
    if (nombre === turno.nombre) continue
    await updateDoc(doc(db, 'turnos', d.id), { nombre })
    console.log(`  "${turno.nombre}" → "${nombre}"`)
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
await recomputar(emuladorDb, 'emulador')

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
await recomputar(prodDb, 'produccion')

console.log('\nListo.')
