export interface PollutantsDto {
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  so2: number;
  o3: number;
}

export interface PollutionCurrentResponse {
  aqi: number;
  pollutants: PollutantsDto;
  timestamp: string;
}

export interface PollutionHistoryPointDto {
  timestamp: string;
  aqi: number;
  pollutants: PollutantsDto;
}

export interface PollutionHistoryResponse {
  data: PollutionHistoryPointDto[];
}