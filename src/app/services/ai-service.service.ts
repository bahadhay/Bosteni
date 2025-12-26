// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Observable } from 'rxjs';

// export interface WeatherPrediction {
//   success: boolean;
//   predictions: {
//     temperature: number;
//     will_rain: boolean;
//     rain_probability: number;
//     humidity_air: number;
//   };
//   timestamp: string;
// }

// export interface IrrigationDecision {
//   success: boolean;
//   decision: {
//     should_irrigate: boolean;
//     confidence: number;
//     action: string;
//     message: string;
//     priority: string;
//   };
//   conditions: {
//     temperature: number;
//     soil_humidity: number;
//     water_level: number;
//     evaporation_rate: number;
//   };
//   timestamp: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class AIService {
//   // Changez cette URL selon votre configuration
// private apiUrl = 'http://192.168.1.15:5000';
//   constructor(private http: HttpClient) {}

//   /**
//    * Obtenir la prédiction météo pour demain
//    */
//   getWeatherPrediction(
//     temperature: number,
//     humidityAir: number,
//     dayOfYear: number,
//     month: number,
//     rainAmount: number
//   ): Observable<WeatherPrediction> {
//     const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
//     const body = {
//       temperature,
//       humidity_air: humidityAir,
//       day_of_year: dayOfYear,
//       month,
//       rain_amount: rainAmount
//     };

//     return this.http.post<WeatherPrediction>(
//       `${this.apiUrl}/predict/weather`,
//       body,
//       { headers }
//     );
//   }

//   /**
//    * Obtenir la décision d'arrosage intelligente
//    */
//   getIrrigationDecision(
//     temperature: number,
//     humidityAir: number,
//     soilHumidity: number,
//     waterLevel: number,
//     isRaining: boolean,
//     month: number
//   ): Observable<IrrigationDecision> {
//     const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
//     const body = {
//       temperature,
//       humidity_air: humidityAir,
//       soil_humidity: soilHumidity,
//       water_level: waterLevel,
//       is_raining: isRaining ? 1 : 0,
//       month
//     };

//     return this.http.post<IrrigationDecision>(
//       `${this.apiUrl}/predict/irrigation`,
//       body,
//       { headers }
//     );
//   }

//   /**
//    * Vérifier si l'API est en ligne
//    */
//   checkAPIHealth(): Observable<{status: string, models_loaded: boolean, timestamp: string}> {
//     return this.http.get<{status: string, models_loaded: boolean, timestamp: string}>(
//       `${this.apiUrl}/health`
//     );
//   }

//   /**
//    * Changer l'URL de l'API (utile pour configuration)
//    */
//   setApiUrl(url: string): void {
//     this.apiUrl = url;
//   }

//   /**
//    * Obtenir l'URL actuelle de l'API
//    */
//   getApiUrl(): string {
//     return this.apiUrl;
//   }
// }