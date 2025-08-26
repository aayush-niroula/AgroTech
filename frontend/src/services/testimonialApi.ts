import { api } from './api';
export interface IUser {
  _id: string;
  name: string;
  role?: string;
}

export interface ITestimonial {
  _id: string;
  userId: IUser;
  name:string;
  role?:string;     
  content: string;
  rating: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
}


export const testimonialApi = api.injectEndpoints({
  endpoints: (builder) => ({
 
getTestimonials: builder.query<ITestimonial[], void>({
  query: () => '/testimonial',
  transformResponse: (response: { success: boolean; data: any[]; message: string }) => {
    return response.data.map((t) => ({
      ...t,
      userId: typeof t.userId === 'string'
        ? { _id: t.userId, name: 'Anonymous', role: undefined } 
        : t.userId, 
    }));
  },
  providesTags: ['Testimonial'],
}),
  
    getTestimonialById: builder.query<ITestimonial, string>({
      query: (id) => `/testimonial/${id}`,
      transformResponse: (response: { success: boolean; data: ITestimonial; message: string }) => response.data,
      providesTags: ['Testimonial'],
    }),


    createTestimonial: builder.mutation<ITestimonial, Partial<ITestimonial>>({
      query: (testimonial) => ({
        url: '/testimonial',
        method: 'POST',
        body: testimonial,
      }),
      invalidatesTags: ['Testimonial'],
    }),


    updateTestimonial: builder.mutation<ITestimonial, { id: string; data: Partial<ITestimonial> }>({
      query: ({ id, data }) => ({
        url: `/testimonial/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Testimonial'],
    }),

   
    deleteTestimonial: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/testimonial/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Testimonial'],
    }),
  }),
});

export const {
  useGetTestimonialsQuery,
  useGetTestimonialByIdQuery,
  useCreateTestimonialMutation,
  useUpdateTestimonialMutation,
  useDeleteTestimonialMutation,
} = testimonialApi;
