// src/services/authApi.ts
import { api } from './api';

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
    createdAt: string;
    updatedAt: string;
  };
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
}),
});

export const { useLoginMutation,useGetUserByIdQuery } = authApi;
