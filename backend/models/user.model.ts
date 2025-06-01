import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';



export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  googleId?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String,required:true  }, // not required if using Google login
    avatarUrl: { type: String },
    isAdmin: { type: Boolean, default: false },
    googleId: { type: String },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
  resetToken : { type: String },
  resetTokenExpiry: { type: Date },
  },
  { timestamps: true }
);

// Index for location-based features (optional)
userSchema.index({ location: '2dsphere' });
userSchema.pre<IUser>('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
  }
  next();
}
);


export const User = mongoose.model<IUser>('User', userSchema);
