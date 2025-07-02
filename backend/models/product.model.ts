import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  imageUrl: string;
  quantity: number;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  weight: number;
  sellerId: mongoose.Types.ObjectId;
  views: number;
  favorites: number;
  soldCount: number;
  rating: number; 
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema<IProduct>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  imageUrl: { type: String, required: true },
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
  weight: { type: Number, required: true }, 
  views: { type: Number, default: 0 },         // How many times the product is viewed
  favorites: { type: Number, default: 0 },     // How many times it's favorited
  soldCount: { type: Number, default: 0 },     // Number of sales
  rating: { type: Number, default: 0 },        // Average rating from reviews

  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

productSchema.index({ location: '2dsphere' });

export const Product = mongoose.model<IProduct>('Product', productSchema);
