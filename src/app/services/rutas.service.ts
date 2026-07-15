import { Injectable } from '@angular/core';

import { DatabaseService } from '../database/database.service';
import { Ruta } from '../models/ruta.model';

/**
 * Servicio local del módulo "Transporte y rutas universitarias".
 * Implementa el CRUD (create, findAll, findById, update, delete)
 * sobre la tabla "rutas" usando la conexión provista por DatabaseService.
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

  /** Busca una ruta por su id. */
  async findById(id: number): Promise<Ruta | undefined> {
    const db = await this.dbService.getConnection();
    const resultado = await db.query('SELECT * FROM rutas WHERE id = ?;', [id]);
    return (resultado.values as Ruta[])?.[0];
  }

  /** Inserta una nueva ruta. */
  async create(ruta: Ruta): Promise<void> {
    const db = await this.dbService.getConnection();
    const sql = `INSERT INTO rutas (nombre, origen, destino, horario, tarifa, conductor, bus, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?);`;
    await db.run(sql, [
      ruta.nombre,
      ruta.origen,
      ruta.destino,
      ruta.horario,
      ruta.tarifa,
      ruta.conductor,
      ruta.bus,
      ruta.estado,
    ]);
    await this.dbService.guardarEnStoreWeb();
  }

  /** Actualiza una ruta existente por id. */
  async update(id: number, ruta: Ruta): Promise<void> {
    const db = await this.dbService.getConnection();
    const sql = `UPDATE rutas
                 SET nombre = ?, origen = ?, destino = ?, horario = ?,
                     tarifa = ?, conductor = ?, bus = ?, estado = ?
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
      id,
    ]);
    await this.dbService.guardarEnStoreWeb();
  }

  /** Elimina una ruta por id. */
  async delete(id: number): Promise<void> {
    const db = await this.dbService.getConnection();
    await db.run('DELETE FROM rutas WHERE id = ?;', [id]);
    await this.dbService.guardarEnStoreWeb();
  }
}
