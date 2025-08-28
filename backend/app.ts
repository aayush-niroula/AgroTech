import express from "express";
import dotenv from "dotenv";
import { userRoutes } from "./routes/user.routes";
import { dbConnection } from "./config/dbConfig";
import productRoutes from "./routes/product.routes";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import chatRoutes from "./routes/chat.routes";
import notificationRoutes from "./routes/notification.routes";
import { setupSocketIO } from "./utils/socketService";
import { reviewRoutes } from "./routes/review.routes";
import testimonialRoutes from "./routes/testimonial.routes";
import { adminRoutes } from "./routes/admin.routes";

dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;


const activeUsers = new Map<string, string>(); 

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
app.use("/api/admin",adminRoutes)

dbConnection();

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});
+

setupSocketIO(io, activeUsers);


server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});