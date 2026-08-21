// Convierte una fecha ISO (YYYY-MM-DD, como la guardan los <input type="date">)
// al formato dd/mm/aaaa para mostrarla en tablas y textos.
export function fmtFecha(fechaIso) {
  if (!fechaIso) return ''
  const [anio, mes, dia] = fechaIso.split('-')
  if (!anio || !mes || !dia) return fechaIso
  return `${dia}/${mes}/${anio}`
}
