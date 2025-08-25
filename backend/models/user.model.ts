import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  googleId?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  activity: {
    viewedProducts: mongoose.Types.ObjectId[];
    favoritedProducts: mongoose.Types.ObjectId[];
    chattedProducts: mongoose.Types.ObjectId[];
  };
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatarUrl: { type: String },
    isAdmin: { type: Boolean, default: false },
    googleId: { type: String },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    activity: {
      viewedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      favoritedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      chattedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    },
  },
  { timestamps: true }
);

userSchema.pre<IUser>('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export const User = mongoose.model<IUser>('User', userSchema);
