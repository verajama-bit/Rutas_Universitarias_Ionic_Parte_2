import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PendingSyncService {
  private STORAGE_KEY = 'pending_operations';
  constructor() { }
  guardarOperacion(tipo: string, datos: any): void {
    const pendientes = this.obtenerPendientes();
    pendientes.push({
      tipo,
      datos,
      fecha: new Date().toISOString()
    });
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(pendientes)
    );
  }
  obtenerPendientes(): any[] {
    const datos = localStorage.getItem(this.STORAGE_KEY);
    return datos ? JSON.parse(datos) : [];
  }
  sincronizar(): void {
    const pendientes = this.obtenerPendientes();
    if (pendientes.length === 0) {
      alert('No existen operaciones pendientes.');
      return;
    }
    pendientes.forEach((operacion, index) => {
      console.log(
        `Sincronizando ${index + 1}`,
        operacion
      );
    });
    localStorage.removeItem(this.STORAGE_KEY);
    alert('Sincronización completada.');
  }
  limpiarPendientes(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
