// src/components/chat/SellerInbox.tsx
import { useSelector, useDispatch } from "react-redux";
import { useGetUserConversationsQuery } from "@/services/chatApi";
import { useGetUserByIdQuery } from "@/services/authApi";
import type { RootState } from "@/app/store";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import type { IConversation } from "@/types/chat";
import { clearChatUnread } from "@/app/slices/notificationSlice";

function BuyerInfo({ buyerId }: { buyerId: string }) {
  const { data: user, isLoading } = useGetUserByIdQuery(buyerId);
  if (isLoading) return <span className="animate-pulse text-gray-400">Loading...</span>;

  return (
    <p className="font-semibold">
      Chat with {user?.name || buyerId}
    </p>
  );
}

export default function Inbox() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const unreadMap = useSelector((state: RootState) => state.notification.chatUnreadMap);

  const { data, isLoading } = useGetUserConversationsQuery(currentUser?.id ?? "", {
    skip: !currentUser?.id,
  });
  console.log(data);
  
  
  

  const conversations: IConversation[] = data || [];

  if (isLoading) return <div className="p-4">Loading conversations...</div>;

  const handleClick = (buyerId: string) => {
    // Adjusted to match your slice payload
    dispatch(clearChatUnread({ senderId: buyerId }));
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Buyer Messages</h1>
      {conversations.length === 0 ? (
        <p className="text-gray-500">You have no messages yet.</p>
      ) : (
        conversations.map((conv) => {
          const member = conv.members.find(
            (m: any) => (typeof m === "object" ? m._id !== currentUser?.id : m !== currentUser?.id)
          );
          const buyerId = typeof member === "object" ? member._id : member;
          if (!buyerId) return null;

          const hasUnread = unreadMap?.[buyerId] ?? false;

          return (
            <Link
              to={`/chat/${buyerId}`}
              key={conv._id}
              onClick={() => handleClick(buyerId)}
            >
              <Card className="p-4 hover:bg-gray-100 cursor-pointer flex justify-between items-center">
                <BuyerInfo buyerId={buyerId} />
                {hasUnread && (
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full" />
                )}
              </Card>
            </Link>
          );
        })
      )}
    </div>
  );
}
