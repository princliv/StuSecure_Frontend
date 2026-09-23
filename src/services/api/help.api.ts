import { apiClient } from './client';

export type HelpRequestType =
  | 'TRANSPORTATION'
  | 'MEDICAL'
  | 'HOSTEL'
  | 'SECURITY'
  | 'OTHER';

export type HelpRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

export interface HelpRequest {
  id: string;
  type: HelpRequestType;
  description: string;
  priority: string | null;
  status: HelpRequestStatus;
  createdAt: string;
  resolvedAt: string | null;
  student: {
    studentId: string;
    name: string;
    enrollmentNo: string;
    hostelName: string | null;
    roomNumber: string | null;
  };
  assignedTo: { facultyId: string; name: string } | null;
}

export interface HelpListResponse {
  requests: HelpRequest[];
  total: number;
  page: number;
  limit: number;
}

export const helpApi = {
  create: (data: { type: HelpRequestType; description: string; priority?: 'LOW' | 'NORMAL' | 'HIGH' }) =>
    apiClient.post<HelpRequest>('/help', data),

  listMine: (params?: { status?: HelpRequestStatus; page?: number; limit?: number }) =>
    apiClient.get<HelpListResponse>('/help/me', { params }),

  list: (params?: {
    status?: HelpRequestStatus;
    type?: HelpRequestType;
    page?: number;
    limit?: number;
  }) => apiClient.get<HelpListResponse>('/help', { params }),

  assign: (id: string, facultyId?: string) =>
    apiClient.patch<HelpRequest>(`/help/${id}/assign`, facultyId ? { facultyId } : {}),

  resolve: (id: string) => apiClient.patch<HelpRequest>(`/help/${id}/resolve`),

  cancel: (id: string) => apiClient.patch<HelpRequest>(`/help/${id}/cancel`),
};
