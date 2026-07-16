import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

const entregasRef = collection(db, 'entregasVivi')

export function subscribeEntregasVivi(callback) {
  const q = query(entregasRef, orderBy('fecha', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function registrarEntregaVivi({ monto, fecha, descripcion }) {
  return addDoc(entregasRef, {
    monto: Number(monto) || 0,
    fecha,
    descripcion: descripcion || '',
    ts: Date.now(),
  })
}

export function eliminarEntregaVivi(id) {
  return deleteDoc(doc(db, 'entregasVivi', id))
}
