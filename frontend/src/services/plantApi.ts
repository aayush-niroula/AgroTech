import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
export interface DiseaseInfo {
  causes?: string;
  symptoms?: string;
  treatment?: string[];
  prevention?: string[];
}
export interface PredictionResponse {
  prediction: string;
  confidence: number;
  image_url: string;
  message?: string;
  info?: DiseaseInfo;
}

export const plantApi = createApi({
  reducerPath: 'plantApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000' }),
  endpoints: (builder) => ({
    predictDisease: builder.mutation<PredictionResponse,File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: '/predict',
          method: 'POST',
          body: formData,
        };
      },
    }),
  }),
});

export const { usePredictDiseaseMutation } = plantApi;
