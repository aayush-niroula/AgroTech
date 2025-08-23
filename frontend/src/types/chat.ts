export interface IUser {
  _id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}
export interface IAuthUser extends IUser {
  token: string;
}


export interface IConversation {
  _id: string;
  members: IUser[]; 
  updatedAt: string;
  createdAt: string;
  unreadCount?: number;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string; 
  text: string;
  read: boolean;      
  createdAt: string;
}

export interface IMessageResponse {
  success: boolean;
  data: IMessage;
}
