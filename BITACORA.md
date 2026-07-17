# Bitácora – Persistencia local con SQLite (Grupo 7)

**Módulo:** Transporte y rutas universitarias
**Entidad principal:** `rutas`

## Resumen de la implementación

- Se creó la carpeta `src/app/database/` con:
  - `rutas.sql.ts`: script de creación de la tabla `rutas` y de los datos semilla.
  - `database.service.ts`: servicio base que abre la conexión SQLite, ejecuta el script de creación y siembra los datos si la tabla está vacía.
- Se creó `src/app/services/rutas.service.ts` con el CRUD local (`create`, `findAll`, `findById`, `update`, `delete`) usando la conexión de `DatabaseService`.
- Se conectaron las páginas existentes al servicio local:
  - `rutas.page.ts` carga el listado desde SQLite (`findAll`) en `ngOnInit` y en `ionViewWillEnter` (para refrescar al volver de crear/editar/eliminar).
  - `detalle.page.ts` consulta por id (`findById`) y ahora permite **editar** (navega al formulario con el id) y **eliminar** (`delete`) de verdad, no solo con `alert()`.
  - `formulario.page.ts` ahora soporta modo crear y modo editar (si llega un `id` por `queryParams`, precarga el registro y usa `update`; si no, usa `create`).
- `app.component.ts` inicializa la base de datos (`initDatabase()`) al arrancar la app.
- `main.ts` e `index.html` registran el web component `jeep-sqlite`, necesario para poder probar SQLite en navegador (`ng serve`) sin depender de un dispositivo/emulador Android.

## Incidencias detectadas y solución aplicada

1. **Incidencia:** El proyecto no tenía ningún plugin de SQLite instalado; toda la data era un arreglo en memoria repetido en `rutas.page.ts` y `detalle.page.ts`.
   **Solución:** se agregó `@capacitor-community/sqlite` (plugin nativo) y se centralizó el acceso a datos en `DatabaseService` + `RutasService`, evitando duplicar el arreglo de rutas en cada página.

2. **Incidencia:** SQLite nativo no funciona directamente en el navegador durante `ng serve`, lo que dificulta las pruebas rápidas sin compilar a Android.
   **Solución:** se agregó `jeep-sqlite` (+ `sql.js` como dependencia de soporte) y se registró en `main.ts` / `index.html`. `DatabaseService` detecta la plataforma con `Capacitor.getPlatform()` y solo llama a `initWebStore()` / `saveToStore()` cuando corre en modo web.

3. **Incidencia:** Los botones "Editar" y "Eliminar" en la pantalla de detalle solo mostraban un `alert()` de prueba, sin tocar los datos.
   **Solución:** "Eliminar" ahora pide confirmación y llama a `RutasService.delete()`; "Editar" navega a `/formulario?id=X`, donde `FormularioPage` detecta el `id`, precarga los datos con `findById()` y guarda los cambios con `update()`.

4. **Incidencia:** Al probar en navegador (`ng serve` / `ionic serve`), la consola muestra `LinkError: WebAssembly.instantiate(): Import #34 "a" "I": function import requires a callable` al cargar `jeep-sqlite`, sin importar la combinación de versiones de `jeep-sqlite` / `@capacitor-community/sqlite` / `sql.js` que se use.
   **Causa:** se investigó y este es un **bug conocido y actualmente sin solución confirmada** del propio `jeep-sqlite` al cargar su wasm en navegadores recientes (Chrome/Firefox). Hay varios reportes idénticos en el foro oficial de Ionic con distintas combinaciones de versiones (incluso bajando a versiones de mediados de 2024), y ninguno logró resolverlo todavía. No es un error de configuración de nuestro proyecto.
   **Solución adoptada:** en vez de seguir intentando parchear el modo web (que depende de un componente de terceros con un bug abierto), se decidió **probar y grabar la evidencia en un emulador/dispositivo Android**, que es justamente el entorno que pide la guía de la actividad ("Capacitor configurado para Android o entorno de prueba") y donde `@capacitor-community/sqlite` usa SQLite **nativo** (no pasa por `jeep-sqlite`/wasm, así que este bug no aplica). Se agregó `@capacitor/android` a `package.json` para poder generar esa plataforma.

   Pasos para probar en Android (requiere Android Studio instalado):
   ```
   npm install
   npm run build
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
   Esto abre el proyecto en Android Studio; desde ahí se corre en un emulador o dispositivo conectado. El código de `DatabaseService`/`RutasService` no cambia: en Android, `Capacitor.getPlatform()` devuelve `'android'`, por lo que se omiten `initWebStore()`/`saveToStore()` y se usa la conexión SQLite nativa directamente.

   El código para navegador (`jeep-sqlite`) se deja tal cual en el proyecto por si el bug se corrige en una futura versión, pero **no se debe usar como evidencia principal** mientras siga fallando; usar Android para las capturas/video del entregable.

5. **Pendiente / a verificar por el equipo al instalar dependencias:** según la versión de Capacitor/Angular que use `npm install`, puede aparecer un conflicto de *peer dependencies* entre `@capacitor-community/sqlite` y la versión de `@capacitor/core` del proyecto. Si ocurre, instalar con:
   ```
   npm install --legacy-peer-deps
   ```

## Pruebas realizadas

- [ ] La lista de `/rutas` carga los 5 registros semilla desde SQLite (no desde el arreglo hardcodeado).
- [ ] Se registra una ruta nueva desde `/formulario` y aparece en el listado al volver.
- [ ] Se edita una ruta existente desde el detalle (botón "Editar") y el cambio se refleja en la lista y en el propio detalle.
- [ ] Se elimina una ruta desde el detalle (botón "Eliminar") y desaparece del listado.
- [ ] Adjuntar aquí capturas de pantalla o el enlace al video demostrativo.

