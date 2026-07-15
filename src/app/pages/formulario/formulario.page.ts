import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent
} from '@ionic/angular/standalone';

import { Ruta } from '../../models/ruta.model';
import { RutasService } from '../../services/rutas.service';

@Component({
  selector: 'app-formulario',
  templateUrl: './formulario.page.html',
  styleUrls: ['./formulario.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonInput,
    IonItem,
    IonLabel,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardContent
  ]
})
export class FormularioPage implements OnInit {

  ruta: Ruta = {
    nombre: '',
    origen: '',
    destino: '',
    horario: '',
    tarifa: 0,
    conductor: '',
    bus: '',
    estado: 'Activa'
  };

  /** true cuando el formulario se abrió para editar una ruta existente */
  modoEdicion = false;
  private idEdicion?: number;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private rutasService: RutasService
  ) {}

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.queryParamMap.get('id');
    if (idParam) {
      this.modoEdicion = true;
      this.idEdicion = Number(idParam);
      const existente = await this.rutasService.findById(this.idEdicion);
      if (existente) {
        this.ruta = { ...existente };
      }
    }
  }

  async guardarRuta(): Promise<void> {
    if (
      !this.ruta.nombre ||
      !this.ruta.origen ||
      !this.ruta.destino ||
      !this.ruta.horario
    ) {
      alert('Complete todos los campos obligatorios.');
      return;
    }

    try {
      if (this.modoEdicion && this.idEdicion) {
        await this.rutasService.update(this.idEdicion, this.ruta);
        alert('La ruta se actualizó correctamente.');
      } else {
        await this.rutasService.create(this.ruta);
        alert('La ruta se registró correctamente.');
      }
      this.router.navigate(['/rutas']);
    } catch (error) {
      console.error('Error al guardar la ruta en SQLite:', error);
      alert('Ocurrió un error al guardar la ruta.');
    }
  }

  cancelar(): void {
    this.router.navigate(['/rutas']);
  }

}
