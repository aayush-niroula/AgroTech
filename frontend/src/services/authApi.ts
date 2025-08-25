import { api } from './api';
import type { IProduct } from '@/types/product';
interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
}
export interface UpdateProfileResponse {
  message: string;
  user: LoginResponse["user"];
}
interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatarFile?: File;
}

interface ResetPasswordRequest {
  currentPassword: string;
  newPassword: string;
}


export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/users/login',
        method: 'POST',
        body: credentials,
        headers: { 'Content-Type': 'application/json' },
      }),
    }),
    getUserById: builder.query<LoginResponse["user"], string>({
      query: (userId) => `/users/${userId}`,
    }),
    updateProfile: builder.mutation<UpdateProfileResponse, UpdateProfileRequest & { userId: string }>({
      query: ({ userId, ...data }) => {
        const formData = new FormData();
        if (data.name) formData.append('name', data.name);
        if (data.email) formData.append('email', data.email);
        if (data.avatarFile) formData.append('avatar', data.avatarFile);

        return {
          url: `/users/${userId}`,
          method: 'PUT',
          body: formData,
        };
      },
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest & { userId: string }>({
      query: ({ userId, ...data }) => ({
        url: `/users/${userId}/reset-password`,
        method: 'PUT',
        body: data,
        headers: { 'Content-Type': 'application/json' },
      }),
    }),
getUserProducts: builder.query<IProduct[], void>({
  query: () => ({
    url: `/users/products`,
    method: 'GET',
  }),
  transformResponse: (response: { success: boolean; data: IProduct[]; message: string }) => {
    return response.data; 
  },
  providesTags: ['Product'],
}),
  }),
});

export const { 
  useLoginMutation, 
  useGetUserByIdQuery, 
  useUpdateProfileMutation, 
  useResetPasswordMutation,
  useGetUserProductsQuery 
} = authApi;
