import { useState } from 'react'
import { coincideBusqueda } from '../data/alumnos'

export default function AlumnoBuscador({ alumnos, onSeleccionar, placeholder, autoFocus }) {
  const [query, setQuery] = useState('')

  const resultados = query.trim()
    ? alumnos.filter((a) => coincideBusqueda(a, query)).slice(0, 8)
    : []

  return (
    <div className="autocomplete">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || 'Escribí nombre o apellido...'}
        autoFocus={autoFocus}
      />
      {query.trim() && (
        <div className="autocomplete-results">
          {resultados.length === 0 ? (
            <div className="autocomplete-empty">Sin coincidencias</div>
          ) : (
            resultados.map((a) => (
              <button
                type="button"
                key={a.id}
                className="autocomplete-item"
                onClick={() => {
                  onSeleccionar(a)
                  setQuery('')
                }}
              >
                {a.apellido}, {a.nombre}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
