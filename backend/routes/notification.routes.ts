import express from 'express';
import mongoose from 'mongoose';
import type { Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { Notification } from '../models/notification.model';

const notificationRoutes = express.Router();

// Get notifications for a user
notificationRoutes.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: 'Missing userId' });
    return;
  }

  try {
    const notifications = await Notification.find({ recipientId: userId })
      .populate('senderId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
notificationRoutes.post('/:notificationId/read', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { notificationId } = req.params;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    res.status(400).json({ message: 'Invalid notification ID' });
    return;
  }

  try {
    const notification = await Notification.findOne({ _id: notificationId, recipientId: userId });
    if (!notification) {
      res.status(404).json({ message: 'Notification not found or unauthorized' });
      return;
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});


notificationRoutes.patch('/:conversationId/read', authMiddleware, async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    res.status(400).json({ message: 'Invalid conversation ID' });
    return;
  }

  try {
    const notifications = await Notification.updateMany(
      { conversationId, recipientId: userId, isRead: false },
      { $set: { isRead: true } }
    );

   
    const updatedNotifications = await Notification.find({ conversationId, recipientId: userId })
      .populate('senderId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: updatedNotifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to mark conversation notifications as read' });
  }
});

export default notificationRoutes;