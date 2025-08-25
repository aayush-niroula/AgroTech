import type { IReview } from "@/types/review"; 
import { api } from "./api";

export const reviewApi = api.injectEndpoints({
  endpoints: (build) => ({
    // 🔹 Get all reviews for a product
    getReviews: build.query<IReview[], string>({
      query: (productId) => `/review/${productId}`,
      providesTags: (result, _error, productId) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Review" as const, id: _id })),
              { type: "Review", id: `PRODUCT-${productId}` },
            ]
          : [{ type: "Review", id: `PRODUCT-${productId}` }],
      transformResponse: (response: { success?: boolean; data: IReview[] }) =>
        response.data ?? response,
    }),

    // 🔹 Add a review
    addReview: build.mutation<
      IReview,
      { productId: string; rating: number; comment: string }
    >({
      query: ({ productId, rating, comment }) => ({
        url: `/review/${productId}`,
        method: "POST",
        body: { rating, comment },
      }),
      transformResponse: (response: { success?: boolean; data: IReview }) =>
        response.data ?? response,
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Review", id: `PRODUCT-${productId}` },
      ],
    }),

    // 🔹 Reply to a review
    replyToReview: build.mutation<
      IReview,
      { reviewId: string; comment: string; productId: string }
    >({
      query: ({ reviewId, comment }) => ({
        url: `/review/${reviewId}/reply`,
        method: "POST",
        body: { comment },
      }),
      transformResponse: (response: { success?: boolean; data: IReview }) =>
        response.data ?? response,
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Review", id: `PRODUCT-${productId}` },
      ],
    }),

    // 🔹 Edit a review
    editReview: build.mutation<
      IReview,
      { reviewId: string; rating?: number; comment?: string; productId: string }
    >({
      query: ({ reviewId, rating, comment }) => ({
        url: `/review/${reviewId}`,
        method: "PUT",
        body: { rating, comment },
      }),
      transformResponse: (response: { success?: boolean; data: IReview }) =>
        response.data ?? response,
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Review", id: `PRODUCT-${productId}` },
      ],
    }),

    // 🔹 Delete a review
    deleteReview: build.mutation<
      { message: string },
      { reviewId: string; productId: string }
    >({
      query: ({ reviewId }) => ({
        url: `/review/${reviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Review", id: `PRODUCT-${productId}` },
      ],
    }),

    // 🔹 Delete a reply
    deleteReply: build.mutation<
      { message: string },
      { reviewId: string; replyId: string; productId: string }
    >({
      query: ({ reviewId, replyId }) => ({
        url: `/review/${reviewId}/reply/${replyId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Review", id: `PRODUCT-${productId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetReviewsQuery,
  useAddReviewMutation,
  useReplyToReviewMutation,
  useEditReviewMutation,
  useDeleteReviewMutation,
  useDeleteReplyMutation,
} = reviewApi;
