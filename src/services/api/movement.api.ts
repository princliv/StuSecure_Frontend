import { apiClient } from './client';

export type MovementType = 'CHECK_IN' | 'CHECK_OUT';

export interface MovementLog {
  id: string;
  studentId: string;
  guardId: string;
  type: MovementType;
  timestamp: string;
  notes?: string;
  student?: {
    name: string;
    studentId: string;
  };
}

export const movementApi = {
  /** Guard scans a QR token */
  scan: (qrToken: string) =>
    apiClient.post<MovementLog>('/movements/scan', { qrToken }),

  getMyHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ logs: MovementLog[]; total: number }>('/movements/me', { params }),

  getAll: (params?: { page?: number; limit?: number; studentId?: string }) =>
    apiClient.get<{ logs: MovementLog[]; total: number }>('/movements', { params }),
};
