import { apiSlice } from '../../app/apiSlice';
import type { Appointment } from '../../types';

export const appointmentsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAppointments: builder.query<Appointment[], void>({
            query: () => '/appointments',
            providesTags: ['Appointments'],
        }),
        getMyAppointments: builder.query<Appointment[], void>({
            query: () => '/appointments/my',
            providesTags: ['Appointments'],
        }),
        createAppointment: builder.mutation<Appointment, Partial<Appointment>>({
            query: (data) => ({
                url: '/appointments',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Appointments'],
        }),
        updateAppointmentStatus: builder.mutation<Appointment, { id: string; status: Appointment['status'] }>({
            query: ({ id, status }) => ({
                url: `/appointments/${id}/status`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: ['Appointments'],
        }),
    }),
});

export const {
    useGetAppointmentsQuery,
    useGetMyAppointmentsQuery,
    useCreateAppointmentMutation,
    useUpdateAppointmentStatusMutation,
} = appointmentsApi;
