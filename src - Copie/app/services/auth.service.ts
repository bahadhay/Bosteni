// import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';
// import { HttpClient } from '@angular/common/http';
// import { Observable, BehaviorSubject } from 'rxjs';
// import { tap } from 'rxjs/operators';

// export interface User {
//   id: number;
//   username: string;
//   email: string;
//   full_name: string;
// }

// export interface LoginResponse {
//   success: boolean;
//   message: string;
//   user?: User;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
  
//   private apiUrl = 'http://localhost/smart-garden-api/api';
//   private currentUserSubject = new BehaviorSubject<User | null>(null);
//   public currentUser$ = this.currentUserSubject.asObservable();
//   private isBrowser: boolean;

//   constructor(
//     private http: HttpClient,
//     @Inject(PLATFORM_ID) platformId: Object
//   ) {
//     // Vérifier si on est dans le navigateur
//     this.isBrowser = isPlatformBrowser(platformId);
    
//     // Charger l'utilisateur depuis localStorage seulement si on est dans le navigateur
//     if (this.isBrowser) {
//       const storedUser = localStorage.getItem('currentUser');
//       if (storedUser) {
//         this.currentUserSubject.next(JSON.parse(storedUser));
//       }
//     }
//   }

//   login(username: string, password: string): Observable<LoginResponse> {
//     return this.http.post<LoginResponse>(`${this.apiUrl}/login.php`, {
//       username,
//       password
//     }).pipe(
//       tap(response => {
//         if (response.success && response.user && this.isBrowser) {
//           // Sauvegarder l'utilisateur seulement si on est dans le navigateur
//           localStorage.setItem('currentUser', JSON.stringify(response.user));
//           this.currentUserSubject.next(response.user);
//         }
//       })
//     );
//   }

//   register(username: string, password: string, email: string, fullName: string): Observable<any> {
//     return this.http.post(`${this.apiUrl}/register.php`, {
//       username,
//       password,
//       email,
//       full_name: fullName
//     });
//   }

//   updateProfile(userId: number, data: any): Observable<any> {
//     return this.http.post(`${this.apiUrl}/update_profile.php`, {
//       id: userId,
//       ...data
//     });
//   }

//   logout(): void {
//     if (this.isBrowser) {
//       localStorage.removeItem('currentUser');
//     }
//     this.currentUserSubject.next(null);
//   }

//   getCurrentUser(): User | null {
//     return this.currentUserSubject.value;
//   }

//   isLoggedIn(): boolean {
//     return this.currentUserSubject.value !== null;
//   }
// }