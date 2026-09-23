import { apiClient } from './client';

export interface Guard {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  email: string;
  shift: string | null;
  hostelId: string | null;
  hostelName: string | null;
}

export const guardApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ guards: Guard[]; total: number; page: number; limit: number }>('/guards', {
      params,
    }),
};
