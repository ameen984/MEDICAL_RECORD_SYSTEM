import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
        prepareHeaders: (headers, { getState }) => {
            const authState = (getState() as any).auth;
            if (authState?.token) {
                headers.set('authorization', `Bearer ${authState.token}`);
            }
            if (authState?.activeHospitalId) {
                headers.set('x-hospital-context', authState.activeHospitalId);
            }
            return headers;
        },
    }),
    tagTypes: ['Users', 'Patients', 'Records', 'Reports', 'Appointment', 'Appointments', 'Activity', 'Hospitals', 'Notifications'],
    endpoints: (_builder) => ({}),
});
