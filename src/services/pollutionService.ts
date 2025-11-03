import { api } from './api';

export interface PollutionData {
  latitude: number;
  longitude: number;
  aqi: number;
  pollutants: {
    pM25: number;
    pM10: number;
    co: number;
    nO2: number;
    sO2: number;
    o3: number;
  };
  lastUpdated: string;
  dataAge: string;
}

export interface HistoryPoint {
  timestamp: string;
  aqi: number;
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  so2: number;
  o3: number;
}

export interface PollutionHistory {
  latitude: number;
  longitude: number;
  hours: number;
  points: HistoryPoint[];
  total: number;
}

export const pollutionService = {
  async getCurrentPollution(lat: number, lon: number): Promise<PollutionData> {
    const response = await api.get('api/pollution/current', {
      params: { lat, lon }
    });
    return response.data;
  },

  async getPollutionHistory(lat: number, lon: number, hours: number = 24): Promise<PollutionHistory> {
    const response = await api.get('api/pollution/history', {
      params: { lat, lon, hours }
    });
    return response.data;
  }
};