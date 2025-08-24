import type { RootState } from '@/app/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api',
    prepareHeaders:(headers,{getState})=>{
      const token = (getState() as RootState).auth.token;
      if(token){
        headers.set('Authorization',`Bearer ${token}`);
      }
      return headers;

    },
    credentials: 'include', 
  }),
  tagTypes:['Product','Conversation','Message','Notification'],
  endpoints: () => ({}),
});