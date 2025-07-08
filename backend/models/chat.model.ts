import mongoose, { Schema, Document } from 'mongoose';
import { ref } from 'process';

export interface IConversation extends Document {
  members:  mongoose.Types.ObjectId[]; 
  updatedAt: Date;
}
export interface IMessage extends Document {
 conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}
const conversationSchema = new Schema<IConversation>(
  {
    members: [{ type: Schema.Types.ObjectId,ref:"User", required: true }],
  },
  { timestamps: true }
);

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
     senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: { type: String, required: true },
  },
  { timestamps: true }
);



export const Message = mongoose.model<IMessage>('Message', messageSchema);
export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);