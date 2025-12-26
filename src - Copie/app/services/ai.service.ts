// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// export interface AIPrediction {
//   needWatering: boolean;
//   confidence: number;
//   recommendation: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class AIService {

//   private apiUrl = 'http://127.0.0.1:5000';  // URL de votre API Flask

//   constructor(private http: HttpClient) {}

//   predictWatering(
//     temperature: number,
//     airHumidity: number,
//     soilHumidity: number,
//     rain: boolean,
//     season: number
//   ): Observable<AIPrediction> {
//     const data = {
//       temperature,
//       airHumidity,
//       soilHumidity,
//       rain,
//       season
//     };

//     return this.http.post<AIPrediction>(`${this.apiUrl}/predict`, data);
//   }

//   checkHealth(): Observable<any> {
//     return this.http.get(`${this.apiUrl}/health`);
//   }
// }