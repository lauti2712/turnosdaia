import { collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { marcarEliminado } from './papelera'

const formasPagoRef = collection(db, 'formasPago')

export function subscribeFormasPago(callback) {
  const q = query(formasPagoRef, orderBy('nombre'))
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((f) => !f.eliminadoTs),
    )
  })
}

export function crearFormaPago({ espacioId, nombre }) {
  return addDoc(formasPagoRef, { espacioId, nombre, creadoTs: Date.now() })
}

export function actualizarFormaPago(id, { nombre }) {
  return updateDoc(doc(db, 'formasPago', id), { nombre })
}

export function eliminarFormaPago(id) {
  return marcarEliminado('formasPago', id)
}
