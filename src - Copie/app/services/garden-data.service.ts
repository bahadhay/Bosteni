import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { SensorData, WaterLevel, ControlDevice } from '../models/garden.model';

@Injectable({
  providedIn: 'root'
})
export class GardenDataService {
  
  private sensorData = new BehaviorSubject<SensorData>({
    temperature: 22.0,
    airHumidity: 65,
    soilHumidity: 45,
    rain: false
  });

  private waterLevel = new BehaviorSubject<WaterLevel>({
    percentage: 80,
    label: 'Citerne'
  });

  private devices = new BehaviorSubject<ControlDevice[]>([
    {
      id: '1',
      name: 'Pompe à eau',
      description: 'Arrosage automatique des plantes',
      icon: '💧',
      status: 'inactive'
    },
    {
      id: '2',
      name: 'Bâche de protection',
      description: 'Protection et récupération d\'eau de pluie',
      icon: '☂️',
      status: 'fermée'
    }
  ]);

  // Mode IA/Manuel
  private isAIMode = new BehaviorSubject<boolean>(false);
  
  private alertShown = false;
  private aiInterval: any;

  constructor() {
    // Démarrer la surveillance en mode IA
    this.isAIMode.subscribe(isAI => {
      if (isAI) {
        this.startAIControl();
      } else {
        this.stopAIControl();
      }
    });
  }

  getSensorData(): Observable<SensorData> {
    return this.sensorData.asObservable();
  }

  getWaterLevel(): Observable<WaterLevel> {
    return this.waterLevel.asObservable();
  }

  getDevices(): Observable<ControlDevice[]> {
    return this.devices.asObservable();
  }

  getAIMode(): Observable<boolean> {
    return this.isAIMode.asObservable();
  }

  toggleAIMode(): void {
    this.isAIMode.next(!this.isAIMode.value);
  }

  isAIModeActive(): boolean {
    return this.isAIMode.value;
  }

  // Contrôle manuel - seulement si mode manuel
  toggleDevice(deviceId: string): void {
    if (this.isAIMode.value) {
      // En mode IA, l'utilisateur ne peut pas contrôler
      return;
    }

    const currentDevices = this.devices.value;
    const updatedDevices = currentDevices.map(device => {
      if (device.id === deviceId) {
        const newStatus = device.status === 'active' ? ('inactive' as const) : ('active' as const);
        return { ...device, status: newStatus };
      }
      return device;
    });
    this.devices.next(updatedDevices);
  }

  // Démarrer le contrôle IA automatique
  private startAIControl(): void {
    console.log('🤖 Mode IA activé - Contrôle automatique démarré');
    
    // Vérifier toutes les 5 secondes
    this.aiInterval = setInterval(() => {
      this.aiDecisionMaking();
    }, 5000);

    // Exécuter immédiatement aussi
    this.aiDecisionMaking();
  }

  // Arrêter le contrôle IA
  private stopAIControl(): void {
    console.log('👤 Mode Manuel activé - Contrôle utilisateur');
    
    if (this.aiInterval) {
      clearInterval(this.aiInterval);
    }
  }

  // Logique de décision de l'IA
  private aiDecisionMaking(): void {
    const sensors = this.sensorData.value;
    const currentDevices = this.devices.value;

    console.log('🤖 IA analyse les données...');
    console.log('Pluie:', sensors.rain, '| Humidité sol:', sensors.soilHumidity + '%');

    let updatedDevices = [...currentDevices];

    // LOGIQUE BÂCHE
    const coverDevice = updatedDevices.find(d => d.id === '2');
    if (coverDevice) {
      if (sensors.rain) {
        // S'il pleut → Ouvrir la bâche (pour récupérer l'eau)
        if (coverDevice.status !== 'active') {
          coverDevice.status = 'active' as const;
          console.log('🌧️ IA: Pluie détectée → Bâche OUVERTE pour récupérer l\'eau');
        }
      } else {
        // Pas de pluie → Fermer la bâche
        if (coverDevice.status !== 'fermée') {
          coverDevice.status = 'fermée' as const;
          console.log('☀️ IA: Pas de pluie → Bâche FERMÉE');
        }
      }
    }

    // LOGIQUE POMPE
    const pumpDevice = updatedDevices.find(d => d.id === '1');
    if (pumpDevice) {
      if (sensors.soilHumidity < 40) {
        // Humidité < 40% → Activer la pompe
        if (pumpDevice.status !== 'active') {
          pumpDevice.status = 'active' as const;
          console.log('💧 IA: Humidité faible (' + sensors.soilHumidity + '%) → Pompe ACTIVÉE');
          
          // Simuler l'augmentation de l'humidité du sol
          this.startWatering();
        }
      } else {
        // Humidité ≥ 40% → Désactiver la pompe
        if (pumpDevice.status !== 'inactive') {
          pumpDevice.status = 'inactive' as const;
          console.log('✅ IA: Humidité suffisante (' + sensors.soilHumidity + '%) → Pompe DÉSACTIVÉE');
        }
      }
    }

    // Mettre à jour les dispositifs
    this.devices.next(updatedDevices);
  }

  // Simuler l'arrosage (augmente l'humidité du sol)
  private startWatering(): void {
    const wateringInterval = setInterval(() => {
      const currentSensors = this.sensorData.value;
      
      if (currentSensors.soilHumidity < 40) {
        // Augmenter l'humidité de 5% toutes les 2 secondes
        this.updateSensorData({
          soilHumidity: Math.min(currentSensors.soilHumidity + 5, 100)
        });
      } else {
        clearInterval(wateringInterval);
      }
    }, 2000);
  }

  // Simuler la pluie (pour tester)
  simulateRain(): void {
    const currentSensors = this.sensorData.value;
    this.updateSensorData({
      rain: !currentSensors.rain
    });
  }

  // Simuler la baisse d'humidité du sol (pour tester)
  simulateSoilDrying(): void {
    const currentSensors = this.sensorData.value;
    if (currentSensors.soilHumidity > 0) {
      this.updateSensorData({
        soilHumidity: Math.max(currentSensors.soilHumidity - 10, 0)
      });
    }
  }

  updateSensorData(data: Partial<SensorData>): void {
    this.sensorData.next({ ...this.sensorData.value, ...data });
  }

  updateWaterLevel(percentage: number): void {
    this.waterLevel.next({
      percentage: percentage,
      label: 'Citerne'
    });
    
    this.checkWaterLevelAlert(percentage);
  }

  private checkWaterLevelAlert(percentage: number): void {
    if (percentage <= 20 && !this.alertShown) {
      this.alertShown = true;
    }
    
    if (percentage > 20) {
      this.alertShown = false;
    }
  }

  getCurrentWaterLevel(): number {
    return this.waterLevel.value.percentage;
  }

  simulateWaterUsage(): void {
    const currentLevel = this.waterLevel.value.percentage;
    if (currentLevel > 0) {
      this.updateWaterLevel(currentLevel - 10);
    }
  }

  refillWaterTank(): void {
    this.updateWaterLevel(100);
    this.alertShown = false;
  }
}