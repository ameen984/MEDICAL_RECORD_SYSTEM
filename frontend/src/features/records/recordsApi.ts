import { apiSlice } from '../../app/apiSlice';
import type { MedicalRecord } from '../../types';

interface CreateRecordRequest {
    patientId: string;
    diagnosis: string;
    treatment: string;
    prescriptions?: string;
    notes?: string;
}

export const recordsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getRecords: builder.query<MedicalRecord[], { patientId?: string }>({
            query: ({ patientId }) => ({
                url: '/records',
                params: patientId ? { patientId } : {},
            }),
            transformResponse: (response: any) => response.data,
            providesTags: ['Records'],
        }),
        getRecordById: builder.query<MedicalRecord, string>({
            query: (id) => `/records/${id}`,
            transformResponse: (response: any) => response.data,
            providesTags: (_result, _error, id) => [{ type: 'Records', id }],
        }),
        createRecord: builder.mutation<MedicalRecord, CreateRecordRequest>({
            query: (recordData) => ({
                url: '/records',
                method: 'POST',
                body: recordData,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ['Records'],
        }),
        updateRecord: builder.mutation<MedicalRecord, Partial<MedicalRecord> & { id: string }>({
            query: ({ id, ...recordData }) => ({
                url: `/records/${id}`,
                method: 'PUT',
                body: recordData,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ['Records'],
        }),
    }),
});

export const {
    useGetRecordsQuery,
    useGetRecordByIdQuery,
    useCreateRecordMutation,
    useUpdateRecordMutation,
} = recordsApi;
