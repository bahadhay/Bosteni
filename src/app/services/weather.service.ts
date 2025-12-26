import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { WeatherData, ForecastDay } from '../models/weather.model';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  
  // ⚠️ REMPLACEZ PAR VOTRE CLÉ API
  private apiKey = '71c59012be9e3aff673c1f13b6e43c8c';
  private apiUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(private http: HttpClient) {}

  getCurrentWeather(city: string): Observable<WeatherData> {
    const url = `${this.apiUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric&lang=fr`;
    
    return this.http.get<any>(url).pipe(
      map(data => {
        console.log('Météo reçue:', data); // Pour déboguer
        return {
          city: data.name,
          country: data.sys.country,
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].description,
          humidity: data.main.humidity,
          rainChance: data.clouds?.all || 0,
          icon: this.getWeatherIcon(data.weather[0].main)
        };
      }),
      catchError(error => {
        console.error('Erreur API:', error); // Pour déboguer
        if (error.status === 404) {
          return throwError(() => new Error('Ville non trouvée'));
        }
        if (error.status === 401) {
          return throwError(() => new Error('Clé API invalide'));
        }
        return throwError(() => new Error('Erreur lors de la récupération des données météo'));
      })
    );
  }

  getForecast(city: string): Observable<ForecastDay[]> {
    const url = `${this.apiUrl}/forecast?q=${city}&appid=${this.apiKey}&units=metric&lang=fr`;
    
    return this.http.get<any>(url).pipe(
      map(data => {
        console.log('Prévisions reçues:', data); // Pour déboguer
        const dailyData = this.groupByDay(data.list);
        return dailyData.slice(0, 5).map((day: any) => ({
          date: new Date(day.dt * 1000).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long' 
          }),
          dayName: new Date(day.dt * 1000).toLocaleDateString('fr-FR', { 
            weekday: 'long' 
          }),
          icon: this.getWeatherIcon(day.weather[0].main),
          condition: day.weather[0].description,
          tempMax: Math.round(day.main.temp_max),
          tempMin: Math.round(day.main.temp_min),
          rainChance: day.pop ? Math.round(day.pop * 100) : 0
        }));
      }),
      catchError(error => {
        console.error('Erreur prévisions:', error);
        return throwError(() => new Error('Erreur lors de la récupération des prévisions'));
      })
    );
  }

  private groupByDay(list: any[]): any[] {
    const grouped: { [key: string]: any } = {};
    
    list.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!grouped[date]) {
        grouped[date] = item;
      }
    });
    
    return Object.values(grouped);
  }

  private getWeatherIcon(condition: string): string {
    const icons: { [key: string]: string } = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };
    
    return icons[condition] || '☁️';
  }
}