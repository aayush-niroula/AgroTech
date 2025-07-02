import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { userRoutes } from './routes/user.routes';
import { dbConnection } from './config/dbConfig';
import productRoutes from './routes/product.routes';
import cors from 'cors'

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",  
    credentials: true,                 
  })
);
app.use('/api/users',userRoutes);
app.use('/api/products',productRoutes)
app.use('/uploads',express.static('uploads'))
dbConnection();
// Start the server

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 





