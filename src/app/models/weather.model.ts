export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  condition: string;
  humidity: number;
  rainChance: number;
  icon: string;
}

export interface ForecastDay {
  date: string;
  dayName: string;
  icon: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  rainChance: number;
}

export interface WeatherRecommendation {
  id: number;
  text: string;
  link: string;
}