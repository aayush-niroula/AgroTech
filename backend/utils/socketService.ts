import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { Notification } from '../models/notification.model';
import { Conversation } from '../models/chat.model';


export const setupSocketIO = (io: Server, activeUsers: Map<string, string>) => {
  io.on('connection', (socket: Socket) => {
    console.log('⚡ New client connected', socket.id);

    // Track online users
    socket.on('addUser', (userId: string) => {
      activeUsers.set(userId, socket.id);
      console.log('Active Users:', Array.from(activeUsers.keys()));
      io.emit('activeUsers', Array.from(activeUsers.keys()));
    });

    // Join conversation room
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(conversationId);
      console.log(`User joined conversation: ${conversationId}`);
    });

    // Listen for new messages from client
    socket.on('send_message', async ({ conversationId, message }) => {
      try {
        const normalizedMessage = {
          _id: message._id?.toString() || new mongoose.Types.ObjectId().toString(),
          senderId: message.senderId?.toString() || '',
          receiverId: message.receiverId?.toString() || '',
          text: message.text || 'Message content missing',
          timestamp: message.createdAt
            ? new Date(message.createdAt).toISOString()
            : new Date().toISOString(),
        };

        // Emit message to conversation room
        io.to(conversationId).emit('receive_message', normalizedMessage);
        console.log('Emitting receive_message:', normalizedMessage);

        // Create notification for the recipient
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          const recipientId = conversation.members.find(
            (member) => member.toString() !== normalizedMessage.senderId
          );
          if (recipientId) {
            const notification = new Notification({
              recipientId,
              senderId: normalizedMessage.senderId,
              conversationId,
              messageId: normalizedMessage._id,
              text: normalizedMessage.text,
            });
            await notification.save();

            // Populate sender details for notification
            const populatedNotification = await Notification.findById(notification._id)
              .populate('senderId', 'name');
            // console.log(populatedNotification, 'populatedNotification');
            // Emit notification to recipient's socket
            // console.log(activeUsers, 'activeUsers');
            // const recipientSocketId = activeUsers.get(recipientId.toString());
            // console.log(recipientSocketId, 'recipientSocketId');
            // if (recipientSocketId) {
              io.emit('receive_notification', {
                _id: populatedNotification?._id,
                sender: {
                  _id: populatedNotification?.senderId._id,
                  
                  
                },
                conversationId,
                messageId: normalizedMessage._id,
                text: normalizedMessage.text,
                isRead: populatedNotification?.isRead,
                createdAt: populatedNotification?.createdAt,
              });
            // }
          }
        }
      } catch (error) {
        console.error('Error handling send_message:', error);
      }
    });

    socket.on('disconnect', () => {
      activeUsers.forEach((value, key) => {
        if (value === socket.id) activeUsers.delete(key);
      });
      console.log('Client disconnected', socket.id);
      io.emit('activeUsers', Array.from(activeUsers.keys()));
    });
  });
};