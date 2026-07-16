import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

const movimientosRef = collection(db, 'movimientos')

export function subscribeMovimientos(alumnoId, callback) {
  const q = query(
    movimientosRef,
    where('alumnoId', '==', alumnoId),
    orderBy('fecha', 'desc'),
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function subscribeTodosMovimientos(callback) {
  const q = query(movimientosRef, orderBy('fecha', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function registrarPago({ alumnoId, monto, fecha, formaPago, descripcion, abonadoAVivi }) {
  return addDoc(movimientosRef, {
    alumnoId,
    tipo: 'pago',
    monto: Number(monto) || 0,
    fecha,
    formaPago: formaPago || '',
    descripcion: descripcion || '',
    abonadoAVivi: !!abonadoAVivi,
    ts: Date.now(),
  })
}

export function registrarAjuste({ alumnoId, monto, fecha, descripcion }) {
  return addDoc(movimientosRef, {
    alumnoId,
    tipo: 'ajuste',
    monto: Number(monto) || 0, // con signo: + aumenta deuda, - la reduce
    fecha,
    descripcion: descripcion || '',
    ts: Date.now(),
  })
}

export function eliminarMovimiento(id) {
  return deleteDoc(doc(db, 'movimientos', id))
}

// Meses de cuota devengados desde fechaInicio hasta hoy (el mes de inicio ya cuenta como 1).
export function mesesTranscurridos(fechaInicio, hasta = new Date()) {
  if (!fechaInicio) return 0
  const inicio = new Date(fechaInicio + 'T00:00:00')
  const meses =
    (hasta.getFullYear() - inicio.getFullYear()) * 12 +
    (hasta.getMonth() - inicio.getMonth()) +
    1
  return Math.max(meses, 0)
}

// saldo > 0 significa que el alumno debe plata.
export function calcularSaldo(alumno, movimientos) {
  const deuda = mesesTranscurridos(alumno.fechaInicio) * (alumno.montoMensual || 0)
  const pagos = movimientos
    .filter((m) => m.tipo === 'pago')
    .reduce((acc, m) => acc + m.monto, 0)
  const ajustes = movimientos
    .filter((m) => m.tipo === 'ajuste')
    .reduce((acc, m) => acc + m.monto, 0)
  return deuda + ajustes - pagos
}
