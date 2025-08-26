import mongoose, { Document, Schema } from "mongoose";

export interface ITestimonial extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  role: string;
  content: string;
  rating: number;
  location: string;
  createdAt: Date;
}

const testimonialSchema = new Schema<ITestimonial>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    content: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    location: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITestimonial>("Testimonial", testimonialSchema);
