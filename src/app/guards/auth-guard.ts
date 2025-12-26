// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    // Check if we're in the browser before accessing localStorage
    if (typeof window === 'undefined') {
      // Server-side: deny access during SSR/prerendering
      console.log('⚙️ [AUTH-GUARD] Server-side rendering - redirecting to login');
      return this.router.createUrlTree(['/login']);
    }

    // Vérifier localStorage d'abord (plus rapide)
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('userEmail');

    console.log('🔐 [AUTH-GUARD] Vérification localStorage:', { isLoggedIn, userEmail });

    if (isLoggedIn && userEmail) {
      console.log('✅ [AUTH-GUARD] Utilisateur connecté via localStorage:', userEmail);
      return true;
    } else {
      console.log('❌ [AUTH-GUARD] Accès refusé - redirection vers login');
      return this.router.createUrlTree(['/login']);
    }
  }
}