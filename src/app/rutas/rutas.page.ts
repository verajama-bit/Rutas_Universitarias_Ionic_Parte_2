import { Component } from '@angular/core';
import { PendingSyncService } from '../services/pending-sync.service';

@Component({
  selector: 'app-rutas',
  templateUrl: './rutas.page.html',
  styleUrls: ['./rutas.page.scss'],
})
export class RutasPage {
  constructor(
    private pendingSync: PendingSyncService
  ) {}
  
  guardarRutaSinConexion(ruta: any) {
    this.pendingSync.guardarOperacion(
      'crear',
      ruta
    );
    alert('Ruta guardada como pendiente.');
  }

  sincronizarPendientes() {
    this.pendingSync.sincronizar();
  }
}
