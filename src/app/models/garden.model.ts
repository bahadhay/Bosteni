export interface SensorData {
  temperature: number;
  airHumidity: number;
  soilHumidity: number;
  rain: boolean;
}

export interface WaterLevel {
  percentage: number;
  label: string;
}

export interface ControlDevice {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'inactive' | 'fermée';
}