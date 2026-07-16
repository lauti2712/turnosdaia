import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
} from 'firebase/firestore'

const firebaseConfigProd = {
  apiKey: 'AIzaSyD71TmEtUL-RCTvFRW9FZJzjC0r3vNWSfo',
  authDomain: 'turnosdaia.firebaseapp.com',
  projectId: 'turnosdaia',
  storageBucket: 'turnosdaia.firebasestorage.app',
  messagingSenderId: '124153856350',
  appId: '1:124153856350:web:28fe476fe7ebd59bc44fcf',
}

// En desarrollo usamos un proyecto demo contra el emulador local, así no se
// necesita conexión a internet ni se tocan datos reales.
const firebaseConfigDev = {
  apiKey: 'demo-api-key',
  projectId: 'demo-pilates-yoga',
}

const app = initializeApp(import.meta.env.DEV ? firebaseConfigDev : firebaseConfigProd)

// Cache local persistente (IndexedDB): permite leer y seguir creando/editando
// datos sin conexión — los cambios quedan en cola y se sincronizan solos
// cuando vuelve la señal. persistentMultipleTabManager para que ande bien
// si se abre la app en más de una pestaña a la vez.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
