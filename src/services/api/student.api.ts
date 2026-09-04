import { apiClient } from './client';

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  name: string;
  email: string;
  phone?: string;
  hostelId?: string;
  roomNumber?: string;
  course?: string;
  year?: number;
}

export const studentApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{ students: Student[]; total: number }>('/students', { params }),

  getById: (id: string) => apiClient.get<Student>(`/students/${id}`),

  getMyProfile: () => apiClient.get<Student>('/students/me'),

  update: (id: string, data: Partial<Student>) =>
    apiClient.patch<Student>(`/students/${id}`, data),
};
