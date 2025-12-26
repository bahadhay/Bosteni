import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  
  fullName: string = 'Admin User';
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(private router: Router) {}

  updateName(form: any): void {
    if (form.invalid) {
      return;
    }

    alert(`Nom mis à jour avec succès : ${this.fullName}`);
  }

  updatePassword(form: any): void {
    if (form.invalid) {
      return;
    }

    const { newPassword, confirmPassword } = form.value;

    if (newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas !');
      return;
    }

    if (newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    alert('Mot de passe mis à jour avec succès !');
    form.reset();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}