import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { DatabaseService } from './database/database.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private databaseService: DatabaseService) {}

  async ngOnInit(): Promise<void> {
    try {
      // Inicializa la base de datos SQLite (tabla + datos semilla) al arrancar la app
      await this.databaseService.initDatabase();
    } catch (error) {
      console.error('No se pudo inicializar la base de datos local:', error);
    }
  }
}
