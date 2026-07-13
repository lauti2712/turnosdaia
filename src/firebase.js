import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

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
export const db = getFirestore(app)

if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
