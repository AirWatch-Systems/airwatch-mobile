export interface UserMiniDto {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface FeedbackListRequest {
  lat: number;
  lon: number;
  radius?: number;
  hours?: number;
}

export interface FeedbackItemDto {
  id: string;
  user?: UserMiniDto;
  userId?: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface FeedbackListResponse {
  feedbacks?: FeedbackItemDto[];
  items?: FeedbackItemDto[];
  total?: number;
  skip?: number;
  take?: number;
}

export interface FeedbackCreateRequest {
  lat: number;
  lon: number;
  rating: number;
  comment?: string | null;
}

export interface FeedbackCreateResponse {
  feedbackId: string;
  message: string;
}

export type RatingLabel = "Boa" | "Normal" | "Ruim" | "Muito Ruim" | "Péssima";

export function ratingLabelToValue(label: RatingLabel): number {
  switch (label) {
    case "Boa": return 5;
    case "Normal": return 4;
    case "Ruim": return 3;
    case "Muito Ruim": return 2;
    case "Péssima": return 1;
    default: return 3;
  }
}