import mongoose, { Schema, Document } from 'mongoose';

// Notification Interface
export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  messageId: mongoose.Types.ObjectId;
  text: string;
  isRead: boolean;
  createdAt: Date;
}

// Notification Schema
const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);