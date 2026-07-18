import { Injectable } from '@angular/core';

export interface PendingSyncOperation {
  id: string;
  tipo: string;
  datos: unknown;
  fecha: string;
}

export interface PendingSyncResult {
  success: boolean;
  processed: number;
  remaining: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PendingSyncService {
  private readonly STORAGE_KEY = 'pending_operations';

  guardarOperacion(tipo: string, datos: unknown): PendingSyncResult {
    const pendientes = this.obtenerPendientes();
    const operacion: PendingSyncOperation = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      tipo,
      datos,
      fecha: new Date().toISOString()
    };

    pendientes.push(operacion);
    this.persistirPendientes(pendientes);

    return {
      success: true,
      processed: 0,
      remaining: pendientes.length,
      message: 'Operación registrada como pendiente.'
    };
  }

  obtenerPendientes(): PendingSyncOperation[] {
    const datos = this.leerStorage();
    if (!datos) {
      return [];
    }

    try {
      const parsed = JSON.parse(datos) as PendingSyncOperation[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async sincronizar(
    procesarOperacion: (operacion: PendingSyncOperation) => Promise<boolean> | boolean
  ): Promise<PendingSyncResult> {
    const pendientes = this.obtenerPendientes();

    if (pendientes.length === 0) {
      return {
        success: true,
        processed: 0,
        remaining: 0,
        message: 'No existen operaciones pendientes.'
      };
    }

    let procesadas = 0;

    for (const operacion of pendientes) {
      try {
        const resultado = await procesarOperacion(operacion);
        if (!resultado) {
          return {
            success: false,
            processed: procesadas,
            remaining: pendientes.length - procesadas,
            message: 'No fue posible sincronizar una o más operaciones pendientes.'
          };
        }
        procesadas += 1;
      } catch {
        return {
          success: false,
          processed: procesadas,
          remaining: pendientes.length - procesadas,
          message: 'No fue posible sincronizar una o más operaciones pendientes.'
        };
      }
    }

    this.limpiarPendientes();

    return {
      success: true,
      processed: procesadas,
      remaining: 0,
      message: 'Sincronización completada.'
    };
  }

  limpiarPendientes(): void {
    this.escribirStorage(null);
  }

  private leerStorage(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    return window.localStorage.getItem(this.STORAGE_KEY);
  }

  private persistirPendientes(pendientes: PendingSyncOperation[]): void {
    this.escribirStorage(JSON.stringify(pendientes));
  }

  private escribirStorage(valor: string | null): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    if (valor === null) {
      window.localStorage.removeItem(this.STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(this.STORAGE_KEY, valor);
  }
}
