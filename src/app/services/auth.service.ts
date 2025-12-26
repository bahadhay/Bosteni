// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, sendPasswordResetEmail, User } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private auth: Auth) {}

  // Connexion avec email et mot de passe
  login(email: string, password: string): Observable<any> {
    console.log('🔐 [AUTH-SERVICE] Tentative de connexion...');
    return from(
      signInWithEmailAndPassword(this.auth, email, password)
        .then((userCredential) => {
          console.log('✅ [AUTH-SERVICE] Connexion réussie:', userCredential.user.email);
          return userCredential;
        })
    );
  }

  // Réinitialisation du mot de passe par email
  resetPassword(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // Déconnexion
  logout(): Observable<void> {
    return from(this.auth.signOut());
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return this.auth.currentUser !== null;
  }
}

export { Auth };
