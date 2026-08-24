import { collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { marcarEliminado } from './papelera'

const espaciosRef = collection(db, 'espacios')

export function subscribeEspacios(callback) {
  const q = query(espaciosRef, orderBy('nombre'))
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((e) => !e.eliminadoTs),
    )
  })
}

export function crearEspacio({ nombre, socioNombre, modoCobroSocio, montoFijoSocio }) {
  return addDoc(espaciosRef, {
    nombre,
    socioNombre: modoCobroSocio === 'ninguno' ? '' : socioNombre,
    modoCobroSocio: modoCobroSocio || 'porActividad',
    montoFijoSocio: modoCobroSocio === 'montoFijo' ? Number(montoFijoSocio) || 0 : null,
    creadoTs: Date.now(),
  })
}

export function actualizarEspacio(id, { nombre, socioNombre, modoCobroSocio, montoFijoSocio }) {
  return updateDoc(doc(db, 'espacios', id), {
    nombre,
    socioNombre: modoCobroSocio === 'ninguno' ? '' : socioNombre,
    modoCobroSocio: modoCobroSocio || 'porActividad',
    montoFijoSocio: modoCobroSocio === 'montoFijo' ? Number(montoFijoSocio) || 0 : null,
  })
}

export function eliminarEspacio(id) {
  return marcarEliminado('espacios', id)
}

// Espacios creados antes de este campo no tienen `modoCobroSocio` — se
// tratan como 'porActividad' para no cambiarles el comportamiento actual.
export function mostrarSocio(espacio) {
  return (espacio?.modoCobroSocio || 'porActividad') === 'porActividad'
}
