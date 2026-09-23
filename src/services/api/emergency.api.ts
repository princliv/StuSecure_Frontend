import { apiClient } from './client';

export type EmergencyStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED';
export type EmergencyType = 'SOS' | 'FIRE' | 'MEDICAL' | 'SECURITY' | 'OTHER';

export interface EmergencyReporter {
  studentId: string;
  name: string;
  enrollmentNo: string;
  hostelName: string | null;
  roomNumber: string | null;
}

export interface Emergency {
  id: string;
  status: EmergencyStatus;
  description: string;
  location: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reportedBy: EmergencyReporter;
  resolvedBy: { id: string; name: string } | null;
}

export interface EmergencyListResponse {
  emergencies: Emergency[];
  total: number;
  page: number;
  limit: number;
}

export const emergencyApi = {
  triggerSOS: (data: { type?: EmergencyType; description?: string; location?: string }) =>
    apiClient.post<Emergency>('/emergency', data),

  getAll: (params?: { status?: EmergencyStatus; page?: number; limit?: number }) =>
    apiClient.get<EmergencyListResponse>('/emergency', { params }),

  acknowledge: (id: string) =>
    apiClient.patch<Emergency>(`/emergency/${id}/acknowledge`),

  resolve: (id: string) =>
    apiClient.patch<Emergency>(`/emergency/${id}/resolve`),
};
