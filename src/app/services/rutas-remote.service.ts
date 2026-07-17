import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Ruta } from '../models/ruta.model';

@Injectable({
  providedIn: 'root'
})
export class RutasRemoteService {
  // Ajusta la URL según tu backend o servidor de pruebas
  private apiUrl = 'https://jsonplaceholder.typicode.com/posts'; 

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de rutas desde el servidor remoto
   */
  getRutas(): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(this.apiUrl).pipe(
      map(response => {
        // Validación de respuesta inválida: verificar que venga una lista/arreglo
        if (!Array.isArray(response)) {
          throw new Error('Formato de respuesta inválido: Se esperaba un listado de rutas.');
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Captura y clasifica los errores de red y de respuesta HTTP
   */
  private handleError(error: HttpErrorResponse | Error) {
    let mensajeError = 'Ocurrió un error inesperado.';

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        // Fallo de red (sin conexión a internet o servidor caído)
        mensajeError = 'Sin conexión de red. Revisa tu conexión a internet.';
      } else {
        // Respuesta HTTP con error (404, 500, etc.)
        mensajeError = `Error en el servidor (${error.status}): ${error.message}`;
      }
    } else if (error instanceof Error) {
      // Error de validación lanzado manualmente (respuesta inválida)
      mensajeError = error.message;
    }

    console.error('[RutasRemoteService Error]:', mensajeError);
    return throwError(() => new Error(mensajeError));
  }
}