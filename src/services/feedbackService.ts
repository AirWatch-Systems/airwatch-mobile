import { api } from './api';
import { FeedbackItemDto, FeedbackListResponse, FeedbackCreateRequest } from '../types/feedback';

export interface FeedbackFilters {
  type: 'all' | 'current' | 'region';
  lat?: number;
  lon?: number;
  radius?: number;
  hours?: number;
}

export const feedbackService = {
  async getMyFeedbacks(skip = 0, take = 50): Promise<FeedbackItemDto[]> {
    const response = await api.get<FeedbackListResponse>('api/feedbacks/my', {
      params: { skip, take }
    });
    return response.data.items || [];
  },

  async getFeedbacksNearLocation(
    lat: number, 
    lon: number, 
    radius = 5, 
    hours = 168,
    skip = 0,
    take = 50
  ): Promise<FeedbackItemDto[]> {
    const response = await api.get<FeedbackListResponse>('api/feedbacks/near', {
      params: { lat, lon, radius, hours, skip, take }
    });
    return response.data.items || [];
  },

  async createFeedback(feedback: FeedbackCreateRequest) {
    try {
      const response = await api.post('api/feedbacks', feedback);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error(error.response.data.message || 'Limite de tempo atingido');
      }
      throw error;
    }
  }
};