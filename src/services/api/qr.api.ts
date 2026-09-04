import { apiClient } from './client';

export interface QRIdentity {
  id: string;
  studentId: string;
  token: string;
  expiresAt?: string;
  isActive: boolean;
}

export const qrApi = {
  /** Fetch or generate the current student's QR token */
  getMyQR: () => apiClient.get<QRIdentity>('/qr/me'),

  /** Rotate/regenerate QR token */
  rotateQR: () => apiClient.post<QRIdentity>('/qr/rotate'),
};
