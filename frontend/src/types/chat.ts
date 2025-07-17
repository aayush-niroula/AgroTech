export interface IUser {
  _id: string;
  name: string;
  email?: string; 
}

export interface IConversation {
  _id: string;
  members: IUser[]; 
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
