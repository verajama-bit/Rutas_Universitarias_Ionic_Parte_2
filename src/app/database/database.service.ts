import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';

import { CREATE_TABLE_RUTAS, SEED_RUTAS } from './rutas.sql';

const DB_NAME = 'rutas_universitarias_db';

/**
 * Servicio base de acceso a SQLite.
 * Se encarga de abrir la conexión a la base de datos local,
 * crear la tabla del módulo si no existe e insertar los datos semilla.
 * Los servicios de cada entidad (por ejemplo RutasService) reutilizan
 * este servicio para obtener la conexión ya lista.
 */
@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private ready = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Inicializa la conexión a la base de datos local.
   * Es segura de llamar varias veces: solo ejecuta la inicialización una vez.
   */
  async initDatabase(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.crearConexion();
    }
    return this.initPromise;
  }

  private async crearConexion(): Promise<void> {
    try {
      // En navegador (modo web de pruebas) se necesita inicializar el store
      // que usa el web component <jeep-sqlite> definido en index.html
      if (Capacitor.getPlatform() === 'web') {
        await this.sqlite.initWebStore();
      }

      const consistencia = await this.sqlite.checkConnectionsConsistency();
      const conexionExiste = (await this.sqlite.isConnection(DB_NAME, false)).result;

      if (consistencia.result && conexionExiste) {
        this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
      } else {
        this.db = await this.sqlite.createConnection(
          DB_NAME,
          false,
          'no-encryption',
          1,
          false
        );
      }

      await this.db.open();

      // Fase 1: script de inicialización (creación de tabla)
      await this.db.execute(CREATE_TABLE_RUTAS);

      // Fase 2: datos semilla, solo si la tabla está vacía
      const total = await this.db.query('SELECT COUNT(*) AS total FROM rutas;');
      const cantidad = total.values?.[0]?.['total'] ?? 0;
      if (cantidad === 0) {
        await this.db.execute(SEED_RUTAS);
      }

      await this.guardarEnStoreWeb();
      this.ready = true;
    } catch (error) {
      console.error('Error al inicializar la base de datos SQLite:', error);
      throw error;
    }
  }

  /** Devuelve la conexión abierta, inicializando la base de datos si aún no lo está. */
  async getConnection(): Promise<SQLiteDBConnection> {
    if (!this.ready) {
      await this.initDatabase();
    }
    return this.db;
  }

  /** Persiste los cambios en el store web (jeep-sqlite/IndexedDB) tras cada escritura. */
  async guardarEnStoreWeb(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      await this.sqlite.saveToStore(DB_NAME);
    }
  }
}
