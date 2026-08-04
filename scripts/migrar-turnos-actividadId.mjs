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

async function migrar(db, etiqueta) {
  const actSnap = await getDocs(collection(db, 'actividades'))
  const actividades = actSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

  const turnosSnap = await getDocs(collection(db, 'turnos'))
  let actualizados = 0
  let sinMatch = 0
  for (const d of turnosSnap.docs) {
    const turno = d.data()
    if (turno.actividadId) continue
    const nombreTexto = (turno.actividad || '').trim().toLowerCase()
    const match = actividades.find(
      (a) => a.espacioId === turno.espacioId && a.nombre.trim().toLowerCase() === nombreTexto,
    )
    if (!match) {
      sinMatch++
      continue
    }
    await updateDoc(doc(db, 'turnos', d.id), {
      actividadId: match.id,
      actividad: deleteField(),
    })
    actualizados++
  }
  console.log(
    `  [${etiqueta}] turnos: ${actualizados} migrados a actividadId` +
      (sinMatch ? `, ${sinMatch} sin actividad coincidente (sin tocar)` : ''),
  )
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
