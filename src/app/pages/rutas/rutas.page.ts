import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';

import { RutasRemoteService } from '../../services/rutas-remote.service';
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
  cargando: boolean = true;

  constructor(private rutasRemoteService: RutasRemoteService) {}

  ngOnInit() {
    this.cargarRutasRemotas();
  }

  cargarRutasRemotas() {
    this.cargando = true;
    this.rutasRemoteService.getRutas().subscribe({
      next: (data: Ruta[]) => {
        this.rutas = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al conectar con la API:', err);
        this.cargando = false;
      }
    });
  }
}