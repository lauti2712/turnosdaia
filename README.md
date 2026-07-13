# Pilates & Yoga — gestión de turnos y cobros

App para llevar el control de turnos (con cupo), alumnos y su cuenta corriente
mensual. React + Vite + Firestore.

## Desarrollo local

Corre contra el **emulador de Firestore** (proyecto demo `demo-pilates-yoga`),
no necesita ningún proyecto real de Firebase ni conexión a internet.

Requiere Java (lo usa el emulador). Si `java -version` falla, instalar con
`brew install openjdk` y agregarlo al PATH:

```
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
```

Levantar todo:

```bash
# Terminal 1
firebase emulators:start --only firestore

# Terminal 2
npm run dev
```

Abrir http://localhost:5173. Los datos se guardan solo en memoria del
emulador — se pierden al reiniciarlo (a menos que uses `--export-on-exit`).

## Modelo de datos (Firestore)

- **`alumnos`**: `{ nombre, apellido, diasPorSemana, montoMensual, fechaInicio, extra: [{clave, valor}], activo }`
- **`turnos`**: `{ nombre, horario, cupoMaximo, dias: { lunes: [alumnoId], martes: [...], miercoles: [...], jueves: [...], viernes: [...] } }`
- **`movimientos`**: `{ alumnoId, tipo: 'pago'|'ajuste', monto, fecha, formaPago?, descripcion, ts }`

La deuda de cada alumno **no se guarda como documento mensual**: se calcula
al vuelo como `mesesTranscurridos(fechaInicio) × montoMensual`, y el saldo es
esa deuda menos la suma de pagos (± ajustes). Ver `src/data/movimientos.js`.

## Pasar a producción

Por ahora todo corre contra el emulador. Para tener la app accesible desde
cualquier dispositivo (no solo esta compu) hace falta:

1. Crear un proyecto real en https://console.firebase.google.com (plan
   gratuito Spark alcanza).
2. Reemplazar `firebaseConfig` en `src/firebase.js` con las credenciales
   reales del proyecto, y sacar el `connectFirestoreEmulator` (o dejarlo
   condicionado a `import.meta.env.DEV` como ya está).
3. `firebase use --add` para apuntar `.firebaserc` al proyecto real.
4. `npm run build && firebase deploy`.

**Importante — no hay login.** Las reglas de Firestore (`firestore.rules`)
permiten leer y escribir a cualquiera que tenga la URL de la app. Es válido
para uso personal con una URL no compartida, pero si en algún momento se
publica el link hay que agregar autenticación antes.
