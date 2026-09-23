import { apiClient } from './client';
import type { MovementLog } from './movement.api';

export interface MonitoringHostel {
  id: string;
  name: string;
}

export interface MonitoringSnapshot {
  insideCount: number;
  outsideCount: number;
  totalStudents: number;
  openEmergencyCount: number;
  alertSummary: string;
  hostels: MonitoringHostel[];
  movements: MovementLog[];
}

export const monitoringApi = {
  snapshot: () => apiClient.get<MonitoringSnapshot>('/monitoring'),
};
