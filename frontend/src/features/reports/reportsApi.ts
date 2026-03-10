import { apiSlice } from '../../app/apiSlice';
import type { Report } from '../../types';

interface UploadReportRequest {
    patientId: string;
    recordId?: string;
    type: 'lab' | 'scan' | 'prescription' | 'other';
    title: string;
    file: File;
}

export const reportsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getReports: builder.query<Report[], { patientId?: string; recordId?: string; type?: string }>({
            query: (params) => ({
                url: '/reports',
                params,
            }),
            transformResponse: (response: any) => response.data.map((report: any) => ({
                ...report,
                id: report._id || report.id
            })),
            providesTags: ['Reports'],
        }),
        uploadReport: builder.mutation<Report, UploadReportRequest>({
            query: (reportData) => {
                const formData = new FormData();
                formData.append('file', reportData.file);
                formData.append('patientId', reportData.patientId);
                formData.append('type', reportData.type);
                formData.append('title', reportData.title);
                if (reportData.recordId) {
                    formData.append('recordId', reportData.recordId);
                }

                return {
                    url: '/reports/upload',
                    method: 'POST',
                    body: formData,
                };
            },
            transformResponse: (response: any) => ({
                ...response.data,
                id: response.data._id || response.data.id
            }),
            invalidatesTags: ['Reports'],
        }),
        deleteReport: builder.mutation<void, string>({
            query: (id) => ({
                url: `/reports/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Reports'],
        }),
    }),
});

export const {
    useGetReportsQuery,
    useUploadReportMutation,
    useDeleteReportMutation,
} = reportsApi;
