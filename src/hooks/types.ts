/**
 * Types aligned with the backend API contracts.
 * Keep these in sync with the server DTOs (camelCase over the wire).
 */

// Auth
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
export interface RegisterResponse {
  userId: string;
  message: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  requires2FA: boolean;
  sessionId: string;
}
export interface Verify2FaRequest {
  sessionId: string;
  token: string;
}
export interface Verify2FaResponse {
  token: string;
  expiresIn: number; // seconds
}

// Pollution
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
  timestamp: string; // ISO
}

export interface PollutionHistoryPointDto {
  timestamp: string;
  aqi: number;
  pollutants: PollutantsDto;
}
export interface PollutionHistoryResponse {
  data: PollutionHistoryPointDto[];
}

// Feedbacks
export interface FeedbackListRequest {
  lat: number;
  lon: number;
  radius?: number; // km
  hours?: number;
}
export interface UserMiniDto {
  id: string;
  name: string;
  avatarUrl?: string | null;
}
export interface FeedbackItemDto {
  id: string;
  user: UserMiniDto;
  rating: number; // 1-5
  comment?: string | null;
  createdAt: string;
}
export interface FeedbackListResponse {
  feedbacks: FeedbackItemDto[];
}

export interface FeedbackCreateRequest {
  lat: number;
  lon: number;
  rating: number; // 1-5
  comment?: string | null;
}
export interface FeedbackCreateResponse {
  feedbackId: string;
  message: string;
}

// Locations / Markers
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

// User History
export interface UserSearchHistoryItemDto {
  id: string;
  locationName: string;
  lat: number;
  lon: number;
  searchedAt: string;
}
export interface UserHistoryResponse {
  feedbacks: FeedbackItemDto[];
  searches: UserSearchHistoryItemDto[];
}

/**
 * Utilities
 */
export type Milliseconds = number;
export const FIFTEEN_MIN_MS: Milliseconds = 15 * 60 * 1000;

/**
 * Example helper to transform rating label to numeric (client-side mapping)
 * RF06 mentions textual options; server expects 1..5. You can adapt UI to call this.
 */
export type RatingLabel = "Boa" | "Normal" | "Ruim" | "Muito Ruim" | "Péssima";
export function ratingLabelToValue(label: RatingLabel): number {
  switch (label) {
    case "Boa":
      return 5;
    case "Normal":
      return 4;
    case "Ruim":
      return 3;
    case "Muito Ruim":
      return 2;
    case "Péssima":
      return 1;
    default:
      return 3;
  }
}

/**
 * Friendly error messages for common scenarios (RF13)
 */
export function humanizeError(err: Error | null | undefined): string | null {
  if (!err) return null;
  const message = err.message || "Ocorreu um erro.";
  return message;
}