import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store'; 
import {
  useCreateOrGetConversationMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
} from '@/services/chatApi'; 

interface Message {
  _id?: string;
  id?: string;  
  senderId: string | { _id: string };
  receiverId: string;
  text: string;
  timestamp: string;
}

export default function ChatPage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Get logged in user from redux
  const currentUser = useSelector((state: RootState) => state.auth.user);
  console.log("Current User",currentUser);
  
  if (!currentUser) return <div className="p-4">Please login to chat.</div>;

  // RTK Query hooks
  const [createOrGetConversation] = useCreateOrGetConversationMutation();
  const { data: messagesData, refetch: refetchMessages } = useGetMessagesQuery(
    conversationId || '',
    { skip: !conversationId }
  );
  const [sendMessageMutation] = useSendMessageMutation();

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

 
  useEffect(() => {
    if (!sellerId || !currentUser) return;

    async function initConversation() {
      if (!currentUser) return; 
      try {
        const result = await createOrGetConversation({
          sellerId: sellerId || '',
        }).unwrap();
         console.log(result);
         
        setConversationId(result._id);
      } catch (error) {
        console.error('Failed to create/get conversation:', error);
      }
    }
    initConversation();
  }, [sellerId, currentUser, createOrGetConversation]);

  // Update messages state when messagesData from backend changes
  useEffect(() => {
    if (messagesData) {
      const mapped = messagesData.map((msg) => ({
        _id: msg._id,
        senderId: msg.senderId,
        receiverId: msg.senderId === currentUser.id ? sellerId || '' : currentUser.id,
        text: msg.text,
        timestamp: msg.createdAt,
      }));
      setMessages(mapped);
    }
  }, [messagesData, sellerId, currentUser]);

  // Setup socket connection and listeners
  useEffect(() => {
    if (!conversationId) return;

    socketRef.current = io('http://localhost:3000'); // Your backend URL
    const socket = socketRef.current;

    socket.emit('join_conversation', conversationId);

    socket.on('receive_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [conversationId]);

  // Handle sending a new message
const handleSend = async () => {
  console.log("🟢 Send button clicked");

  if (!newMessage.trim()) {
    console.warn("⚠️ Message is empty");
    return;
  }

  if (!conversationId) {
    console.warn("❌ No conversation ID");
    return;
  }

  console.log("📨 Preparing to send message:", newMessage, "to", sellerId);

  const message: Message = {
    id: Math.random().toString(36).substring(2),
    senderId: currentUser.id,
    receiverId: sellerId || '',
    text: newMessage.trim(),
    timestamp: new Date().toISOString(),
  };

  setMessages((prev) => [...prev, message]);
  setNewMessage('');

  try {
    const sentMsg = await sendMessageMutation({
      conversationId,
      senderId: currentUser.id,
      text: message.text,
    }).unwrap();

    console.log("✅ Sent to backend:", sentMsg);

    socketRef.current?.emit('send_message', {
      conversationId,
      message: {
        ...sentMsg,
        receiverId: sellerId,
      },
    });

    console.log("📡 Socket emit done");

    setMessages((prev) =>
      prev.map((m) =>
        m.id === message.id
          ? {
              _id: sentMsg._id,
              id: message.id,
              senderId: sentMsg.senderId,
              receiverId: sellerId || '',
              text: sentMsg.text,
              timestamp: sentMsg.createdAt,
            }
          : m
      )
    );
  } catch (error) {
    console.error("❌ Error sending message:", error);
  }
};


  if (!sellerId) return <div className="p-4">No seller selected.</div>;

  return (
    <div className="max-w-xl mx-auto p-4 h-screen flex flex-col border rounded shadow">
      <header className="text-xl font-bold mb-4 border-b pb-2">
        Chat with Seller: {sellerId}
      </header>

<main className="flex-grow overflow-auto mb-4 space-y-2 flex flex-col">
  {messages.map((msg) => {
   const isMe =
      typeof msg.senderId === 'object' && msg.senderId !== null && '_id' in msg.senderId
        ? msg.senderId._id === currentUser.id
        : msg.senderId === currentUser.id;

    
    console.log(isMe);
    
    return (
      <div
        key={msg._id || msg.id}
        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[70%] p-2 rounded-xl shadow ${
            isMe ? 'bg-green-500 text-white rounded-br-none' : 'bg-gray-300 text-gray-900 rounded-bl-none'
          }`}
        >
          <p>{msg.text}</p>
          <small className="text-xs text-gray-700">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </small>
        </div>
      </div>
    );
  })}
  <div ref={messagesEndRef} />
</main>

      <footer className="flex gap-2">
        <input
          type="text"
          className="flex-grow border rounded p-2"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <button
          onClick={
            handleSend}
          className="bg-green-600 text-white px-4 rounded hover:bg-green-700"
        >
          Send
        </button>
      </footer>
    </div>
  );
}
