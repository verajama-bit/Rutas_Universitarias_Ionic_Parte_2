import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Ruta } from '../models/ruta.model';
import { RutasService } from '../services/rutas.service';
import { RutasRemoteService } from '../services/rutas-remote.service';

/** Resultado informativo de una operación contra el servidor. */
export interface ResultadoSync {
  ok: boolean;
  mensaje?: string;
}

/**
 * Repositorio UNIFICADO del módulo "Transporte y rutas universitarias".
 *
 * Fase 1: combina RutasService (repositorio local / SQLite) con
 * RutasRemoteService (repositorio remoto / API REST), aplicando la
 * estrategia offline-first "local-first con refresco periódico":
 *
 * - Lectura: siempre se entrega primero lo que hay en SQLite; en paralelo
 *   se intenta refrescar desde la API y, si tiene éxito, se notifica a la
 *   UI mediante `rutas$`.
 * - Escritura: se guarda primero en local y se intenta subir una vez a la
 *   API. El manejo de errores avanzado (reintentos con backoff, cola de
 *   pendientes, sincronización manual) se agrega en la Fase 2.
 */
@Injectable({ providedIn: 'root' })
export class RutasRepository {
  private readonly rutasSubject = new BehaviorSubject<Ruta[]>([]);
  readonly rutas$ = this.rutasSubject.asObservable();

  constructor(private local: RutasService, private remote: RutasRemoteService) {}

  // ---------------------------------------------------------------------
  // Lectura: local primero, refresco remoto después
  // ---------------------------------------------------------------------

  /**
   * Devuelve de inmediato las rutas guardadas en SQLite y dispara, sin
   * bloquear la respuesta, un refresco en segundo plano desde la API.
   */
  async obtenerRutas(): Promise<Ruta[]> {
    const locales = await this.local.findAll();
    this.rutasSubject.next(locales);
    void this.refrescarDesdeRemoto(); // fire-and-forget: no bloquea la UI
    return locales;
  }

  async obtenerRutaPorId(id: number): Promise<Ruta | undefined> {
    return this.local.findById(id);
  }

  /**
   * Refresca la caché local con lo publicado en la API. Si no hay conexión
   * o la API falla, se conserva sin cambios lo que ya había en SQLite
   * (fallback local robusto).
   */
  async refrescarDesdeRemoto(): Promise<ResultadoSync> {
    try {
      const remotas = await this.remote.getAll();
      await this.local.upsertDesdeRemoto(remotas);
      this.rutasSubject.next(await this.local.findAll());
      return { ok: true };
    } catch (error) {
      console.error('No se pudo refrescar el listado de rutas desde la API:', error);
      return { ok: false, mensaje: 'No se pudo contactar el servidor. Se muestran los datos guardados localmente.' };
    }
  }

  // ---------------------------------------------------------------------
  // Escritura: local primero, intento de subida una sola vez
  // (el reintento con backoff y la cola de pendientes se agregan en la Fase 2)
  // ---------------------------------------------------------------------

  async crearRuta(ruta: Ruta): Promise<ResultadoSync> {
    const idLocal = await this.local.create(ruta);
    const resultado = await this.subirRegistro(idLocal);
    this.rutasSubject.next(await this.local.findAll());
    return resultado;
  }

  async actualizarRuta(id: number, ruta: Ruta): Promise<ResultadoSync> {
    await this.local.update(id, ruta);
    const resultado = await this.subirRegistro(id);
    this.rutasSubject.next(await this.local.findAll());
    return resultado;
  }

  async eliminarRuta(id: number): Promise<ResultadoSync> {
    const ruta = await this.local.findById(id);
    await this.local.delete(id);
    this.rutasSubject.next(await this.local.findAll());

    if (!ruta?.remote_id) {
      return { ok: true }; // nunca llegó a existir en el servidor
    }
    try {
      await this.remote.delete(ruta.remote_id);
      return { ok: true };
    } catch (error) {
      console.error('Se eliminó localmente pero no se pudo eliminar en el servidor:', error);
      return { ok: false, mensaje: 'Se eliminó localmente, pero no se pudo confirmar en el servidor.' };
    }
  }

  /** Intenta subir un único registro (create o update según tenga remote_id). */
  private async subirRegistro(id: number): Promise<ResultadoSync> {
    const ruta = await this.local.findById(id);
    if (!ruta) {
      return { ok: false, mensaje: 'El registro ya no existe localmente.' };
    }
    try {
      const respuesta = ruta.remote_id
        ? await this.remote.update(ruta.remote_id, ruta)
        : await this.remote.create(ruta);

      const remoteId = (respuesta.id as number | undefined) ?? ruta.remote_id!;
      await this.local.marcarSincronizado(id, remoteId, respuesta.updated_at ?? undefined);
      return { ok: true };
    } catch (error) {
      console.error(`Error al sincronizar la ruta local #${id}:`, error);
      await this.local.marcarError(id, 'No se pudo sincronizar con el servidor.');
      return { ok: false, mensaje: 'Se guardó localmente, pero no se pudo sincronizar con el servidor.' };
    }
  }
}
