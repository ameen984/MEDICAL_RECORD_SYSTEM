import { apiSlice } from '../../app/apiSlice';
import type { User, CreateUserRequest } from '../../types';

export const usersApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query<User[], void>({
            query: () => '/users',
            transformResponse: (response: any) => response.data,
            providesTags: ['Users'],
        }),
        createUser: builder.mutation<User, CreateUserRequest>({
            query: (userData) => ({
                url: '/users',
                method: 'POST',
                body: userData,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ['Users'],
        }),
        updateUserRole: builder.mutation<User, { id: string; role: 'admin' | 'doctor' | 'patient' }>({
            query: ({ id, role }) => ({
                url: `/users/${id}/role`,
                method: 'PUT',
                body: { role },
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ['Users'],
        }),
        updateUser: builder.mutation<User, { id: string; data: Partial<CreateUserRequest> }>({
            query: ({ id, data }) => ({
                url: `/users/${id}`,
                method: 'PATCH',
                body: data,
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ['Users'],
        }),
        toggleUserStatus: builder.mutation<User, { id: string; isActive: boolean }>({
            query: ({ id, isActive }) => ({
                url: `/users/${id}/status`,
                method: 'PATCH',
                body: { isActive },
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: ['Users'],
        }),
        deleteUser: builder.mutation<void, string>({
            query: (id) => ({
                url: `/users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Users'],
        }),
    }),
});

export const {
    useGetUsersQuery,
    useCreateUserMutation,
    useUpdateUserRoleMutation,
    useUpdateUserMutation,
    useToggleUserStatusMutation,
    useDeleteUserMutation,
} = usersApi;
