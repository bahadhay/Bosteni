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
  devices: ControlDevice[] = [];
  showNotification = false;
  isAIMode = false;
  
  private waterLevelSubscription?: Subscription;
  private aiModeSubscription?: Subscription;
  private hasShownAlert = false;

  constructor(
    private gardenService: GardenDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.gardenService.getSensorData().subscribe(data => {
      this.sensorData = data;
    });

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

    this.gardenService.getDevices().subscribe(devices => {
      this.devices = devices;
    });

    // Surveiller le mode IA
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

  testWaterUsage(): void {
    this.gardenService.simulateWaterUsage();
  }

  

  toggleDevice(deviceId: string): void {
    if (this.isAIMode) {
      alert('⚠️ Impossible en mode IA ! Passez en mode Manuel pour contrôler manuellement.');
      return;
    }
    this.gardenService.toggleDevice(deviceId);
  }

  getSoilStatus(): string {
    return this.sensorData.soilHumidity >= 40 ? 'Optimal' : 'Faible';
  }

  isOptimal(): boolean {
    return this.sensorData.soilHumidity >= 40;
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Active',
      'inactive': 'Inactive',
      'fermée': 'Fermée'
    };
    return statusMap[status] || status;
  }

  getButtonText(status: string): string {
    return status === 'active' ? 'Désactiver' : 'Activer';
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

  showHistory(): void {
    alert('Fonctionnalité en cours de développement...');
  }
}