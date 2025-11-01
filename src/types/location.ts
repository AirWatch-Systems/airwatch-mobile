export interface LocationSearchRequest {
  query: string;
}

export interface LocationResultDto {
  name: string;
  lat: number;
  lon: number;
  placeId: string;
}

export interface LocationSearchResponse {
  results: LocationResultDto[];
}

export interface RegionMarkerDto {
  lat: number;
  lon: number;
  avgAqi: number;
  feedbackCount: number;
}

export interface MarkersResponse {
  markers: RegionMarkerDto[];
}