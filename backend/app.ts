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
import notificationRoutes from "./routes/notification.routes";
import { setupSocketIO } from "./utils/socketService";
import { reviewRoutes } from "./routes/review.routes";
import testimonialRoutes from "./routes/testimonial.routes";

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
app.use("/api/notifications", notificationRoutes);
app.use("/api/review",reviewRoutes)
app.use("/api/testimonial",testimonialRoutes)

dbConnection();

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});


setupSocketIO(io, activeUsers);
// io.on("connection", (socket) => {
//   console.log("⚡ New client connected", socket.id);

//   // Track online users
//   socket.on("addUser", (userId: string) => {
//     activeUsers.set(userId, socket.id);
//     console.log("Active Users:", Array.from(activeUsers.keys()));
//   });

//   // Join conversation room
//   socket.on("join_conversation", (conversationId: string) => {
//     socket.join(conversationId);
//     console.log(User joined conversation: ${conversationId});
//   });

//   // Listen for new messages from client
//   socket.on("send_message", ({ conversationId, message }) => {
//     console.log(message)
//     // Normalize message to match frontend's Message interface
//     const normalizedMessage = {
//       _id: message._id?.toString() || new mongoose.Types.ObjectId().toString(),
//       senderId: message.senderId?.toString() || "",
//       receiverId: message.receiverId?.toString() || "",
//       text: message.text || "Message content missing",
//       timestamp: message.createdAt
//         ? new Date(message.createdAt).toISOString()
//         : new Date().toISOString(),
//     };
    
//     // Emit to all clients in the conversation room
//     io.to(conversationId).emit("receive_message", normalizedMessage);
//     console.log("Emitting receive_message:", normalizedMessage);
//   });

//   socket.on("disconnect", () => {
//     activeUsers.forEach((value, key) => {
//       if (value === socket.id) activeUsers.delete(key);
//     });
//     console.log("Client disconnected", socket.id);
//   });
// });

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});