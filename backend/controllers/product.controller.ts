import { Request, Response } from "express";
import { Product } from "../models/product.model";
import mongoose from "mongoose";

export const createProduct =async(req:Request,res:Response)=>{
   try {
    const {
      title,
      description,
      price,
      category,
      brand,
      imageUrls,
      quantity,
      weight,
      sellerId,
      latitude,
      longitude,
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const location = {
      type: 'Point' as const,
      coordinates: [parseFloat(longitude), parseFloat(latitude)], // [lng, lat]
    };

    const newProduct = new Product({
      title,
      description,
      price,
      category,
      brand,
      imageUrls,
      quantity,
      weight,
      sellerId: new mongoose.Types.ObjectId(sellerId),
      location,
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({ success: true, data: savedProduct });
    } catch (error) {
        console.log(error);
        
    }
}

export const getAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await Product.find();
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      price,
      category,
      brand,
      imageUrls,
      quantity,
      weight,
      sellerId,
      latitude,
      longitude,
    } = req.body;

    const updateData: any = {
      title,
      description,
      price,
      category,
      brand,
      imageUrls,
      quantity,
      weight,
      sellerId: sellerId ? new mongoose.Types.ObjectId(sellerId) : undefined,
    };

    if (latitude && longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
