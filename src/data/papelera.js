import { collection, doc, updateDoc, deleteDoc, deleteField, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// Ventana de tiempo durante la cual un elemento borrado se puede restaurar
// desde la Papelera. Pasado ese tiempo, se purga en forma definitiva la
// próxima vez que se abre la página.
export const VENTANA_RESTAURACION_MS = 6 * 60 * 60 * 1000

export function marcarEliminado(coleccion, id) {
  return updateDoc(doc(db, coleccion, id), { eliminadoTs: Date.now() })
}

export function restaurar(coleccion, id) {
  return updateDoc(doc(db, coleccion, id), { eliminadoTs: deleteField() })
}

export function eliminarDefinitivo(coleccion, id) {
  return deleteDoc(doc(db, coleccion, id))
}

// Todos los documentos de una colección que están marcados como eliminados
// (sin filtrar por antigüedad — eso lo resuelve quien consume la lista).
export function subscribeEliminados(coleccion, callback) {
  return onSnapshot(collection(db, coleccion), (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => !!x.eliminadoTs),
    )
  })
}
