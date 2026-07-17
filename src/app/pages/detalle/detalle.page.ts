import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton
} from '@ionic/angular/standalone';

import { Ruta } from '../../models/ruta.model';
import { RutasService } from '../../services/rutas.service';

@Component({
  selector: 'app-detalle',
  templateUrl: './detalle.page.html',
  styleUrls: ['./detalle.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton
  ]
})
export class DetallePage implements OnInit {
  ruta?: Ruta;
  cargando = true;
  private id!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService
  ) { }

  async ngOnInit(): Promise<void> {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    await this.cargarRuta();
  }

  async cargarRuta(): Promise<void> {
    this.cargando = true;
    try {
      this.ruta = await this.rutasService.findById(this.id);
    } catch (error) {
      console.error('Error al consultar la ruta por id en SQLite:', error);
    } finally {
      this.cargando = false;
    }
  }

  editarRuta(): void {
    // Navega al formulario en modo edición, pasando el id por queryParams
    this.router.navigate(['/formulario'], { queryParams: { id: this.id } });
  }

  async eliminarRuta(): Promise<void> {
    const confirmar = confirm('¿Desea eliminar esta ruta?');
    if (!confirmar) {
      return;
    }
    try {
      await this.rutasService.delete(this.id);
      alert('Ruta eliminada correctamente.');
      this.router.navigate(['/rutas']);
    } catch (error) {
      console.error('Error al eliminar la ruta en SQLite:', error);
      alert('Ocurrió un error al eliminar la ruta.');
    }
  }

  volver(): void {
    window.history.back();
  }
}
