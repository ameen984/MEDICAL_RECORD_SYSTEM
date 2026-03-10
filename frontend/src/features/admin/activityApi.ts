import { apiSlice } from '../../app/apiSlice';

export interface ActivityLog {
    _id: string;
    user: string;
    userName: string;
    action: string;
    details: string;
    targetUser?: string;
    targetUserName?: string;
    timestamp: string;
}

export const activityApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getActivityLogs: builder.query<{ success: boolean; data: ActivityLog[] }, void>({
            query: () => '/activity',
            providesTags: ['Activity'],
        }),
    }),
});

export const { useGetActivityLogsQuery } = activityApi;
