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

const pagosViviRef = collection(db, 'pagosVivi')

// Pagos que le hago a Vivi de lo que fui cobrando, cuando yo decido hacerlos
// (no están atados automáticamente a lo que cobro de las alumnas).
export function subscribePagosVivi(callback) {
  const q = query(pagosViviRef, orderBy('fecha', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function registrarPagoVivi({ monto, fecha, descripcion }) {
  return addDoc(pagosViviRef, {
    monto: Number(monto) || 0,
    fecha,
    descripcion: descripcion || '',
    ts: Date.now(),
  })
}

export function eliminarPagoVivi(id) {
  return deleteDoc(doc(db, 'pagosVivi', id))
}
