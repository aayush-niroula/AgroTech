// src/services/adminApi.ts
import { api } from "./api";
import type { IProduct } from "@/types/product";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ------------------ GET ALL USERS ------------------
    getAllUsers: builder.query<AdminUser[], void>({
      query: () => ({
        url: "/admin/users",
        method: "GET",
      }),
      transformResponse: (response: { success: boolean; data: AdminUser[] }) =>
        response.data,
      providesTags: ["User"],
    }),

    // ------------------ DELETE USER ------------------
    deleteUser: builder.mutation<{ message: string }, string>({
      query: (userId) => ({
        url: `/admin/user/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    // ------------------ PROMOTE USER TO ADMIN ------------------
    makeUserAdmin: builder.mutation<
      { message: string; user: AdminUser },
      string
    >({
      query: (userId) => ({
        url: `/admin/user/${userId}/make-admin`,
        method: "PATCH",
      }),
      invalidatesTags: ["User"],
    }),

    // ------------------ GET A USER'S PRODUCTS ------------------
    getUserProductsByAdmin: builder.query<IProduct[], string>({
      query: (userId) => ({
        url: `/admin/user/${userId}/products`,
        method: "GET",
      }),
      transformResponse: (response: { success: boolean; data: IProduct[] }) =>
        response.data,
      providesTags: ["Product"],
    }),

    // ------------------ DELETE PRODUCT ------------------
    deleteUserProduct: builder.mutation<{ message: string }, string>({
      query: (productId) => ({
        url: `/admin/product/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useDeleteUserMutation,
  useMakeUserAdminMutation,
  useGetUserProductsByAdminQuery,
  useDeleteUserProductMutation,
} = adminApi;
