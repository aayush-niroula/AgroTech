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

interface User {
  _id: string;
  name?: string;
  avatarUrl?: string;
}

interface Message {
  _id?: string;
  id?: string;
  senderId: string | User;
  receiverId: string;
  text: string;
  timestamp: string;
  createdAt?: string;
}

interface Conversation {
  _id: string;
  members: User[];
}

export default function ChatPage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sellerName, setSellerName] = useState('');
  const [sellerAvatar, setSellerAvatar] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [createOrGetConversation] = useCreateOrGetConversationMutation();
  const { data: messagesData } = useGetMessagesQuery(conversationId || '', {
    skip: !conversationId,
  });
  const [sendMessageMutation] = useSendMessageMutation();

  // 🔹 Initialize conversation + socket
  useEffect(() => {
    if (!sellerId || !currentUser?.id) {
      console.log('Missing sellerId or user, skipping conversation init');
      return;
    }

    let socket: Socket | null = null;

    const initialize = async () => {
      try {
        const result = await createOrGetConversation({
          buyerId: currentUser.id,
          sellerId,
        }).unwrap();

        setConversation(result);
        setConversationId(result._id);

        // Extract seller info
        const otherUser = result.members.find((m: User) => m._id !== currentUser.id);
        setSellerName(otherUser?.name || 'Seller');
        setSellerAvatar(otherUser?.avatarUrl || '');

        // Setup socket
        socket = io('http://localhost:3000');
        socketRef.current = socket;
        socket.emit('join_conversation', result._id);

        socket.on('receive_message', (message: Message) => {
          const normalizedMessage: Message = {
            _id: message._id,
            id: message.id,
            senderId: message.senderId,
            receiverId: message.receiverId || sellerId || '',
            text: message.text || 'Message content missing',
            timestamp: message.timestamp || message.createdAt || new Date().toISOString(),
          };
          setMessages((prev) => {
            if (prev.some((m) => m._id === normalizedMessage._id && m._id)) return prev;
            return [...prev, normalizedMessage];
          });
        });
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
      }
    };

    initialize();

    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [sellerId, currentUser?.id, createOrGetConversation]);

  // 🔹 Load messages from API
  useEffect(() => {
    if (!messagesData || !currentUser?.id || !sellerId) return;

    const mappedMessages = messagesData.map((msg) => ({
      _id: msg._id,
      senderId: msg.senderId,
      receiverId: msg.senderId === currentUser.id ? sellerId : currentUser.id,
      text: msg.text,
      timestamp: msg.createdAt || msg.timestamp || new Date().toISOString(),
    }));
    setMessages(mappedMessages);
  }, [messagesData, currentUser?.id, sellerId]);

  // 🔹 Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 🔹 Handle send
  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || !currentUser?.id || !sellerId) {
      console.warn('Cannot send message: missing input or context');
      return;
    }

    const tempMessage: Message = {
      id: Math.random().toString(36).substring(2),
      senderId: currentUser.id,
      receiverId: sellerId,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const sentMsg = await sendMessageMutation({
        conversationId,
        sender: currentUser.id,
        text: tempMessage.text,
      }).unwrap();

      socketRef.current?.emit('send_message', {
        conversationId,
        message: {
          _id: sentMsg._id,
          senderId: currentUser.id,
          receiverId: sellerId,
          text: tempMessage.text,
          timestamp: sentMsg.createdAt || sentMsg.timestamp || new Date().toISOString(),
        },
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMessage.id
            ? {
                _id: sentMsg._id,
                id: tempMessage.id,
                senderId: sentMsg.senderId,
                receiverId: sellerId,
                text: sentMsg.text,
                timestamp: sentMsg.createdAt || sentMsg.timestamp || new Date().toISOString(),
              }
            : m
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!currentUser) return <div className="p-4">Please login to chat.</div>;
  if (!sellerId) return <div className="p-4">No seller selected.</div>;

  return (
    <div className="max-w-xl mx-auto p-4 h-screen flex flex-col border rounded shadow">
      {/* 🔹 Header with avatar */}
      <header className="flex items-center gap-3 mb-4 border-b pb-2">
        {sellerAvatar ? (
          <img
            src={sellerAvatar}
            alt={sellerName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300" />
        )}
        <h1 className="text-xl font-bold">{sellerName || 'Seller'}</h1>
      </header>

      {/* 🔹 Messages */}
      <main className="flex-grow overflow-auto mb-4 space-y-2 flex flex-col">
        {messages.map((msg) => {
          const isMe =
            typeof msg.senderId === 'object' && msg.senderId !== null && '_id' in msg.senderId
              ? msg.senderId._id === currentUser.id
              : msg.senderId === currentUser.id;

          const validTimestamp =
            msg.timestamp && !isNaN(new Date(msg.timestamp).getTime())
              ? new Date(msg.timestamp).toLocaleTimeString()
              : 'Unknown time';

          const senderAvatar =
            typeof msg.senderId === 'object' && msg.senderId?.avatarUrl
              ? msg.senderId.avatarUrl
              : isMe
              ? currentUser.avatarUrl
              : sellerAvatar;

          return (
            <div
              key={msg._id || msg.id || Math.random().toString(36).substring(2)}
              className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && senderAvatar && (
                <img
                  src={senderAvatar}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div
                className={`max-w-[70%] p-2 rounded-xl shadow ${
                  isMe
                    ? 'bg-green-500 text-white rounded-br-none'
                    : 'bg-gray-300 text-gray-900 rounded-bl-none'
                }`}
              >
                <p>{msg.text || 'No content'}</p>
                <small className="text-xs text-gray-700">{validTimestamp}</small>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* 🔹 Input */}
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
          onClick={handleSend}
          className="bg-green-600 text-white px-4 rounded hover:bg-green-700"
        >
          Send
        </button>
      </footer>
    </div>
  );
}
