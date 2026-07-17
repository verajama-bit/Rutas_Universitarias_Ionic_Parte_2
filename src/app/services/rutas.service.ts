import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { Ruta } from '../models/ruta.model';

/**
 * Repositorio LOCAL del módulo "Transporte y rutas universitarias".
 * Administra el CRUD y campos de control de sincronización en SQLite.
 */
@Injectable({ providedIn: 'root' })
export class RutasService {
  constructor(private dbService: DatabaseService) {}

  /** Devuelve todas las rutas registradas, ordenadas por id. */
  async findAll(): Promise<Ruta[]> {
    const db = await this.dbService.getConnection();
    const resultado = await db.query('SELECT * FROM rutas ORDER BY id ASC;');
    return (resultado.values as Ruta[]) ?? [];
  }

  /** Busca una ruta por su id local. */
  async findById(id: number): Promise<Ruta | undefined> {
    const db = await this.dbService.getConnection();
    const resultado = await db.query('SELECT * FROM rutas WHERE id = ?;', [id]);
    return (resultado.values as Ruta[])?.[0];
  }

  /** Busca una ruta por su id remoto. */
  async findByRemoteId(remoteId: number): Promise<Ruta | undefined> {
    const db = await this.dbService.getConnection();
    const resultado = await db.query('SELECT * FROM rutas WHERE remote_id = ?;', [remoteId]);
    return (resultado.values as Ruta[])?.[0];
  }

  /** Registros que aún no están sincronizados. */
  async findPendientes(): Promise<Ruta[]> {
    const db = await this.dbService.getConnection();
    const resultado = await db.query(
      "SELECT * FROM rutas WHERE sync_state != 'sincronizado' ORDER BY id ASC;"
    );
    return (resultado.values as Ruta[]) ?? [];
  }

  /** Inserta una nueva ruta localmente marcada como "pendiente". */
  async create(ruta: Ruta): Promise<number> {
    const db = await this.dbService.getConnection();
    const ahora = new Date().toISOString();
    const sql = `INSERT INTO rutas
                 (nombre, origen, destino, horario, tarifa, conductor, bus, estado,
                  remote_id, sync_state, updated_at, last_synced_at, sync_error)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pendiente', ?, NULL, NULL);`;
    const resultado = await db.run(sql, [
      ruta.nombre,
      ruta.origen,
      ruta.destino,
      ruta.horario,
      ruta.tarifa,
      ruta.conductor,
      ruta.bus,
      ruta.estado,
      ahora,
    ]);
    
    await this.dbService.guardarEnStoreWeb();
    return resultado.changes?.lastId as number;
  }

  /** Actualiza una ruta existente localmente. */
  async update(id: number, ruta: Ruta): Promise<void> {
    const db = await this.dbService.getConnection();
    const ahora = new Date().toISOString();
    const sql = `UPDATE rutas
                 SET nombre = ?, origen = ?, destino = ?, horario = ?,
                     tarifa = ?, conductor = ?, bus = ?, estado = ?,
                     sync_state = 'pendiente', updated_at = ?, sync_error = NULL
                 WHERE id = ?;`;
    await db.run(sql, [
      ruta.nombre,
      ruta.origen,
      ruta.destino,
      ruta.horario,
      ruta.tarifa,
      ruta.conductor,
      ruta.bus,
      ruta.estado,
      ahora,
      id,
    ]);
    
    await this.dbService.guardarEnStoreWeb();
  }

  /** Elimina una ruta por id local. */
  async delete(id: number): Promise<void> {
    const db = await this.dbService.getConnection();
    await db.run('DELETE FROM rutas WHERE id = ?;', [id]);
    await this.dbService.guardarEnStoreWeb();
  }

  /** Marca un registro como sincronizado con éxito. */
  async marcarSincronizado(id: number, remoteId: number, updatedAtServidor?: string): Promise<void> {
    const db = await this.dbService.getConnection();
    const ahora = new Date().toISOString();
    await db.run(
      `UPDATE rutas
       SET remote_id = ?, sync_state = 'sincronizado', sync_error = NULL,
           last_synced_at = ?, updated_at = ?
       WHERE id = ?;`,
      [remoteId, ahora, updatedAtServidor ?? ahora, id]
    );
    await this.dbService.guardarEnStoreWeb();
  }

  /** Marca un registro con error de sincronización. */
  async marcarError(id: number, mensaje: string): Promise<void> {
    const db = await this.dbService.getConnection();
    await db.run(`UPDATE rutas SET sync_state = 'error', sync_error = ? WHERE id = ?;`, [
      mensaje,
      id,
    ]);
    await this.dbService.guardarEnStoreWeb();
  }

  /** Aplica datos del servidor garantizando la regla de no sobreescribir pendientes locales. */
  async upsertDesdeRemoto(rutasRemotas: Ruta[]): Promise<void> {
    const db = await this.dbService.getConnection();
    const ahora = new Date().toISOString();

    for (const remota of rutasRemotas) {
      if (remota.id == null) continue;
      const existente = await this.findByRemoteId(remota.id);

      if (!existente) {
        await db.run(
          `INSERT INTO rutas
           (nombre, origen, destino, horario, tarifa, conductor, bus, estado,
            remote_id, sync_state, updated_at, last_synced_at, sync_error)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sincronizado', ?, ?, NULL);`,
          [
            remota.nombre,
            remota.origen,
            remota.destino,
            remota.horario,
            remota.tarifa,
            remota.conductor,
            remota.bus,
            remota.estado,
            remota.id,
            remota.updated_at ?? ahora,
            ahora,
          ]
        );
        continue;
      }

      // Respetar edición local pendiente
      if (existente.sync_state === 'pendiente') {
        continue;
      }

      await db.run(
        `UPDATE rutas
         SET nombre = ?, origen = ?, destino = ?, horario = ?, tarifa = ?,
             conductor = ?, bus = ?, estado = ?, sync_state = 'sincronizado',
             updated_at = ?, last_synced_at = ?, sync_error = NULL
         WHERE remote_id = ?;`,
        [
          remota.nombre,
          remota.origen,
          remota.destino,
          remota.horario,
          remota.tarifa,
          remota.conductor,
          remota.bus,
          remota.estado,
          remota.updated_at ?? ahora,
          ahora,
          remota.id,
        ]
      );
    }

    await this.dbService.guardarEnStoreWeb();
  }
}