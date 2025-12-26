import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Database, ref, onValue, set } from '@angular/fire/database';
import { SensorData, WaterLevel, ControlDevice } from '../models/garden.model';

@Injectable({
  providedIn: 'root'
})
export class GardenDataService {
  
  private db = inject(Database);
  
  private sensorData = new BehaviorSubject<SensorData>({
    temperature: 0,
    airHumidity: 0,
    soilHumidity: 0,
    rain: false
  });

  private waterLevel = new BehaviorSubject<WaterLevel>({
    percentage: 0,
    label: 'Citerne'
  });

  // ========== POMPE - Propriété séparée ==========
  private pompe = new BehaviorSubject<{
    status: 'ON' | 'OFF';
  }>({
    status: 'OFF'
  });

  // ========== BÂCHE - Propriété séparée ==========
  private bache = new BehaviorSubject<{
    status: 'OUVERTE' | 'FERMEE';
  }>({
    status: 'FERMEE'
  });

  private isAIMode = new BehaviorSubject<boolean>(true);
  private alertShown = false;
  private maisonId = 'maison_1';

  constructor() {
    setTimeout(() => {
      this.initFirebaseListeners();
    }, 100);
  }

  private initFirebaseListeners(): void {
    try {
      const maisonRef = ref(this.db, `/maisons/${this.maisonId}`);

      onValue(maisonRef, (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
          console.log('📡 Données reçues de Firebase:', data);

          // Mise à jour des capteurs
          this.sensorData.next({
            temperature: data.temperature || 0,
            airHumidity: data.humiditeAir || 0,
            soilHumidity: data.humiditeSol || 0,
            rain: data.pluie === 'pluie'
          });

          // Mise à jour du niveau d'eau
          const waterPercentage = data.niveauEau || 0;
          this.waterLevel.next({
            percentage: waterPercentage,
            label: 'Citerne'
          });
          this.checkWaterLevelAlert(waterPercentage);

          // Mise à jour du mode (lire depuis Firebase)
          if (data.mode) {
            const isAuto = data.mode === 'automatique';
            if (this.isAIMode.value !== isAuto) {
              this.isAIMode.next(isAuto);
            }
          }

          // ========== MISE À JOUR POMPE ==========
          // 🔥 FIX: Lire depuis les commandes pour réactivité immédiate
          if (data.commandes && data.commandes.pompe) {
            const newPompeStatus = data.commandes.pompe === 'ON' ? 'ON' : 'OFF';
            console.log('🔄 [FIREBASE → POMPE] Commande reçue:', data.commandes.pompe, '→ Status:', newPompeStatus);
            this.pompe.next({
              status: newPompeStatus
            });
          } else if (data.pompe) {
            // Fallback: lire depuis l'état si pas de commande
            const newPompeStatus = data.pompe === 'ON' ? 'ON' : 'OFF';
            console.log('🔄 [FIREBASE → POMPE] État reçu:', data.pompe, '→ Status:', newPompeStatus);
            this.pompe.next({
              status: newPompeStatus
            });
          }

          // ========== MISE À JOUR BÂCHE ==========
          // 🔥 FIX: Lire depuis les commandes pour réactivité immédiate
          if (data.commandes && data.commandes.bache) {
            const newBacheStatus = data.commandes.bache === 'ouvrir' ? 'OUVERTE' : 'FERMEE';
            console.log('🔄 [FIREBASE → BÂCHE] Commande reçue:', data.commandes.bache, '→ Status:', newBacheStatus);
            this.bache.next({
              status: newBacheStatus
            });
          } else if (data.etatBache) {
            // Fallback: lire depuis l'état si pas de commande
            const newBacheStatus = data.etatBache === 'OUVERTE' ? 'OUVERTE' : 'FERMEE';
            console.log('🔄 [FIREBASE → BÂCHE] État reçu:', data.etatBache, '→ Status:', newBacheStatus);
            this.bache.next({
              status: newBacheStatus
            });
          }
        }
      }, (error) => {
        console.error('❌ Erreur Firebase:', error);
      });
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase:', error);
    }
  }

  getSensorData(): Observable<SensorData> {
    return this.sensorData.asObservable();
  }

  getWaterLevel(): Observable<WaterLevel> {
    return this.waterLevel.asObservable();
  }

  // ========== GETTERS POUR POMPE ET BÂCHE ==========
  getPompe(): Observable<{status: 'ON' | 'OFF'}> {
    return this.pompe.asObservable();
  }

  getBache(): Observable<{status: 'OUVERTE' | 'FERMEE'}> {
    return this.bache.asObservable();
  }

  getAIMode(): Observable<boolean> {
    return this.isAIMode.asObservable();
  }

  // ========== TOGGLE MODE AUTO/MANUEL ==========
  toggleAIMode(): void {
    const newMode = !this.isAIMode.value;
    this.isAIMode.next(newMode);
    
    const modeRef = ref(this.db, `/maisons/${this.maisonId}/mode`);
    set(modeRef, newMode ? 'automatique' : 'manuel');
    
    console.log('🔄 Mode changé:', newMode ? 'Automatique' : 'Manuel');
  }

  isAIModeActive(): boolean {
    return this.isAIMode.value;
  }

  // ========== TOGGLE POMPE UNIQUEMENT ==========
  togglePompe(): void {
    if (this.isAIMode.value) {
      console.log('⚠️ Mode IA - Impossible de contrôler la pompe manuellement');
      return;
    }

    const currentStatus = this.pompe.value.status;
    const newState = currentStatus === 'ON' ? 'OFF' : 'ON';

    const pompeRef = ref(this.db, `/maisons/${this.maisonId}/commandes/pompe`);
    set(pompeRef, newState);
    console.log('💧 [POMPE] Commande envoyée:', newState);
  }

  // ========== TOGGLE BÂCHE UNIQUEMENT ==========
  toggleBache(): void {
    if (this.isAIMode.value) {
      console.log('⚠️ Mode IA - Impossible de contrôler la bâche manuellement');
      return;
    }

    const currentStatus = this.bache.value.status;
    const newCommand = currentStatus === 'OUVERTE' ? 'fermer' : 'ouvrir';

    const bacheRef = ref(this.db, `/maisons/${this.maisonId}/commandes/bache`);
    set(bacheRef, newCommand);
    console.log('☂️ [BÂCHE] Commande envoyée:', newCommand);
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

  // ========== FONCTIONS DE TEST ==========
  simulateWaterUsage(): void {
    const currentLevel = this.waterLevel.value.percentage;
    if (currentLevel > 0) {
      const newLevel = currentLevel - 10;
      const waterRef = ref(this.db, `/maisons/${this.maisonId}/niveauEau`);
      set(waterRef, newLevel);
    }
  }

  refillWaterTank(): void {
    const waterRef = ref(this.db, `/maisons/${this.maisonId}/niveauEau`);
    set(waterRef, 100);
    this.alertShown = false;
  }

  simulateRain(): void {
    const rainRef = ref(this.db, `/maisons/${this.maisonId}/pluie`);
    const currentRain = this.sensorData.value.rain;
    set(rainRef, currentRain ? 'pas de pluie' : 'pluie');
  }

  simulateSoilDrying(): void {
    const currentSoil = this.sensorData.value.soilHumidity;
    if (currentSoil > 0) {
      const soilRef = ref(this.db, `/maisons/${this.maisonId}/humiditeSol`);
      set(soilRef, Math.max(currentSoil - 10, 0));
    }
  }

  updateSensorData(data: Partial<SensorData>): void {
    if (data.temperature !== undefined) {
      const tempRef = ref(this.db, `/maisons/${this.maisonId}/temperature`);
      set(tempRef, data.temperature);
    }
    if (data.soilHumidity !== undefined) {
      const soilRef = ref(this.db, `/maisons/${this.maisonId}/humiditeSol`);
      set(soilRef, data.soilHumidity);
    }
  }

  updateWaterLevel(percentage: number): void {
    const waterRef = ref(this.db, `/maisons/${this.maisonId}/niveauEau`);
    set(waterRef, percentage);
  }
}