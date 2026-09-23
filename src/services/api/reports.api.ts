import { apiClient } from './client';

export interface ReportDay {
  date: string;
  checkIns: number;
  checkOuts: number;
}

export interface ReportSummary {
  from: string;
  to: string;
  checkIns: number;
  checkOuts: number;
  uniqueStudents: number;
  totalStudents: number;
  insideCount: number;
  outsideCount: number;
  byDay: ReportDay[];
}

export const reportsApi = {
  summary: (params?: { from?: string; to?: string }) =>
    apiClient.get<ReportSummary>('/reports/summary', { params }),
};
