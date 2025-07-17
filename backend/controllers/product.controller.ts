import { Request, Response } from "express";
import { Product, UserBehavior } from "../models/product.model";
import mongoose from "mongoose";
import cloudinary from "../middleware/cloudinary";
import streamifier from "streamifier";
import  {parseCoordinates}  from "../utils/parseCordinates";

// Extend Express Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const createProduct =async(req:Request,res:Response)=>{
   try {
    const {
      title,
      description,
      price,
      category,
      brand,
      quantity,
      weight,
      sellerId,
      latitude,
      longitude,
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Product image is required' });
    }
     const uploadFromBuffer = (buffer: Buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "products" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };
   
  const result: any = await uploadFromBuffer(req.file.buffer);
    
   const imageUrl = result.secure_url;

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
      imageUrl,
      quantity,
      weight,
      sellerId: new mongoose.Types.ObjectId(sellerId),
      location,
    });

    const savedProduct = await newProduct.save();
    await savedProduct.populate("sellerId");

    res.status(201).json({ success: true, data: savedProduct });
    } catch (error) {
        console.log(error);
        
    }
}

export const getAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await Product.find().populate("sellerId");
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate("sellerId");
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
      imageUrl,
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
      imageUrl,
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
    }).populate("sellerId");

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


export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, brand, maxDistance, coordinates } = req.query;

    const baseQuery: Record<string, any> = {};
    if (category) baseQuery.category = category;
    if (brand) baseQuery.brand = brand;

    let products;

    if (coordinates) {
      const coords = parseCoordinates(coordinates as string); // [lng, lat]
      if (!coords) {
        return res.status(400).json({ message: "Invalid coordinates format" });
      }

      const [lng, lat] = coords;

      products = await Product.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "distance",
            spherical: true,
            maxDistance: Number(maxDistance) || 50000,
            query: baseQuery,
          },
        },
        {
          $addFields: {
            sellerId: { $toObjectId: "$sellerId" }, // 👈 Convert string to ObjectId before lookup
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "sellerId",
            foreignField: "_id",
            as: "seller",
          },
        },
        {
          $unwind: "$seller",
        },
      ]);
    } else {
      // No coordinates, basic filtering
      products = await Product.find(baseQuery).populate("sellerId");
    }

    res.json({ success: true, data: products });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ message: "Server Error" });
  }
};







// ✅ Get Recommended Products
export const getRecommendedProducts = async (req: Request, res: Response) => {
  try {
    const { productId, coordinates } = req.query;

    if (!coordinates) {
      return res.status(400).json({ message: 'Coordinates are required' });
    }

    const coords = parseCoordinates(coordinates as string);
    if (!coords || coords.length !== 2) {
      return res.status(400).json({ message: 'Invalid coordinates format' });
    }
    const [lng, lat] = coords;

    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const recommendations = await Product.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          spherical: true,
          maxDistance: 50000, // 50 km
        },
      },
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(productId as string) },
          category: currentProduct.category,
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: [{ $ifNull: ['$views', 0] }, 0.1] },
              { $multiply: [{ $ifNull: ['$favorites', 0] }, 0.3] },
              { $multiply: [{ $ifNull: ['$soldCount', 0] }, 0.4] },
              { $multiply: [{ $ifNull: ['$rating', 0] }, 0.2] },
            ],
          },
        },
      },
      { $sort: { score: -1, distance: 1 } },
      { $limit: 10 },
    ]);

    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommended products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


export const incrementProductView = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    await Product.findByIdAndUpdate(productId, { $inc: { views: 1 } });

    res.json({ message: 'View incremented' });
  } catch (error) {
    console.error('Error incrementing view:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { increment } = req.body;

    if (typeof increment !== 'boolean') {
      return res.status(400).json({ message: 'Increment must be a boolean' });
    }

    const update = increment ? { $inc: { favorites: 1 } } : { $inc: { favorites: -1 } };

    const updatedProduct = await Product.findByIdAndUpdate(productId, update, {
      new: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Favorite count updated', favorites: updatedProduct.favorites });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const incrementProductInterest = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $inc: { views: 1 } }, // or another field like 'interestCount'
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product interest incremented', views: updatedProduct.views });
  } catch (error) {
    console.error('Error incrementing product interest:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const incrementChatCount = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $inc: { chatCount: 1 } },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Chat count incremented", product: updatedProduct });
  } catch (error) {
    console.error("Error incrementing chat count:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getBehaviorBasedRecommendations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const behaviorLogs = await UserBehavior.find({ userId }).sort({ createdAt: -1 }).limit(50);

    const interactedProductIds = behaviorLogs.map((b) => b.productId);
    const interactedCategories = await Product.find({
      _id: { $in: interactedProductIds },
    }).distinct("category");

    const recommendations = await Product.aggregate([
      {
        $match: {
          category: { $in: interactedCategories },
          _id: { $nin: interactedProductIds },
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: [{ $ifNull: ["$views", 0] }, 0.1] },
              { $multiply: [{ $ifNull: ["$favorites", 0] }, 0.3] },
              { $multiply: [{ $ifNull: ["$chatCount", 0] }, 0.4] },
              { $multiply: [{ $ifNull: ["$rating", 0] }, 0.2] },
            ],
          },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 10 },
    ]);

    res.json(recommendations);
  } catch (err) {
    console.error("Behavior-based recommendation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const recordProductViewBehavior = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.userId; 

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const behavior = new UserBehavior({
      userId,
      productId,
      action: "view", 
      createdAt: new Date(),
    });

    await behavior.save();

    res.json({ message: "User behavior recorded" });
  } catch (error) {
    console.error("Error recording behavior:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
