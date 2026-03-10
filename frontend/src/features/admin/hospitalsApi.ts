import { apiSlice } from '../../app/apiSlice';
import type { Hospital } from '../../types';

export const hospitalsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getHospitals: builder.query<Hospital[], void>({
            query: () => '/hospitals',
            transformResponse: (response: any) => response.data,
            providesTags: ['Hospitals'],
        }),
        createHospital: builder.mutation<Hospital, Partial<Hospital>>({
            query: (hospitalData) => ({
                url: '/hospitals',
                method: 'POST',
                body: hospitalData,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ['Hospitals'],
        }),
        updateHospital: builder.mutation<Hospital, { id: string; data: Partial<Hospital> }>({
            query: ({ id, data }) => ({
                url: `/hospitals/${id}`,
                method: 'PUT',
                body: data,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ['Hospitals'],
        }),
        deleteHospital: builder.mutation<void, string>({
            query: (id) => ({
                url: `/hospitals/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Hospitals'],
        }),
    }),
});

export const {
    useGetHospitalsQuery,
    useCreateHospitalMutation,
    useUpdateHospitalMutation,
    useDeleteHospitalMutation,
} = hospitalsApi;
