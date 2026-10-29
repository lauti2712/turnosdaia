// En pantallas táctiles no se enfoca ningún campo al abrir un modal: el teclado
// taparía la mitad del formulario. En escritorio sí, para empezar a escribir directo.
export const autoFocusEscritorio =
  typeof window !== 'undefined' && !window.matchMedia('(pointer: coarse)').matches
