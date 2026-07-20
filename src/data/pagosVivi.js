import { collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { marcarEliminado } from './papelera'

const pagosViviRef = collection(db, 'pagosVivi')

// Pagos que le hago a Vivi de lo que fui cobrando, cuando yo decido hacerlos
// (no están atados automáticamente a lo que cobro de las alumnas).
export function subscribePagosVivi(callback) {
  const q = query(pagosViviRef, orderBy('fecha', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => !p.eliminadoTs),
    )
  })
}

export function registrarPagoVivi({ espacioId, monto, fecha, descripcion }) {
  return addDoc(pagosViviRef, {
    espacioId,
    monto: Number(monto) || 0,
    fecha,
    descripcion: descripcion || '',
    ts: Date.now(),
  })
}

export function actualizarPagoVivi(id, { monto, fecha, descripcion }) {
  return updateDoc(doc(db, 'pagosVivi', id), {
    monto: Number(monto) || 0,
    fecha,
    descripcion: descripcion || '',
  })
}

export function eliminarPagoVivi(id) {
  return marcarEliminado('pagosVivi', id)
}
