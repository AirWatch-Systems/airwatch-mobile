import { FeedbackItemDto } from './feedback';

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