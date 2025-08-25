import { api } from "./api";
import type { ApiResponse, IProduct } from "@/types/product";

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Create Product
    createProduct: builder.mutation<IProduct, FormData>({
      query: (formData) => ({
        url: "/products",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Product"],
    }),

    // ✅ Get All Products
    getAllProducts: builder.query<ApiResponse<IProduct[]>, void>({
      query: () => "/products",
      providesTags: ["Product"],
    }),

    // ✅ Get Products with Filters/Location
    getProducts: builder.query<
      ApiResponse<IProduct[]>,
      { category?: string; brand?: string; coordinates?: string; maxDistance?: number }
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.category) query.set("category", params.category);
        if (params?.brand) query.set("brand", params.brand);
        if (params?.coordinates) query.set("coordinates", params.coordinates);
        if (params?.maxDistance) query.set("maxDistance", params.maxDistance.toString());

        return {
          url: `/products/search${query.toString() ? `?${query.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Product"],
    }),

    // ✅ Get Product by ID
    getProductById: builder.query<ApiResponse<IProduct>, string>({
      query: (id) => `/products/${id}`,
      providesTags: ["Product"],
    }),

    // ✅ Update Product
    updateProduct: builder.mutation<
      IProduct,
      { id: string; data: Partial<IProduct> }
    >({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),

    // ✅ Delete Product
    deleteProduct: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),

    // ✅ Get Recommendations for a Product
    getRecommendedProducts: builder.query<
      IProduct[],
      { productId: string; coordinates: string }
    >({
      query: ({ productId, coordinates }) =>
        `/products/recommendations?productId=${productId}&coordinates=${coordinates}`,
      providesTags: ["Product"],
    }),

    // ✅ Increment Product View
    incrementProductView: builder.mutation<{ message: string }, string>({
      query: (productId) => ({
        url: `/products/${productId}/view`,
        method: "POST",
      }),
      invalidatesTags: ["Product"],
    }),

    // ✅ Toggle Favorite
    toggleFavorite: builder.mutation<
      { message: string; favorites?: number },
      { productId: string; increment: boolean }
    >({
      query: ({ productId, increment }) => ({
        url: `/products/${productId}/favorite`,
        method: "POST",
        body: { increment },
      }),
      invalidatesTags: ["Product"],
    }),

    // ✅ Increment Chat Count
    incrementChatCount: builder.mutation<{ message: string }, string>({
      query: (productId) => ({
        url: `/products/${productId}/chatCount`,
        method: "POST",
      }),
      invalidatesTags: ["Product"],
    }),

    // ✅ Record Product View Behavior
    recordViewBehavior: builder.mutation<{ message: string }, string>({
      query: (productId) => ({
        url: `/products/${productId}/record-view`,
        method: "POST",
      }),
      invalidatesTags: ["Product"],
    }),

    // ✅ Get Personalized Recommendations
    getPersonalizedRecommendations: builder.query<ApiResponse<IProduct[]>, void>({
      query: () => "/products/personalized",
      providesTags: ["Product"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateProductMutation,
  useGetAllProductsQuery,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetRecommendedProductsQuery,
  useIncrementProductViewMutation,
  useToggleFavoriteMutation,
  useIncrementChatCountMutation,
  useRecordViewBehaviorMutation,
  useGetPersonalizedRecommendationsQuery,
} = productApi;