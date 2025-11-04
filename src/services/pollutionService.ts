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



export const pollutionService = {
  async getCurrentPollution(lat: number, lon: number): Promise<PollutionData> {
    const response = await api.get('api/pollution/current', {
      params: { lat, lon }
    });
    return response.data;
  },


};