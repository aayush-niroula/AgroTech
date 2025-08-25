import mongoose, { Schema, Document } from "mongoose";

export interface IReply extends Document {
  user: mongoose.Types.ObjectId;
  comment: string;
  createdAt: Date;
}

export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number; // 1-5
  comment: string;
  replies: IReply[];
  createdAt: Date;
  updatedAt: Date;
}

const replySchema = new Schema<IReply>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const reviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    replies: [replySchema],
  },
  { timestamps: true }
);

export const Review = mongoose.model<IReview>("Review", reviewSchema);
