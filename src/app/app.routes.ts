import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { WeatherComponent } from './components/weather/weather.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent,    canActivate: [AuthGuard]  // ✅ Protection
 },
  { path: 'profile', component: ProfileComponent,    canActivate: [AuthGuard]      // ✅ Protégée
 },
  { path: 'weather', component: WeatherComponent },
  { path: '**', redirectTo: '/login' }
];