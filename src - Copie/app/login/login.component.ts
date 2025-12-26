import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class LoginComponent {

  showPassword = false;
  year = new Date().getFullYear();
  
  // Valeurs par défaut pour username et password
  defaultUsername = 'admin';
  defaultPassword = 'garden123';

  constructor(private router: Router) {}

  onSubmit(form: any) {
    if (form.invalid) {
      return;
    }

    const { username, password } = form.value;

    console.log('Username:', username);
    console.log('Password:', password);

    // Vérification des credentials
    if (username === this.defaultUsername && password === this.defaultPassword) {
      alert(`Login successful!\nWelcome to Eco Garden, ${username}!`);
      // Redirection vers le dashboard
      this.router.navigate(['/dashboard']);
    } else {
      alert('Invalid credentials!\nPlease check your username and password.');
    }
  }
}