import { apiClient } from './client';

export interface QRStudentSnapshot {
  name: string;
  enrollmentNo: string;
  hostelName: string | null;
  roomNumber: string | null;
}

export interface QRIdentity {
  id: string;
  studentId: string;
  token: string;
  isActive: boolean;
  createdAt: string;
  rotatedAt: string | null;
  student: QRStudentSnapshot;
}

export const qrApi = {
  /** Fetch or generate the current student's QR token */
  getMyQR: () => apiClient.get<QRIdentity>('/qr/me'),

  /** Rotate/regenerate QR token */
  rotateQR: () => apiClient.post<QRIdentity>('/qr/rotate'),
};
