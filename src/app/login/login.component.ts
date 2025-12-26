// src/app/login/login.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {

  showPassword = false;
  showForgotPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Login fields
  email = '';
  password = '';
  
  // Forgot password field
  resetEmail = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onSubmit(form: any) {
    if (form.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Connexion avec Firebase
    this.authService.login(this.email, this.password).subscribe({
      next: (userCredential) => {
        console.log('✅ Connexion réussie:', userCredential.user.email);
        this.isLoading = false;

        // Sauvegarder l'info de connexion (browser only)
        if (typeof window !== 'undefined') {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userEmail', userCredential.user.email || '');
        }

        // Redirection vers le dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Erreur de connexion:', error);
        
        // Afficher un message d'erreur compréhensible
        switch (error.code) {
          case 'auth/user-not-found':
            this.errorMessage = 'Aucun compte trouvé avec cet email';
            break;
          case 'auth/wrong-password':
            this.errorMessage = 'Mot de passe incorrect';
            break;
          case 'auth/invalid-email':
            this.errorMessage = 'Format d\'email invalide';
            break;
          case 'auth/user-disabled':
            this.errorMessage = 'Ce compte a été désactivé';
            break;
          case 'auth/invalid-credential':
            this.errorMessage = 'Email ou mot de passe incorrect';
            break;
          default:
            this.errorMessage = 'Erreur de connexion. Veuillez réessayer.';
        }
      }
    });
  }

  onForgotPassword(form: any) {
    if (form.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Réinitialisation du mot de passe via Firebase
    this.authService.resetPassword(this.resetEmail).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = `Un email de réinitialisation a été envoyé à ${this.resetEmail}. Vérifiez votre boîte de réception.`;
        
        // Retour au formulaire de connexion après 5 secondes
        setTimeout(() => {
          this.toggleForgotPassword();
          this.successMessage = '';
        }, 5000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Erreur de réinitialisation:', error);
        
        switch (error.code) {
          case 'auth/user-not-found':
            this.errorMessage = 'Aucun compte trouvé avec cet email';
            break;
          case 'auth/invalid-email':
            this.errorMessage = 'Format d\'email invalide';
            break;
          default:
            this.errorMessage = 'Erreur lors de l\'envoi de l\'email. Réessayez.';
        }
      }
    });
  }

  toggleForgotPassword() {
    this.showForgotPassword = !this.showForgotPassword;
    this.errorMessage = '';
    this.successMessage = '';
    this.email = '';
    this.password = '';
    this.resetEmail = '';
  }
}