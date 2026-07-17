import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from './database/database.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // <-- Importante para Web Components de Stencil
})
export class AppComponent implements OnInit {
  constructor(private dbService: DatabaseService) {}

  async ngOnInit() {
    // Inicialización al cargar el componente principal
    try {
      await this.dbService.initDatabase();
    } catch (e) {
      console.error('Error al inicializar la base de datos local:', e);
    }
  }
}