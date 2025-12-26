import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WeatherService } from '../../services/weather.service';
import { WeatherData, ForecastDay, WeatherRecommendation } from '../../models/weather.model';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css']
})
export class WeatherComponent {
  
  searchCity: string = '';
  currentWeather: WeatherData | null = null;
  forecast: ForecastDay[] = [];
  errorMessage: string = '';
  isLoading: boolean = false;
  recommendations: WeatherRecommendation[] = [];

  constructor(
    private weatherService: WeatherService,
    private router: Router
  ) {}

  searchWeather(): void {
    const city = this.searchCity.trim();
    
    if (!city) {
      this.errorMessage = 'Veuillez entrer une ville';
      return;
    }

    console.log('Recherche de:', city); // Pour déboguer

    this.isLoading = true;
    this.errorMessage = '';
    this.currentWeather = null;
    this.forecast = [];
    this.recommendations = [];

    // Récupérer la météo actuelle
    this.weatherService.getCurrentWeather(city).subscribe({
      next: (data) => {
        console.log('Données météo:', data); // Pour déboguer
        this.currentWeather = data;
        this.generateRecommendations(data);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error); // Pour déboguer
        if (error.message === 'Ville non trouvée') {
          this.errorMessage = `La ville "${city}" n'existe pas. Veuillez vérifier l'orthographe.`;
        } else if (error.message === 'Clé API invalide') {
          this.errorMessage = 'Erreur de configuration API. Veuillez vérifier la clé API.';
        } else {
          this.errorMessage = 'Erreur lors de la récupération des données météo';
        }
        this.isLoading = false;
      }
    });

    // Récupérer les prévisions
    this.weatherService.getForecast(city).subscribe({
      next: (data) => {
        console.log('Prévisions:', data); // Pour déboguer
        this.forecast = data;
      },
      error: (error) => {
        console.error('Erreur prévisions:', error);
        // Ne pas afficher d'erreur pour les prévisions, juste les ignorer
      }
    });
  }

  generateRecommendations(weather: WeatherData): void {
    this.recommendations = [];

    // Recommandation basée sur la température
    if (weather.temperature > 25) {
      this.recommendations.push({
        id: 1,
        text: `Avec des températures de ${weather.temperature}°C, l'arrosage doit être effectué deux fois par semaine, de préférence tôt le matin ou en fin d'après-midi pour limiter l'évaporation.`,
        link: ''
      });
    } else {
      this.recommendations.push({
        id: 1,
        text: `Avec des températures modérées de ${weather.temperature}°C, un arrosage hebdomadaire est suffisant. Privilégiez le matin pour une meilleure absorption.`,
        link: ''
      });
    }

    // Recommandation basée sur l'humidité
    if (weather.humidity > 70) {
      this.recommendations.push({
        id: 2,
        text: `Le paillage du sol est recommandé pour conserver l'humidité de ${weather.humidity}% et réduire l'évaporation, surtout lors de journées ensoleillées.`,
        link: ''
      });
    } else {
      this.recommendations.push({
        id: 2,
        text: `Avec une humidité de ${weather.humidity}%, augmentez la fréquence d'arrosage et utilisez du paillage pour maintenir l'humidité du sol.`,
        link: ''
      });
    }

    // Recommandation basée sur la pluie
    if (weather.rainChance > 60) {
      this.recommendations.push({
        id: 3,
        text: `Évitez d'arroser le sol car la pluie est prévue. L'humidité prolongée sur les feuilles peut favoriser le développement de maladies fongiques.`,
        link: ''
      });
    } else {
      this.recommendations.push({
        id: 3,
        text: `Pas de pluie prévue. Maintenez un arrosage régulier et surveillez l'humidité du sol pour éviter le stress hydrique de vos plantes.`,
        link: ''
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}