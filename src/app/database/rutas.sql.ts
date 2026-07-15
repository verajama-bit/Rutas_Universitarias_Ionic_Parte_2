/**
 * Script de inicialización de la base de datos local (SQLite)
 * Módulo: Transporte y rutas universitarias
 * Entidad principal: rutas
 */

// Creación de la tabla principal del módulo
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
    estado TEXT NOT NULL DEFAULT 'Activa'
  );
`;

// Datos semilla: al menos 5 registros iniciales
export const SEED_RUTAS = `
  INSERT INTO rutas (nombre, origen, destino, horario, tarifa, conductor, bus, estado) VALUES
  ('Ruta Centro - UTM', 'Terminal Terrestre', 'Universidad Técnica de Manabí', '06:30 - 20:00', 0.35, 'Pendiente', 'Bus 01', 'Activa'),
  ('Ruta Norte - UTM', 'La Pradera', 'Universidad Técnica de Manabí', '07:00 - 19:30', 0.35, 'Pendiente', 'Bus 02', 'Activa'),
  ('Ruta Sur - UTM', 'Los Esteros', 'Universidad Técnica de Manabí', '06:00 - 21:00', 0.35, 'Pendiente', 'Bus 03', 'Activa'),
  ('Ruta Andrés de Vera', 'Barrio Andrés de Vera', 'Universidad Técnica de Manabí', '06:15 - 20:30', 0.35, 'Pendiente', 'Bus 04', 'Activa'),
  ('Ruta Colón', 'Barrio Colón', 'Universidad Técnica de Manabí', '06:45 - 19:00', 0.35, 'Pendiente', 'Bus 05', 'Inactiva');
`;
