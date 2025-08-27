import { Request, Response } from "express";
import mongoose from "mongoose";
import { Conversation, Message } from "../models/chat.model";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// Create or get existing conversation
export const createOrGetConversation = async (req: AuthenticatedRequest, res: Response) => {
  const  userId  = req.userId;
  const { sellerId } = req.params;

  if (!userId || !sellerId) {
    return res.status(400).json({ message: "Missing userId or sellerId" });
  }

  try {
    let conversation = await Conversation.findOne({
      members: { $all: [userId, sellerId] },
    }).populate("members","name avatarUrl")

    if (!conversation) {
      conversation = new Conversation({ members: [userId, sellerId] });
      await conversation.save();
      await conversation.populate("members", "name avatarUrl");
    }

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ message: "Failed to create or find conversation" });
  }
};

// Send message
export const sendMessage = async (req: Request, res: Response) => {
  const { text, sender } = req.body;
  const { conversationId } = req.params;

  if (!text || !sender || !conversationId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const message = new Message({
      conversationId,
      senderId:sender,
      text,
    });
    await message.save();

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Failed to send message" });
  }
};

// Get messages in a conversation
export const getMessages = async (req: Request, res: Response) => {
  const { conversationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({ message: "Invalid conversation ID" });
  }

  try {
    const messages = await Message.find({ conversationId })
      .populate("senderId", "name avatarUrl")
      .sort({ createdAt: 1 });
    // console.log("messages", messages);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// Get user conversations
export const getUserConversations = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    const conversations = await Conversation.find({ members: userId })
      .populate("members", "name avatarUrl")
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};