import { apiSlice } from '../../app/apiSlice';

export const patientApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getPatientProfile: builder.query({
            query: (id: string) => `/patients/${id}`,
            providesTags: ['Patients'],
        }),
        updatePatientProfile: builder.mutation({
            query: ({ id, data }: { id: string; data: Record<string, any> }) => ({
                url: `/patients/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Patients', 'Users'],
        }),
        changePassword: builder.mutation({
            query: (data: { currentPassword: string; newPassword: string }) => ({
                url: '/auth/password',
                method: 'PUT',
                body: data,
            }),
        }),
    }),
});

export const { useGetPatientProfileQuery, useUpdatePatientProfileMutation, useChangePasswordMutation } = patientApi;

