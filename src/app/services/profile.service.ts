// src/app/services/profile.service.ts
import { Injectable } from '@angular/core';
import { 
  Auth, 
  updateEmail, 
  updatePassword, 
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User
} from '@angular/fire/auth';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  
  constructor(private auth: Auth) {}

  // Obtenir l'utilisateur actuel
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // ✅ Modifier l'EMAIL (se met à jour automatiquement dans Firebase)
  updateUserEmail(newEmail: string): Observable<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Aucun utilisateur connecté');
    }
    return from(updateEmail(user, newEmail));
  }

  // ✅ Modifier le MOT DE PASSE (se met à jour automatiquement dans Firebase)
  updateUserPassword(newPassword: string): Observable<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Aucun utilisateur connecté');
    }
    return from(updatePassword(user, newPassword));
  }

  // ✅ Modifier le NOM D'AFFICHAGE (displayName)
  updateUserProfile(displayName: string): Observable<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Aucun utilisateur connecté');
    }
    return from(updateProfile(user, { displayName }));
  }

  // 🔐 Ré-authentifier l'utilisateur (requis pour modifier email/password)
  // Firebase exige une ré-authentification pour les opérations sensibles
  reauthenticate(currentPassword: string): Observable<any> {
    const user = this.auth.currentUser;
    if (!user || !user.email) {
      throw new Error('Aucun utilisateur connecté');
    }

    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    return from(reauthenticateWithCredential(user, credential));
  }

  // 🔄 Méthode combinée pour modifier l'email avec ré-authentification
  async changeEmail(currentPassword: string, newEmail: string): Promise<void> {
    try {
      // 1. Ré-authentifier d'abord
      await this.reauthenticate(currentPassword).toPromise();
      
      // 2. Puis modifier l'email
      await this.updateUserEmail(newEmail).toPromise();
      
      console.log('✅ Email modifié avec succès dans Firebase');
    } catch (error: any) {
      console.error('❌ Erreur modification email:', error);
      throw error;
    }
  }

  // 🔄 Méthode combinée pour modifier le mot de passe avec ré-authentification
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      // 1. Ré-authentifier d'abord
      await this.reauthenticate(currentPassword).toPromise();
      
      // 2. Puis modifier le mot de passe
      await this.updateUserPassword(newPassword).toPromise();
      
      console.log('✅ Mot de passe modifié avec succès dans Firebase');
    } catch (error: any) {
      console.error('❌ Erreur modification mot de passe:', error);
      throw error;
    }
  }
}