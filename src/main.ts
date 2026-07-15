import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { defineCustomElements as jeepSqliteElements } from 'jeep-sqlite/loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Registra el web component <jeep-sqlite>, usado como almacén de SQLite
// cuando la app corre en navegador (modo de pruebas / ng serve).
// En Android/iOS el plugin usa SQLite nativo y esto no tiene efecto.
jeepSqliteElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // Parte 2: cliente HTTP usado por RutasRemoteService para consumir la API REST.
    provideHttpClient(withFetch()),
  ],
});
