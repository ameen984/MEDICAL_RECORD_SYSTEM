import { apiSlice } from '../../app/apiSlice';

export const appointmentsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAppointments: builder.query<any[], { patientId?: string; doctorId?: string; status?: string }>({
            query: (params) => ({ url: '/appointments', params }),
            providesTags: ['Appointment'],
        }),
        getAppointmentById: builder.query<any, string>({
            query: (id) => `/appointments/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'Appointment', id }],
        }),
        createAppointment: builder.mutation<any, Partial<any>>({
            query: (body) => ({ url: '/appointments', method: 'POST', body }),
            invalidatesTags: ['Appointment'],
        }),
        updateAppointment: builder.mutation<any, { id: string; data: Partial<any> }>({
            query: ({ id, data }) => ({ url: `/appointments/${id}`, method: 'PUT', body: data }),
            invalidatesTags: (_r, _e, { id }) => [{ type: 'Appointment', id }, 'Appointment'],
        }),
        cancelAppointment: builder.mutation<any, string>({
            query: (id) => ({ url: `/appointments/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Appointment'],
        }),
    }),
});

export const {
    useGetAppointmentsQuery,
    useGetAppointmentByIdQuery,
    useCreateAppointmentMutation,
    useUpdateAppointmentMutation,
    useCancelAppointmentMutation,
} = appointmentsApi;
