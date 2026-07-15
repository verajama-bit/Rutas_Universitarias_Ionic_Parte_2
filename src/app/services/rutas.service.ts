import { Injectable } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import { Ruta } from '../models/ruta.model';

/**
 * Repositorio LOCAL del módulo "Transporte y rutas universitarias".
 *
 * Es la única clase que conoce SQLite. Implementa el CRUD sobre la tabla
 * "rutas" y, además (Parte 2), administra los campos de control de
 * sincronización: sync_state, remote_id, updated_at, last_synced_at y
 * sync_error. No conoce la API REST ni hace llamadas HTTP: eso es
 * responsabilidad de RutasRemoteService. El repositorio unificado
 * (RutasRepository) es quien combina esta clase con el servicio remoto.
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

  /** Busca una ruta por su id remoto (usado al aplicar datos de la API). */
  async findByRemoteId(remoteId: number): Promise<Ruta | undefined> {
    const db = await this.dbService.getConnection();
    const resultado = await db.query('SELECT * FROM rutas WHERE remote_id = ?;', [remoteId]);
    return (resultado.values as Ruta[])?.[0];
  }

  /** Registros que aún no están sincronizados (pendientes o en error). */
  async findPendientes(): Promise<Ruta[]> {
    const db = await this.dbService.getConnection();
    const resultado = await db.query(
      "SELECT * FROM rutas WHERE sync_state != 'sincronizado' ORDER BY id ASC;"
    );
    return (resultado.values as Ruta[]) ?? [];
  }

  /**
   * Inserta una nueva ruta creada desde la app (formulario).
   * Queda marcada como "pendiente": todavía no existe en el servidor.
   * Retorna el id local autogenerado.
   */
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
    // changes.lastId trae el id autoincremental insertado
    return resultado.changes?.lastId as number;
  }

  /**
   * Actualiza una ruta existente por id local, editada desde la app.
   * Queda marcada como "pendiente" hasta que se confirme la subida al servidor.
   */
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

  /** Marca un registro como sincronizado con éxito, guardando su remote_id. */
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

  /** Marca un registro con error de sincronización y guarda el motivo. */
  async marcarError(id: number, mensaje: string): Promise<void> {
    const db = await this.dbService.getConnection();
    await db.run(`UPDATE rutas SET sync_state = 'error', sync_error = ? WHERE id = ?;`, [
      mensaje,
      id,
    ]);
    await this.dbService.guardarEnStoreWeb();
  }

  /**
   * Aplica al almacenamiento local una lista de rutas obtenidas de la API
   * (upsert por remote_id). Si el registro local correspondiente tiene una
   * edición pendiente sin sincronizar, NO se sobreescribe (se evita perder
   * el cambio del usuario); esa ruta se resolverá en el próximo intento de
   * sincronización manual.
   */
  async upsertDesdeRemoto(rutasRemotas: Ruta[]): Promise<void> {
    const db = await this.dbService.getConnection();
    const ahora = new Date().toISOString();

    for (const remota of rutasRemotas) {
      if (remota.id == null) continue;
      const existente = await this.findByRemoteId(remota.id);

      if (!existente) {
        // Ruta nueva publicada en el servidor: se inserta en local ya sincronizada.
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

      if (existente.sync_state === 'pendiente') {
        // Hay una edición local sin subir todavía: el servidor NO sobreescribe
        // este registro (regla "no perder cambios locales no sincronizados").
        continue;
      }

      // El servidor es la fuente de verdad para los campos administrados.
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
