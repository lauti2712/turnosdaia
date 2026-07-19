import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

const espaciosRef = collection(db, 'espacios')

export function subscribeEspacios(callback) {
  const q = query(espaciosRef, orderBy('nombre'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function crearEspacio({ nombre, socioNombre }) {
  return addDoc(espaciosRef, {
    nombre,
    socioNombre,
    creadoTs: Date.now(),
  })
}

export function actualizarEspacio(id, { nombre, socioNombre }) {
  return updateDoc(doc(db, 'espacios', id), {
    nombre,
    socioNombre,
  })
}

export function eliminarEspacio(id) {
  return deleteDoc(doc(db, 'espacios', id))
}
