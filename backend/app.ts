import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { userRoutes } from "./routes/user.routes";
import { dbConnection } from "./config/dbConfig";
import productRoutes from "./routes/product.routes";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import chatRoutes from "./routes/chat.routes";
import { Conversation, Message } from "./models/chat.model";

dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Single active users map
const activeUsers = new Map<string, string>(); // userId -> socketId

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/chat", chatRoutes);

dbConnection();

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ New client connected", socket.id);

  // Track online users
  socket.on("addUser", (userId: string) => {
    activeUsers.set(userId, socket.id);
    console.log("Active Users:", Array.from(activeUsers.keys()));
  });

  // Send message in real-time
  socket.on("sendMessage", async (data) => {
    const { conversationId, sender, text } = data;
    try {
      // Save message
      const message = await Message.create({ conversationId, sender, text });

      // Update last message in conversation
      await Conversation.findByIdAndUpdate(conversationId, { lastMessage: text });

      // Notify all members except sender
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;
      conversation.members.forEach((memberId) => {
        if (memberId.toString() !== sender) {
          const socketId = activeUsers.get(memberId.toString());
          if (socketId) {
            io.to(socketId).emit("getMessage", {
              message,
              senderId: sender,
              conversationId,
            });
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  });

  // Remove disconnected users
  socket.on("disconnect", () => {
    activeUsers.forEach((value, key) => {
      if (value === socket.id) activeUsers.delete(key);
    });
    console.log("Client disconnected", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
