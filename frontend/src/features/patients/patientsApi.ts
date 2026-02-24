import { apiSlice } from '../../app/apiSlice';
import type { Patient, MedicalRecord } from '../../types';

export const patientsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getPatients: builder.query<Patient[], void>({
            query: () => '/patients',
            transformResponse: (response: any) => response.data,
            providesTags: ['Patients'],
        }),
        getPatientById: builder.query<Patient, string>({
            query: (id) => `/patients/${id}`,
            transformResponse: (response: any) => response.data,
            providesTags: (_result, _error, id) => [{ type: 'Patients', id }],
        }),
        getPatientMedicalHistory: builder.query<MedicalRecord[], string>({
            query: (patientId) => `/patients/${patientId}/history`,
            transformResponse: (response: any) => response.data,
            providesTags: (_result, _error, patientId) => [{ type: 'Records', id: patientId }],
        }),
        updatePatientMedicalInfo: builder.mutation({
            query: ({ id, data }: { id: string; data: Record<string, any> }) => ({
                url: `/patients/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Patients', id }, 'Patients'],
        }),
    }),
});

export const {
    useGetPatientsQuery,
    useGetPatientByIdQuery,
    useGetPatientMedicalHistoryQuery,
    useUpdatePatientMedicalInfoMutation,
} = patientsApi;

