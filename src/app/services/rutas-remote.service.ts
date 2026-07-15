import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { Ruta } from '../models/ruta.model';

/** Tiempo máximo de espera de una petición antes de considerarla fallida. */
const TIMEOUT_MS = 8000;

/**
 * Repositorio REMOTO del módulo "Transporte y rutas universitarias".
 *
 * Único punto de contacto con la API REST (GET/POST/PUT/DELETE sobre
 * /api/rutas). No conoce SQLite ni el estado de sincronización: solo
 * traduce llamadas HTTP a promesas y normaliza los errores para que el
 * repositorio unificado (RutasRepository) decida qué hacer con ellos.
 */
@Injectable({ providedIn: 'root' })
export class RutasRemoteService {
  private readonly baseUrl = `${environment.apiUrl}/rutas`;

  constructor(private http: HttpClient) {}

  /** GET /api/rutas — lista completa de rutas publicadas en el servidor. */
  getAll(): Promise<Ruta[]> {
    return firstValueFrom(
      this.http.get<Ruta[]>(this.baseUrl).pipe(timeout(TIMEOUT_MS), catchError(this.manejarError))
    );
  }

  /** GET /api/rutas/:id — detalle de una ruta por su id remoto. */
  getById(remoteId: number): Promise<Ruta> {
    return firstValueFrom(
      this.http
        .get<Ruta>(`${this.baseUrl}/${remoteId}`)
        .pipe(timeout(TIMEOUT_MS), catchError(this.manejarError))
    );
  }

  /** POST /api/rutas — crea una ruta; el servidor retorna el id definitivo. */
  create(ruta: Ruta): Promise<Ruta> {
    return firstValueFrom(
      this.http
        .post<Ruta>(this.baseUrl, this.aCuerpoApi(ruta))
        .pipe(timeout(TIMEOUT_MS), catchError(this.manejarError))
    );
  }

  /** PUT /api/rutas/:id — actualiza una ruta existente en el servidor. */
  update(remoteId: number, ruta: Ruta): Promise<Ruta> {
    return firstValueFrom(
      this.http
        .put<Ruta>(`${this.baseUrl}/${remoteId}`, this.aCuerpoApi(ruta))
        .pipe(timeout(TIMEOUT_MS), catchError(this.manejarError))
    );
  }

  /** DELETE /api/rutas/:id — elimina una ruta en el servidor. */
  delete(remoteId: number): Promise<void> {
    return firstValueFrom(
      this.http
        .delete<void>(`${this.baseUrl}/${remoteId}`)
        .pipe(timeout(TIMEOUT_MS), catchError(this.manejarError))
    );
  }

  /** Quita los campos de control local antes de enviar el objeto a la API. */
  private aCuerpoApi(ruta: Ruta) {
    return {
      nombre: ruta.nombre,
      origen: ruta.origen,
      destino: ruta.destino,
      horario: ruta.horario,
      tarifa: ruta.tarifa,
      conductor: ruta.conductor,
      bus: ruta.bus,
      estado: ruta.estado,
    };
  }

  /**
   * Normaliza cualquier error (de red, de timeout o de respuesta HTTP)
   * a un HttpErrorResponse consistente, para que quien consuma este
   * servicio pueda inspeccionar siempre `.status` y `.message`.
   */
  private manejarError = (error: unknown) => {
    if (error instanceof HttpErrorResponse) {
      return throwError(() => error);
    }
    // Errores de RxJS que no son HttpErrorResponse (ej. TimeoutError)
    return throwError(
      () =>
        new HttpErrorResponse({
          error,
          status: 0,
          statusText: 'Sin respuesta del servidor (timeout o red no disponible)',
        })
    );
  };
}
