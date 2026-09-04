import { apiClient } from './client';

export type EmergencyType = 'SOS' | 'FIRE' | 'MEDICAL' | 'SECURITY' | 'OTHER';
export type EmergencyStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Emergency {
  id: string;
  reportedBy: string;
  type: EmergencyType;
  status: EmergencyStatus;
  description?: string;
  location?: string;
  createdAt: string;
  resolvedAt?: string;
}

export const emergencyApi = {
  /** Student triggers SOS */
  triggerSOS: (data: { type: EmergencyType; description?: string; location?: string }) =>
    apiClient.post<Emergency>('/emergency', data),

  getAll: (params?: { status?: EmergencyStatus; page?: number }) =>
    apiClient.get<{ emergencies: Emergency[]; total: number }>('/emergency', { params }),

  acknowledge: (id: string) =>
    apiClient.patch<Emergency>(`/emergency/${id}/acknowledge`),

  resolve: (id: string) =>
    apiClient.patch<Emergency>(`/emergency/${id}/resolve`),
};
