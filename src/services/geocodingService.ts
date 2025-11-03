import * as Location from 'expo-location';

export interface AddressInfo {
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  formattedAddress: string;
}

export const geocodingService = {
  async reverseGeocode(lat: number, lon: number): Promise<AddressInfo> {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      
      if (result.length > 0) {
        const address = result[0];
        const parts = [];
        
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.region) parts.push(address.region);
        
        return {
          street: address.street || undefined,
          city: address.city || undefined,
          region: address.region || undefined,
          country: address.country || undefined,
          formattedAddress: parts.length > 0 ? parts.join(', ') : `${lat.toFixed(4)}, ${lon.toFixed(4)}`
        };
      }
    } catch (error) {
      console.error('Erro na geocodificação reversa:', error);
    }
    
    return {
      formattedAddress: `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    };
  }
};