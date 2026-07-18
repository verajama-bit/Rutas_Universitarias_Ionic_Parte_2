import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';

import { RutasRemoteService } from '../../services/rutas-remote.service';
import { PendingSyncOperation, PendingSyncService } from '../../services/pending-sync.service';
import { Ruta } from '../../models/ruta.model';

@Component({
  selector: 'app-rutas',
  templateUrl: './rutas.page.html',
  styleUrls: ['./rutas.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink]
})
export class RutasPage implements OnInit {
  rutas: Ruta[] = [];
  cargando = true;
  mensajeEstado = '';
  sincronizando = false;

  constructor(
    private readonly rutasRemoteService: RutasRemoteService,
    private readonly pendingSyncService: PendingSyncService
  ) {}

  ngOnInit(): void {
    this.cargarRutasRemotas();
  }

  cargarRutasRemotas(): void {
    this.cargando = true;
    this.mensajeEstado = '';

    this.rutasRemoteService.getRutas().subscribe({
      next: (data: Ruta[]) => {
        this.rutas = data;
        this.cargando = false;
      },
      error: (err: unknown) => {
        console.error('Error al conectar con la API:', err);
        this.cargando = false;
        this.mensajeEstado = 'No fue posible cargar las rutas desde la fuente remota.';
      }
    });
  }

  registrarOperacionPendiente(): void {
    const hayConexion = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (hayConexion) {
      this.mensajeEstado = 'Conexión disponible. La operación continúa normalmente.';
      return;
    }

    const resultado = this.pendingSyncService.guardarOperacion('crear_ruta', {
      nombre: 'Ruta pendiente',
      origen: 'Universidad',
      destino: 'Centro'
    });

    this.mensajeEstado = resultado.message;
  }

  async sincronizarPendientes(): Promise<void> {
    this.sincronizando = true;
    this.mensajeEstado = '';

    const resultado = await this.pendingSyncService.sincronizar(async (operacion: PendingSyncOperation) => {
      console.log('Sincronizando operación pendiente:', operacion);
      return true;
    });

    this.mensajeEstado = resultado.message;
    this.sincronizando = false;
  }
}
}
