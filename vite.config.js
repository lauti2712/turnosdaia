import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Baseline amplio para que cargue en celulares con navegadores viejos
    // (ej. iPhones con iOS desactualizado) en vez del default súper moderno.
    target: 'es2018',
  },
})
