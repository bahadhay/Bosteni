import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GardenDataService } from '../../services/garden-data.service';
import { SensorData, WaterLevel, ControlDevice } from '../../models/garden.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  sensorData: SensorData = {
    temperature: 0,
    airHumidity: 0,
    soilHumidity: 0,
    rain: false
  };

  waterLevel: WaterLevel = { percentage: 0, label: '' };
  showNotification = false;
  isAIMode = false;

  // ========== PROPRIÉTÉS SÉPARÉES ==========
  pompe: {status: 'ON' | 'OFF'} = {status: 'OFF'};
  bache: {status: 'OUVERTE' | 'FERMEE'} = {status: 'FERMEE'};
  
  private waterLevelSubscription?: Subscription;
  private aiModeSubscription?: Subscription;
  private hasShownAlert = false;

  constructor(
    private gardenService: GardenDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Capteurs
    this.gardenService.getSensorData().subscribe(data => {
      this.sensorData = data;
    });

    // Niveau d'eau
    this.waterLevelSubscription = this.gardenService.getWaterLevel().subscribe(level => {
      this.waterLevel = level;

      if (level.percentage <= 20 && !this.hasShownAlert) {
        this.showWaterLevelAlert(level.percentage);
        this.hasShownAlert = true;
      }

      if (level.percentage > 20) {
        this.hasShownAlert = false;
      }
    });

    // ========== POMPE - Souscription séparée ==========
    this.gardenService.getPompe().subscribe(pompe => {
      console.log('📥 [COMPONENT] Nouvelle valeur POMPE reçue:', pompe.status);
      this.pompe = pompe;
    });

    // ========== BÂCHE - Souscription séparée ==========
    this.gardenService.getBache().subscribe(bache => {
      console.log('📥 [COMPONENT] Nouvelle valeur BÂCHE reçue:', bache.status);
      this.bache = bache;
    });

    // Mode IA
    this.aiModeSubscription = this.gardenService.getAIMode().subscribe(isAI => {
      this.isAIMode = isAI;
    });
  }

  ngOnDestroy(): void {
    if (this.waterLevelSubscription) {
      this.waterLevelSubscription.unsubscribe();
    }
    if (this.aiModeSubscription) {
      this.aiModeSubscription.unsubscribe();
    }
  }

  toggleAIMode(): void {
    this.gardenService.toggleAIMode();
   
  }

  showWaterLevelAlert(percentage: number): void {
    this.showNotification = true;
  }

  dismissAlert(): void {
    this.showNotification = false;
  }

  refillWater(): void {
    this.gardenService.refillWaterTank();
    this.showNotification = false;
    alert('✅ La citerne a été remplie avec succès !');
  }

  // testWaterUsage(): void {
  //   this.gardenService.simulateWaterUsage();
  // }

  

  // ========== POMPE - Toggle indépendant ==========
  togglePompe(event: Event): void {
    console.log('🖱️ [COMPONENT] Click sur bouton POMPE');
    event.stopPropagation();
    event.preventDefault();

    if (this.isAIMode) {
      alert('⚠️ Mode IA activé ! Passez en mode Manuel pour contrôler la pompe.');
      return;
    }

    console.log('📤 [COMPONENT] Appel togglePompe() dans service');
    this.gardenService.togglePompe();
  }

  // ========== BÂCHE - Toggle indépendant ==========
  toggleBache(event: Event): void {
    console.log('🖱️ [COMPONENT] Click sur bouton BÂCHE');
    event.stopPropagation();
    event.preventDefault();

    if (this.isAIMode) {
      alert('⚠️ Mode IA activé ! Passez en mode Manuel pour contrôler la bâche.');
      return;
    }

    console.log('📤 [COMPONENT] Appel toggleBache() dans service');
    this.gardenService.toggleBache();
  }

  getSoilStatus(): string {
    return this.sensorData.soilHumidity >= 40 ? 'Optimal' : 'Faible';
  }

  isOptimal(): boolean {
    return this.sensorData.soilHumidity >= 40;
  }

  // ========== AFFICHAGE POMPE ==========
  get pompeStatusText(): string {
    return this.pompe.status === 'ON' ? 'Active' : 'Inactive';
  }

  get pompeButtonText(): string {
    return this.pompe.status === 'ON' ? 'Désactiver' : 'Activer';
  }

  get pompeIsActive(): boolean {
    return this.pompe.status === 'ON';
  }

  // ========== AFFICHAGE BÂCHE ==========
  get bacheStatusText(): string {
    return this.bache.status === 'OUVERTE' ? 'Ouverte' : 'Fermée';
  }

  get bacheButtonText(): string {
    return this.bache.status === 'OUVERTE' ? 'Fermer' : 'Ouvrir';
  }

  get bacheIsActive(): boolean {
    return this.bache.status === 'OUVERTE';
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.router.navigate(['/login']);
  }

  showWeather(): void {
    this.router.navigate(['/weather']);
  }

  // showHistory(): void {
  //   alert('Fonctionnalité en cours de développement...');
  // }
}