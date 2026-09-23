import { apiClient } from './client';

export type AppNotificationType =
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'EMERGENCY'
  | 'ANNOUNCEMENT'
  | 'HELP_REQUEST'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: AppNotificationType;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  total: number;
  page: number;
  limit: number;
}

export const notificationApi = {
  list: (params?: { page?: number; limit?: number; unread?: boolean }) =>
    apiClient.get<NotificationListResponse>('/notifications', {
      params: params?.unread ? { ...params, unread: 'true' } : params,
    }),

  markRead: (id: string) => apiClient.patch<AppNotification>(`/notifications/${id}/read`),

  markAllRead: () => apiClient.patch<{ updated: number }>('/notifications/read-all'),
};

export const deviceApi = {
  register: (data: { token: string; platform: 'IOS' | 'ANDROID' | 'WEB'; provider?: 'EXPO' | 'FCM' }) =>
    apiClient.post('/devices', data),
};
