/**
 * Script de inicialización de la base de datos local (SQLite)
 * Módulo: Transporte y rutas universitarias
 * Entidad principal: rutas
 *
 * Parte 2: se agregan columnas de control de sincronización
 * (remote_id, sync_state, updated_at, last_synced_at, sync_error)
 * para soportar la estrategia offline-first documentada en la Parte 1.
 */

// Creación de la tabla principal del módulo (instalación nueva)
export const CREATE_TABLE_RUTAS = `
  CREATE TABLE IF NOT EXISTS rutas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    origen TEXT NOT NULL,
    destino TEXT NOT NULL,
    horario TEXT NOT NULL,
    tarifa REAL NOT NULL DEFAULT 0,
    conductor TEXT,
    bus TEXT,
    estado TEXT NOT NULL DEFAULT 'Activa',
    remote_id INTEGER,
    sync_state TEXT NOT NULL DEFAULT 'sincronizado',
    updated_at TEXT,
    last_synced_at TEXT,
    sync_error TEXT
  );
`;

/**
 * Migraciones "suaves" para instalaciones que ya tenían la tabla `rutas`
 * de la Parte 1, sin las columnas de sincronización. Cada ALTER TABLE se
 * ejecuta de forma independiente y se ignora el error si la columna ya existe
 * (ver DatabaseService.aplicarMigraciones).
 */
export const MIGRACIONES_SYNC: string[] = [
  `ALTER TABLE rutas ADD COLUMN remote_id INTEGER;`,
  `ALTER TABLE rutas ADD COLUMN sync_state TEXT NOT NULL DEFAULT 'sincronizado';`,
  `ALTER TABLE rutas ADD COLUMN updated_at TEXT;`,
  `ALTER TABLE rutas ADD COLUMN last_synced_at TEXT;`,
  `ALTER TABLE rutas ADD COLUMN sync_error TEXT;`,
];

// Datos semilla: al menos 5 registros iniciales.
// remote_id 1-5 coincide con los ids sembrados en el backend de ejemplo
// (backend/server.js), de modo que el primer refresco desde la API
// actualice estos mismos registros en vez de duplicarlos.
export const SEED_RUTAS = `
  INSERT INTO rutas (nombre, origen, destino, horario, tarifa, conductor, bus, estado, remote_id, sync_state, updated_at, last_synced_at) VALUES
  ('Ruta Centro - UTM', 'Terminal Terrestre', 'Universidad Técnica de Manabí', '06:30 - 20:00', 0.35, 'Pendiente', 'Bus 01', 'Activa', 1, 'sincronizado', datetime('now'), datetime('now')),
  ('Ruta Norte - UTM', 'La Pradera', 'Universidad Técnica de Manabí', '07:00 - 19:30', 0.35, 'Pendiente', 'Bus 02', 'Activa', 2, 'sincronizado', datetime('now'), datetime('now')),
  ('Ruta Sur - UTM', 'Los Esteros', 'Universidad Técnica de Manabí', '06:00 - 21:00', 0.35, 'Pendiente', 'Bus 03', 'Activa', 3, 'sincronizado', datetime('now'), datetime('now')),
  ('Ruta Andrés de Vera', 'Barrio Andrés de Vera', 'Universidad Técnica de Manabí', '06:15 - 20:30', 0.35, 'Pendiente', 'Bus 04', 'Activa', 4, 'sincronizado', datetime('now'), datetime('now')),
  ('Ruta Colón', 'Barrio Colón', 'Universidad Técnica de Manabí', '06:45 - 19:00', 0.35, 'Pendiente', 'Bus 05', 'Inactiva', 5, 'sincronizado', datetime('now'), datetime('now'));
`;
