export interface IConversation {
  _id: string;
  members: string[];
  updatedAt: string;
  createdAt: string;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}
