import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// Config de placeholder: alcanza para desarrollar contra el emulador local.
// Antes de deployar a producción hay que crear un proyecto real en
// https://console.firebase.google.com y reemplazar estos valores
// (ver README.md).
const firebaseConfig = {
  apiKey: 'demo-api-key',
  projectId: 'demo-pilates-yoga',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
