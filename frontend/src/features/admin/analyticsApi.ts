import { apiSlice } from '../../app/apiSlice';

export const analyticsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getSystemStats: builder.query({
            query: () => '/analytics/stats',
            providesTags: ['Activity', 'Users', 'Patients', 'Records'],
            transformResponse: (response: { data: any }) => response.data,
        }),
        getAdmissionVolume: builder.query({
            query: () => '/analytics/volume',
            providesTags: ['Records'],
            transformResponse: (response: { data: any[] }) => response.data,
        }),
        getFacilityActivity: builder.query({
            query: () => '/analytics/activity',
            providesTags: ['Activity'],
            transformResponse: (response: { data: any[] }) => response.data,
        }),
        getDiseaseDemographics: builder.query({
            query: () => '/analytics/demographics',
            providesTags: ['Patients'],
            transformResponse: (response: { data: any[] }) => response.data,
        })
    }),
});

export const {
    useGetSystemStatsQuery,
    useGetAdmissionVolumeQuery,
    useGetFacilityActivityQuery,
    useGetDiseaseDemographicsQuery
} = analyticsApi;
