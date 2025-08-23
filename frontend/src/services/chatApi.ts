import type { IConversation, IMessage } from "@/types/chat";
import { api } from "./api";

export const chatApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Get all conversations of a user
    getUserConversations: build.query<IConversation[], string>({
      query: (userId) => `/chat/conversations/${userId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Conversation" as const, id: _id })),
              { type: "Conversation", id: "LIST" },
            ]
          : [{ type: "Conversation", id: "LIST" }],
      transformResponse: (response: { success: boolean; data: IConversation[] }) =>
        response.data,
    }),

    // Create or get a conversation
    createOrGetConversation: build.mutation<
      IConversation,
      { buyerId: string; sellerId: string; productId?: string }
    >({
      query: ({ buyerId, sellerId, productId }) => ({
        url: `/chat/conversation`,
        method: "POST",
        body: { buyerId, sellerId, productId },
      }),
      transformResponse: (response: { success: boolean; data: IConversation }) =>
        response.data,
      invalidatesTags: [{ type: "Conversation", id: "LIST" }],
    }),

    // Get messages in a conversation
    getMessages: build.query<IMessage[], string>({
      query: (conversationId) => `/chat/messages/${conversationId}`,
      providesTags: (result, error, conversationId) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Message" as const, id: _id })),
              { type: "Message", id: conversationId },
            ]
          : [{ type: "Message", id: conversationId }],
      transformResponse: (response: { success: boolean; data: IMessage[] }) =>
        response.data,
    }),

    // Send a message
    sendMessage: build.mutation<
      IMessage,
      { conversationId: string; sender: string; text: string }
    >({
      query: ({ conversationId, sender, text }) => ({
        url: `/chat/message`,
        method: "POST",
        body: { conversationId, sender, text },
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Message", id: conversationId },
        { type: "Conversation", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserConversationsQuery,
  useCreateOrGetConversationMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
} = chatApi;
