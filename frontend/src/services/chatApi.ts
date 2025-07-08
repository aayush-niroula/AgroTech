import type { IConversation, IMessage } from "@/types/chat";
import { api } from "./api";
export const chatApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUserConversations: build.query<IConversation[], string>({
      query: (userId) => `/chat/conversation/${userId}`,
      providesTags: ["Conversation"],
    }),

    createOrGetConversation: build.mutation<
      IConversation,
      { sellerId: string }
    >({
      query: ({ sellerId }) => ({
        url: `/chat/conversation/${sellerId}`,
        method: "POST",
      }),
      transformResponse: (response: {
        success: boolean;
        data: IConversation;
      }) => response.data,
      invalidatesTags: ["Conversation"],
    }),

    getMessages: build.query<IMessage[], string>({
      query: (conversationId) => `/chat/message/${conversationId}`,
      providesTags: ["Message"],
      transformResponse: (response: { success: boolean; data: IMessage[] }) =>
        response.data,
    }),

    sendMessage: build.mutation<
      IMessage,
      { conversationId: string; senderId: string; text: string }
    >({
      query: ({ conversationId, senderId, text }) => ({
        url: `/chat/message/${conversationId}`,
        method: "POST",
        body: { senderId, text },
      }),
      invalidatesTags: ["Message"],
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
