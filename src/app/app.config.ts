import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { getAuth, provideAuth, browserLocalPersistence, indexedDBLocalPersistence, initializeAuth } from '@angular/fire/auth';
import { initializeApp, provideFirebaseApp, getApp } from '@angular/fire/app';
import { environment } from '../environments/environment.development';
import { getDatabase, provideDatabase } from '@angular/fire/database';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideDatabase(() => getDatabase()),

    provideAuth(() => {
      if (typeof window !== 'undefined') {
        // Côté client: initialiser avec persistance localStorage
        const app = getApp();
        return initializeAuth(app, {
          persistence: [browserLocalPersistence, indexedDBLocalPersistence]
        });
      } else {
        // Côté serveur: auth simple
        return getAuth();
      }
    })
  ]
};


