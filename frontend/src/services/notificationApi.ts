// @/services/notificationApi.ts
import { api } from "./api";

interface Notification {
  _id: string;
  senderId: {
    _id: string;
    name: string;
  };
  conversationId: string;
  messageId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = api.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<Notification[], void>({
      query: () => "/notifications",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Notification" as const, id: _id })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
      transformResponse: (response: { success: boolean; data: Notification[] }) =>
        response.data,
    }),

    markNotificationAsRead: build.mutation<Notification, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, notificationId) => [
        { type: "Notification", id: notificationId },
        { type: "Notification", id: "LIST" },
      ],
      transformResponse: (response: { success: boolean; data: Notification }) =>
        response.data,
    }),

    markConversationNotificationsAsRead: build.mutation<Notification[], string>({
      query: (conversationId) => ({
        url: `/notifications/${conversationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, conversationId) => [
        { type: "Notification", id: "LIST" },
        { type: "Conversation", id: conversationId },
      ],
      transformResponse: (response: { success: boolean; data: Notification[] }) =>
        response.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkConversationNotificationsAsReadMutation,
} = notificationApi;
