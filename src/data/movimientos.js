import { collection, doc, addDoc, updateDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { montoMensualEfectivo } from './actividades'
import { marcarEliminado } from './papelera'

const movimientosRef = collection(db, 'movimientos')

export function subscribeMovimientos(alumnoId, callback) {
  const q = query(
    movimientosRef,
    where('alumnoId', '==', alumnoId),
    orderBy('fecha', 'desc'),
  )
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((m) => !m.eliminadoTs),
    )
  })
}

export function subscribeTodosMovimientos(callback) {
  const q = query(movimientosRef, orderBy('fecha', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((m) => !m.eliminadoTs),
    )
  })
}

export function registrarPago({
  espacioId,
  alumnoId,
  monto,
  fecha,
  formaPago,
  descripcion,
  abonadoAVivi,
  porcentajeVivi,
}) {
  return addDoc(movimientosRef, {
    espacioId,
    alumnoId,
    tipo: 'pago',
    monto: Number(monto) || 0,
    fecha,
    formaPago: formaPago || '',
    descripcion: descripcion || '',
    // abonadoAVivi: quién cobró el efectivo (ella o yo).
    // porcentajeVivi: qué parte le corresponde a Vivi según la actividad de
    // la alumna, sin importar quién lo cobró — son dos cosas independientes.
    abonadoAVivi: !!abonadoAVivi,
    porcentajeVivi: Number(porcentajeVivi) || 0,
    ts: Date.now(),
  })
}

// De cualquier pago, qué parte le corresponde a Vivi y qué parte es propia,
// según el % de reparto de la actividad de la alumna (guardado en el pago al
// momento de cargarlo, para que no cambien los números históricos si el %
// de una actividad se actualiza más adelante).
export function montoViviDePago(movimiento) {
  const pct = movimiento.porcentajeVivi ?? 0
  return movimiento.monto * (pct / 100)
}

export function montoPropioDePago(movimiento) {
  const pct = movimiento.porcentajeVivi ?? 0
  return movimiento.monto * (1 - pct / 100)
}

export function registrarAjuste({ espacioId, alumnoId, monto, fecha, descripcion }) {
  return addDoc(movimientosRef, {
    espacioId,
    alumnoId,
    tipo: 'ajuste',
    monto: Number(monto) || 0, // con signo: + aumenta deuda, - la reduce
    fecha,
    descripcion: descripcion || '',
    ts: Date.now(),
  })
}

export function eliminarMovimiento(id) {
  return marcarEliminado('movimientos', id)
}

// Edita un movimiento ya cargado (corregir un error de tipeo, por ejemplo).
// No cambia el tipo ni el alumno — solo los datos del pago/ajuste en sí.
export function actualizarMovimientoPago(id, { monto, fecha, formaPago, descripcion, abonadoAVivi }) {
  return updateDoc(doc(db, 'movimientos', id), {
    monto: Number(monto) || 0,
    fecha,
    formaPago: formaPago || '',
    descripcion: descripcion || '',
    abonadoAVivi: !!abonadoAVivi,
  })
}

export function actualizarMovimientoAjuste(id, { monto, fecha, descripcion }) {
  return updateDoc(doc(db, 'movimientos', id), {
    monto: Number(monto) || 0,
    fecha,
    descripcion: descripcion || '',
  })
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

// Deuda generada mes a mes desde fechaInicio hasta hoy, usando en cada mes
// la tarifa que estaba vigente en ESE momento (no la actual) — así, si el
// precio de una actividad cambió en el medio, los meses ya devengados no se
// recalculan con la tarifa nueva.
export function deudaGenerada(alumno, actividades) {
  const meses = mesesTranscurridos(alumno.fechaInicio)
  if (meses === 0 || !alumno.fechaInicio) return 0
  const cursor = new Date(alumno.fechaInicio + 'T00:00:00')
  let total = 0
  for (let i = 0; i < meses; i++) {
    const mesId = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    total += montoMensualEfectivo(alumno, actividades, mesId)
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return total
}

// saldo > 0 significa que el alumno debe plata.
export function calcularSaldo(alumno, movimientos, actividades) {
  const deuda = deudaGenerada(alumno, actividades)
  const pagos = movimientos
    .filter((m) => m.tipo === 'pago')
    .reduce((acc, m) => acc + m.monto, 0)
  const ajustes = movimientos
    .filter((m) => m.tipo === 'ajuste')
    .reduce((acc, m) => acc + m.monto, 0)
  return deuda + ajustes - pagos
}
