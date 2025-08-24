import { useSelector } from "react-redux";
import { useGetUserConversationsQuery } from "@/services/chatApi";
import { useGetUserByIdQuery } from "@/services/authApi";
import type { RootState } from "@/app/store";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import type { IConversation } from "@/types/chat";
import { useMarkConversationNotificationsAsReadMutation } from "@/services/notificationApi";
import { useEffect } from "react";
import type { Notification } from "@/types/chat";
import { useGetNotificationsQuery } from "@/services/notificationApi";
import { Socket, io } from "socket.io-client";

const socket: Socket = io("http://localhost:3000");

function BuyerInfo({ buyerId }: { buyerId: string }) {
  const { data: user, isLoading } = useGetUserByIdQuery(buyerId);
  
  if (isLoading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded-md w-32 animate-pulse"></div>
          <div className="h-3 bg-gray-100 rounded-md w-20 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : buyerId.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
          {initials}
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white truncate">
          {user?.name || `User ${buyerId.slice(-4)}`}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Buyer
        </p>
      </div>
    </div>
  );
}

export default function Inbox() {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { data: notifications = [], refetch } = useGetNotificationsQuery(undefined, {
    skip: !currentUser,
  });
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const [markConversationNotificationsAsRead] = useMarkConversationNotificationsAsReadMutation();

  const { data, isLoading } = useGetUserConversationsQuery(currentUser?.id ?? "", {
    skip: !currentUser?.id,
  });

  const conversations: IConversation[] = data || [];

  useEffect(() => {
    socket.on("receive_notification", () => {
      refetch();
    });

    return () => {
      socket.off("receive_notification");
    };
  }, [refetch]);

  useEffect(() => {
    if (conversationId) {
      markConversationNotificationsAsRead(conversationId).catch((error) => {
        console.error(`Failed to mark notifications for conversation ${conversationId} as read:`, error);
      });
    }
  }, [conversationId, markConversationNotificationsAsRead]);

  const handleClick = async (conversationId: string) => {
    try {
      await markConversationNotificationsAsRead(conversationId).unwrap();
    } catch (error) {
      console.error(`Failed to mark notifications for conversation ${conversationId} as read:`, error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
        <div className="max-w-4xl mx-auto p-6">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-100 dark:to-blue-400 bg-clip-text text-transparent">
              Messages
            </h1>
            {unreadCount > 0 && (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount} unread
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300">Connect with your buyers and manage conversations</p>
        </div>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No messages yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              When buyers reach out to you, their messages will appear here. Start connecting with potential customers!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => {
              const member = conv.members.find(
                (m: any) => (typeof m === "object" ? m._id !== currentUser?.id : m !== currentUser?.id)
              );
              const buyerId = typeof member === "object" ? member._id : member;
              if (!buyerId) return null;

              const hasUnread = notifications.some(
                (n) => n.conversationId === conv._id && !n.isRead
              );

              return (
                <Link
                  to={`/chat/${buyerId}?conversationId=${conv._id}`}
                  key={conv._id}
                  onClick={() => handleClick(conv._id)}
                  className="block group"
                >
                  <Card className={`
                    p-6 transition-all duration-200 ease-in-out cursor-pointer border-0 shadow-sm
                    ${hasUnread 
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-lg border-l-4 border-l-blue-500 dark:border-l-blue-400' 
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                    group-hover:shadow-md group-hover:scale-[1.02] transform
                  `}>
                    <div className="flex items-center justify-between">
                      <BuyerInfo buyerId={buyerId} />
                      
                      <div className="flex items-center space-x-3">
                        {hasUnread && (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-semibold rounded-full animate-pulse">
                              !
                            </span>
                          </div>
                        )}
                        
                        <svg 
                          className={`w-5 h-5 transform transition-transform group-hover:translate-x-1 ${
                            hasUnread ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    
                    {hasUnread && (
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          💬 New message available
                        </p>
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {conversations.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}