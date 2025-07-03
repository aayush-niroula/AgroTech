import type { ApiResponse, IProduct } from "@/types/product";
import { api } from "./api";

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
   
    createProduct: builder.mutation<
      IProduct,
      Partial<IProduct> & { latitude: number; longitude: number }
    >({
      query: (data) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value as any);
          }
        });
        return {
          url: '/products/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Product'],
    }),

  
    getProducts: builder.query<
      ApiResponse,
      { category?: string; brand?: string; coordinates?: string; maxDistance?: number } | void
    >({
      query: (params) => {
        const query = params
          ? '?' +
            new URLSearchParams(
              Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== undefined) acc[key] = String(value);
                return acc;
              }, {} as Record<string, string>)
            ).toString()
          : '';
        return {
          url: `/products${query}`,
          method: 'GET',
        };
      },
      providesTags: ['Product'],
    }),

    // ✅ Get Single Product by ID
    getProductById: builder.query<IProduct, string>({
      query: (id) => `/products/${id}`,
      providesTags: ['Product'],
    }),

    // ✅ Update Product
    updateProduct: builder.mutation<
      IProduct,
      { id: string; data: Partial<IProduct> & { latitude?: number; longitude?: number } }
    >({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Product'],
    }),

    // ✅ Delete Product
    deleteProduct: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),

    // ✅ Get Recommended Products
    getRecommendedProducts: builder.query<
      IProduct[],
      { productId: string; coordinates: string }
    >({
      query: ({ productId, coordinates }) =>
        `/products/recommendations?productId=${productId}&coordinates=${coordinates}`,
      providesTags: ['Product'],
    }),

    // ✅ Increment Product View
    incrementProductView: builder.mutation<{ message: string }, string>({
      query: (productId) => ({
        url: `/products/${productId}/view`,
        method: 'POST',
      }),
      invalidatesTags: ['Product'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateProductMutation,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetRecommendedProductsQuery,
  useIncrementProductViewMutation,
} = productApi;
