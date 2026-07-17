import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { defineCustomElements as jeepSqliteElements } from 'jeep-sqlite/loader';
import { Capacitor } from '@capacitor/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

async function iniciarApp() {
  if (Capacitor.getPlatform() === 'web') {
    // 1. Cargar Custom Elements de Stencil
    await jeepSqliteElements(window);

    // 2. Inyectar <jeep-sqlite> en el DOM si no existe
    if (!document.querySelector('jeep-sqlite')) {
      const jeepEl = document.createElement('jeep-sqlite');
      document.body.appendChild(jeepEl);
    }
  }

  bootstrapApplication(AppComponent, {
    providers: [
      { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
      provideIonicAngular(),
      provideRouter(routes, withPreloading(PreloadAllModules)),
      provideHttpClient(withFetch()),
    ],
  }).catch((err) => console.error(err));
}

iniciarApp();