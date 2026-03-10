import { apiSlice } from '../../app/apiSlice';

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
            transformResponse: (response: any) => response.data,
        }),
        register: builder.mutation({
            query: (userData) => ({
                url: '/auth/register',
                method: 'POST',
                body: userData,
            }),
            transformResponse: (response: any) => response.data,
        }),
        forgotPassword: builder.mutation({
            query: (email) => ({
                url: '/auth/forgotpassword',
                method: 'POST',
                body: { email },
            }),
        }),
        resetPassword: builder.mutation({
            query: ({ token, password }) => ({
                url: `/auth/resetpassword/${token}`,
                method: 'PUT',
                body: { password },
            }),
        }),
        logoutUser: builder.mutation<void, void>({
            query: () => ({ url: '/auth/logout', method: 'POST' }),
        }),
    }),
});

export const { useLoginMutation, useRegisterMutation, useForgotPasswordMutation, useResetPasswordMutation, useLogoutUserMutation } = authApi;
