import mongoose ,{Document,Schema}from "mongoose";

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  imageUrls: string[];
  quantity: number;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  weight: number; // for recommendation system
  sellerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema<IProduct>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  imageUrls: { type: [String], required: true },
  quantity: { type: Number, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  weight: { type: Number, required: true }, // for recommendation system
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

productSchema.index({location:'2dsphere'})

export const Product = mongoose.model<IProduct>('Product',productSchema)