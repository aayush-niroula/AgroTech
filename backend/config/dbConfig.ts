import mongoose from 'mongoose';
export const dbConnection= async ():Promise<void> => {
  try {
    // Load environment variables from .env file
    mongoose.connect(process.env.MONGODB_URL! )
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1); // Exit the process with failure
  }
}