// src/app/components/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  Auth, 
  updatePassword, 
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut
} from '@angular/fire/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  
  newEmail: string = '';
  currentPasswordForEmail: string = '';
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  
  // État de chargement
  isLoadingEmail: boolean = false;
  isLoadingPassword: boolean = false;
  
  // Messages
  successMessage: string = '';
  errorMessage: string = '';
  
  // Email actuel pour affichage
  currentEmail: string = '';

  constructor(
    private router: Router,
    private auth: Auth
  ) {}

  ngOnInit() {
    // Charger l'email actuel depuis Firebase
    const user = this.auth.currentUser;
    if (user && user.email) {
      this.currentEmail = user.email;
    } else {
      // Si pas d'utilisateur connecté, rediriger vers login
      this.router.navigate(['/login']);
    }
  }

  // ✅ MODIFIER L'EMAIL dans Firebase
  async updateEmailAddress(form: any): Promise<void> {
    console.log('🚀 Début de la modification d\'email');
    
    if (form.invalid) {
      this.errorMessage = '❌ Veuillez remplir tous les champs correctement';
      console.log('❌ Formulaire invalide');
      return;
    }

    const user = this.auth.currentUser;
    if (!user || !user.email) {
      this.errorMessage = '❌ Aucun utilisateur connecté';
      console.log('❌ Pas d\'utilisateur connecté');
      return;
    }

    if (!this.currentPasswordForEmail) {
      this.errorMessage = '❌ Veuillez entrer votre mot de passe actuel';
      return;
    }

    // Vérifier que le nouvel email est différent
    if (this.newEmail === user.email) {
      this.errorMessage = '❌ Le nouvel email est identique à l\'ancien';
      console.log('❌ Email identique');
      return;
    }

    this.isLoadingEmail = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      console.log('📧 Email actuel:', user.email);
      console.log('📧 Nouvel email:', this.newEmail);
      console.log('🔐 Étape 1: Ré-authentification...');
      
      // 1. Ré-authentifier l'utilisateur pour des raisons de sécurité
      const credential = EmailAuthProvider.credential(
        user.email,
        this.currentPasswordForEmail
      );
      await reauthenticateWithCredential(user, credential);
      console.log('✅ Ré-authentification réussie');

      // 2. Mettre à jour l'email dans Firebase
      console.log('📧 Étape 2: Mise à jour de l\'email...');
      await updateEmail(user, this.newEmail);
      console.log('✅ Email modifié dans Firebase avec succès!');
      
      // 3. Afficher message de succès
      this.successMessage = '✅ Email mis à jour ! Redirection vers la page de connexion...';
      
      // 4. Déconnecter l'utilisateur
      console.log('🚪 Étape 3: Déconnexion...');
      await signOut(this.auth);
      console.log('✅ Déconnexion réussie');

      // 5. Rediriger vers login après 1 seconde
      setTimeout(() => {
        console.log('➡️ Redirection vers /login');
        this.router.navigate(['/login']);
      }, 1000);

    } catch (error: any) {
      console.error('❌ ERREUR complète:', error);
      console.error('❌ Code d\'erreur:', error.code);
      console.error('❌ Message d\'erreur:', error.message);
      
      this.isLoadingEmail = false;
      
      // Gérer les erreurs spécifiques de Firebase
      switch (error.code) {
        case 'auth/wrong-password':
          this.errorMessage = '❌ Mot de passe incorrect';
          break;
        case 'auth/invalid-email':
          this.errorMessage = '❌ Format d\'email invalide';
          break;
        case 'auth/email-already-in-use':
          this.errorMessage = '❌ Cet email est déjà utilisé par un autre compte';
          break;
        case 'auth/requires-recent-login':
          this.errorMessage = '❌ Session expirée. Reconnectez-vous et réessayez.';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
          break;
        case 'auth/invalid-credential':
          this.errorMessage = '❌ Mot de passe incorrect. Vérifiez votre mot de passe.';
          break;
        case 'auth/network-request-failed':
          this.errorMessage = '❌ Problème de connexion. Vérifiez votre internet.';
          break;
        default:
          this.errorMessage = `❌ Erreur: ${error.message || 'Une erreur est survenue'}`;
      }
    }
  }

  // ✅ MODIFIER LE MOT DE PASSE dans Firebase
  async updatePassword(form: any): Promise<void> {
    if (form.invalid) {
      return;
    }

    const { newPassword, confirmPassword } = form.value;

    // Validation des mots de passe
    if (newPassword !== confirmPassword) {
      this.errorMessage = '❌ Les mots de passe ne correspondent pas !';
      return;
    }

    if (newPassword.length < 6) {
      this.errorMessage = '❌ Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    const user = this.auth.currentUser;
    if (!user) {
      this.errorMessage = '❌ Aucun utilisateur connecté';
      return;
    }

    this.isLoadingPassword = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Mettre à jour le mot de passe dans Firebase
      await updatePassword(user, newPassword);

      this.successMessage = '✅ Mot de passe mis à jour avec succès dans Firebase !';
      console.log('✅ Mot de passe modifié dans Firebase');

      // Réinitialiser le formulaire
      form.reset();

      // Effacer le message après 3 secondes
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);

    } catch (error: any) {
      console.error('❌ Erreur modification mot de passe:', error);
      
      // Gérer les erreurs spécifiques de Firebase
      switch (error.code) {
        case 'auth/requires-recent-login':
          this.errorMessage = '❌ Pour des raisons de sécurité, veuillez vous reconnecter puis réessayer';
          // Rediriger vers la page de login après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
          break;
        case 'auth/weak-password':
          this.errorMessage = '❌ Le mot de passe est trop faible';
          break;
        default:
          this.errorMessage = '❌ Erreur lors de la modification du mot de passe';
      }
    } finally {
      this.isLoadingPassword = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}