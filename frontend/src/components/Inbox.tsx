// src/components/chat/SellerInbox.tsx
import { useSelector } from "react-redux";
import { useGetUserConversationsQuery } from "@/services/chatApi";
import { useGetUserByIdQuery } from "@/services/authApi";
import type { RootState } from "@/app/store";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import type { IConversation } from "@/types/chat";


function BuyerInfo({ buyerId }: { buyerId: string }) {
  const { data: user, isLoading } = useGetUserByIdQuery(buyerId);
console.log(user);

  if (isLoading) {
    return <span className="animate-pulse text-gray-400">Loading...</span>
  }

  return (
    <p className="font-semibold">
      Chat with {user?.name || buyerId}
    </p>
  );
}

export default function Inbox() {
  const currentUser = useSelector((state: RootState) => state.auth.user);


  const { data, isLoading, isError } = useGetUserConversationsQuery(currentUser?.id ?? "", {
    skip: !currentUser?.id
  });
  console.log(data);
  

  const conversations:IConversation[] = data?.data || [];
  if (isLoading) return <div className="p-4">Loading conversations...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Buyer Messages</h1>
      {conversations.length === 0 ? (
        <p className="text-gray-500">You have no messages yet.</p>
      ) : (
        conversations.map((conv:IConversation) => {
       const member = conv.members.find((m: any) =>
    typeof m === "object" ? m._id !== currentUser?.id : m !== currentUser?.id
  );
  const buyerId = typeof member === "object" ? member._id : member;

  if (!buyerId) return null;
        
          if (!buyerId) return null;
          return (
            <Link to={`/chat/${buyerId}`} key={conv._id}>
              <Card className="p-4 hover:bg-gray-100 cursor-pointer">
                <BuyerInfo buyerId={buyerId} />
              </Card>
            </Link>
          );
        })
      )}
    </div>
  );
}
