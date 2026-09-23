import { apiClient } from './client';

export interface StudentLastMovement {
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  location: string | null;
}

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  enrollmentNo: string;
  name: string;
  email: string;
  phone?: string | null;
  hostelId?: string | null;
  hostelName?: string | null;
  roomNumber?: string | null;
  lastMovement?: StudentLastMovement | null;
}

export const studentApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{ students: Student[]; total: number; page: number; limit: number }>('/students', {
      params,
    }),

  getById: (id: string) => apiClient.get<Student>(`/students/${id}`),

  getMyProfile: () => apiClient.get<Student>('/students/me'),
};
