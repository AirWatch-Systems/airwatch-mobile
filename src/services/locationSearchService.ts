import { api } from './api';

export interface LocationResult {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  placeId: string;
}

export interface LocationSearchResponse {
  query: string;
  results: LocationResult[];
  total: number;
}

export const locationSearchService = {
  async searchLocations(query: string): Promise<LocationResult[]> {
    try {
      const response = await api.get<LocationSearchResponse>('api/locations/search', {
        params: { Query: query, limit: 10 }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Erro na busca de localização:', error);
      return [];
    }
  }
};