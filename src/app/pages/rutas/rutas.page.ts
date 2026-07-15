import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon
} from '@ionic/angular/standalone';

import { Ruta } from '../../models/ruta.model';
import { RutasService } from '../../services/rutas.service';

@Component({
  selector: 'app-rutas',
  templateUrl: './rutas.page.html',
  styleUrls: ['./rutas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon
  ]
})
export class RutasPage implements OnInit {
  rutas: Ruta[] = [];
  cargando = true;

  constructor(private rutasService: RutasService) { }

  async ngOnInit(): Promise<void> {
    await this.cargarRutas();
  }

  /** Se ejecuta cada vez que se vuelve a esta página (ej. tras guardar o eliminar). */
  async ionViewWillEnter(): Promise<void> {
    await this.cargarRutas();
  }

  async cargarRutas(): Promise<void> {
    this.cargando = true;
    try {
      this.rutas = await this.rutasService.findAll();
    } catch (error) {
      console.error('Error al cargar rutas desde SQLite:', error);
    } finally {
      this.cargando = false;
    }
  }
}
