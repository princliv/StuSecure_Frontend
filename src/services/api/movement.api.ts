import { apiClient } from './client';

export type MovementType = 'CHECK_IN' | 'CHECK_OUT';

export interface MovementStudent {
  name: string;
  enrollmentNo: string;
  hostelName: string | null;
  roomNumber: string | null;
}

export interface MovementLog {
  id: string;
  studentId: string;
  guardId: string;
  type: MovementType;
  location: string | null;
  timestamp: string;
  student: MovementStudent;
  guard: { name: string };
}

export interface MovementListResponse {
  logs: MovementLog[];
  total: number;
  page: number;
  limit: number;
}

export const movementApi = {
  scan: (qrToken: string, location?: string) =>
    apiClient.post<MovementLog>('/movements/scan', { qrToken, location }),

  getMyHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get<MovementListResponse>('/movements/me', { params }),

  getAll: (params?: { page?: number; limit?: number; studentId?: string }) =>
    apiClient.get<MovementListResponse>('/movements', { params }),
};
