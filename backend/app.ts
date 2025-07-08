import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { userRoutes } from "./routes/user.routes";
import { dbConnection } from "./config/dbConfig";
import productRoutes from "./routes/product.routes";
import cors from "cors";
import chatRoutes from "./routes/chat.routes";
import http from "http";
import { Server } from "socket.io";
dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;


// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors(
  {
   origin: 'http://localhost:5173',
  credentials: true, 
  }
));

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chat", chatRoutes);
app.use("/uploads", express.static("uploads"));

dbConnection();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});
// Start the server
io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.on("join_conversation", (conversationId: string) => {
    socket.join(conversationId);
    console.log(`User joined room :${conversationId}`);
  });
  socket.on("send_message", (messageData) => {
    const { conversationId, message } = messageData;
    socket.to(conversationId).emit("receive_message", message);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
