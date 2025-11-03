import { get, put, post } from "./api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const userService = {
  async getProfile(): Promise<UserProfile> {
    return get<UserProfile>("/api/user/profile");
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    return put<UserProfile, UpdateProfileRequest>("/api/user/profile", data);
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return post<void, ChangePasswordRequest>("/api/user/change-password", data);
  },
};