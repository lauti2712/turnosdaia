import { createContext, useContext, useEffect, useState } from 'react'
import { subscribeEspacios } from '../data/espacios'

const STORAGE_KEY = 'espacioActualId'

const EspacioContext = createContext(null)

export function EspacioProvider({ children }) {
  const [espacios, setEspacios] = useState([])
  const [espacioActualId, setEspacioActualIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null,
  )

  useEffect(() => subscribeEspacios(setEspacios), [])

  useEffect(() => {
    if (espacios.length === 0) return
    const existe = espacios.some((e) => e.id === espacioActualId)
    if (!existe) {
      setEspacioActualId(espacios[0].id)
    }
  }, [espacios, espacioActualId])

  function setEspacioActualId(id) {
    setEspacioActualIdState(id)
    if (id) localStorage.setItem(STORAGE_KEY, id)
  }

  const espacioActual = espacios.find((e) => e.id === espacioActualId) || null

  return (
    <EspacioContext.Provider value={{ espacios, espacioActual, espacioActualId, setEspacioActualId }}>
      {children}
    </EspacioContext.Provider>
  )
}

export function useEspacio() {
  const ctx = useContext(EspacioContext)
  if (!ctx) throw new Error('useEspacio debe usarse dentro de EspacioProvider')
  return ctx
}
