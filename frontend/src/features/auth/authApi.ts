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
        googleAuth: builder.mutation({
            query: (idToken: string) => ({ url: '/auth/google', method: 'POST', body: { idToken } }),
            transformResponse: (res: any) => res.data,
        }),
        sendPhoneOtp: builder.mutation({
            query: (phone: string) => ({ url: '/auth/phone/send-otp', method: 'POST', body: { phone } }),
        }),
        verifyPhoneOtp: builder.mutation({
            query: ({ phone, otp }: { phone: string; otp: string }) => ({
                url: '/auth/phone/verify-otp', method: 'POST', body: { phone, otp },
            }),
            transformResponse: (res: any) => res.data,
        }),
        sendEmailOtp: builder.mutation({
            query: ({ email, name }: { email: string; name?: string }) => ({ url: '/auth/email/send-otp', method: 'POST', body: { email, name } }),
        }),
        verifyEmailOtp: builder.mutation({
            query: ({ email, otp }: { email: string; otp: string }) => ({
                url: '/auth/email/verify-otp', method: 'POST', body: { email, otp },
            }),
            transformResponse: (res: any) => res.data,
        }),
    }),
});

export const {
    useLoginMutation,
    useRegisterMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useLogoutUserMutation,
    useGoogleAuthMutation,
    useSendPhoneOtpMutation,
    useVerifyPhoneOtpMutation,
    useSendEmailOtpMutation,
    useVerifyEmailOtpMutation,
} = authApi;
