import { apiSlice } from '../../app/apiSlice';

export interface Notification {
    _id: string;
    type: 'report' | 'consent' | 'security';
    message: string;
    read: boolean;
    createdAt: string;
}

export const notificationsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query<Notification[], void>({
            query: () => '/notifications',
            transformResponse: (res: any) => res.data,
            providesTags: ['Notifications'],
        }),
        markOneRead: builder.mutation<void, string>({
            query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
            invalidatesTags: ['Notifications'],
        }),
        markAllRead: builder.mutation<void, void>({
            query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
            invalidatesTags: ['Notifications'],
        }),
    }),
});

export const { useGetNotificationsQuery, useMarkOneReadMutation, useMarkAllReadMutation } = notificationsApi;
