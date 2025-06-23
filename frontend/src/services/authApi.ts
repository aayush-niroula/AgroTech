// src/services/authApi.ts
import { api } from './api';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
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
  }),
});

export const { useLoginMutation } = authApi;
