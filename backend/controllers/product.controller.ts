import { Request, Response } from "express";
import { Product, UserBehavior } from "../models/product.model";
import mongoose from "mongoose";
import cloudinary from "../middleware/cloudinary";
import streamifier from "streamifier";
import { parseCoordinates } from "../utils/parseCordinates";
import { User } from "../models/user.model";

// Extend Express Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const createProduct = async (req: Request, res: Response) => {
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

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Product image is required' });
    }
    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ success: false, message: 'Invalid sellerId' });
    }

    // Validate seller exists
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
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
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
};

export const getAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await Product.find().populate("sellerId");
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    console.error('Error fetching all products:', error);
    res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate("sellerId");
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
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

    // Validate sellerId if provided
    if (sellerId && !mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ success: false, message: 'Invalid sellerId' });
    }
    if (sellerId) {
      const seller = await User.findById(sellerId);
      if (!seller) {
        return res.status(404).json({ success: false, message: 'Seller not found' });
      }
    }

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
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, brand, maxDistance, coordinates } = req.query;

    const baseQuery: Record<string, any> = {};
    if (category) baseQuery.category = { $regex: `^${category}$`, $options: 'i' }; // Case-insensitive
    if (brand) baseQuery.brand = { $regex: `^${brand}$`, $options: 'i' };

    let products;

    if (coordinates) {
      const coords = parseCoordinates(coordinates as string); // [lng, lat]
      if (!coords) {
        return res.status(400).json({ success: false, message: "Invalid coordinates format" });
      }

      const [lng, lat] = coords;

      const maxDist = Number(maxDistance) || 50000;
      if (isNaN(maxDist) || maxDist <= 0) {
        return res.status(400).json({ success: false, message: "Invalid maxDistance" });
      }

      console.log("Executing geospatial query", { coordinates: [lng, lat], maxDistance: maxDist, baseQuery });

      products = await Product.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "distance",
            spherical: true,
            maxDistance: maxDist,
            query: baseQuery,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "sellerId",
            foreignField: "_id",
            as: "sellerId",
          },
        },
        {
          $unwind: {
            path: "$sellerId",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      if (products.length === 0) {
        console.warn("No products found for geospatial query", {
          coordinates: [lng, lat],
          maxDistance: maxDist,
          baseQuery,
        });
        return res.status(200).json({
          success: true,
          data: [],
          message: "No products found within the specified radius or filters",
        });
      }
    } else {
      products = await Product.find(baseQuery).populate("sellerId");

      if (products.length === 0) {
        console.warn("No products found for base query", { baseQuery });
        return res.status(200).json({
          success: true,
          data: [],
          message: "No products match the specified filters",
        });
      }
    }

    console.log("Products found:", products.length);
    res.json({ success: true, data: products });
  } catch (error: any) {
    console.error("❌ Error fetching products:", {
      message: error.message,
      stack: error.stack,
      query: req.query,
    });
    res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
};
export const getRecommendedProducts = async (req: Request, res: Response) => {
  try {
    const { productId, coordinates } = req.query;

    if (!coordinates) {
      return res.status(400).json({ success: false, message: 'Coordinates are required' });
    }

    const coords = parseCoordinates(coordinates as string);
    if (!coords || coords.length !== 2) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates format' });
    }
    const [lng, lat] = coords;

    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const baseQuery: Record<string, any> = {
      _id: { $ne: new mongoose.Types.ObjectId(productId as string) },
      category: currentProduct.category,
    };

    const recommendations = await Product.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          spherical: true,
          maxDistance: 50000, // 50 km
          query: baseQuery, // FIXED: Added query filter
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
      {
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "sellerId", // FIXED: Consistent naming
        },
      },
      {
        $unwind: {
          path: "$sellerId",
          preserveNullAndEmptyArrays: true, // FIXED: Handle missing sellerId
        },
      },
    ]);

    res.json({ success: true, data: recommendations }); // FIXED: Consistent response shape
  } catch (error: any) {
    console.error('Error fetching recommended products:', error);
    res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
};

export const incrementProductView = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid productId' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'View incremented' });
  } catch (error: any) {
    console.error('Error incrementing view:', error);
    res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
};

export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { increment } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (typeof increment !== "boolean") {
      return res.status(400).json({ success: false, message: "Increment must be a boolean" });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid productId' });
    }

    const update = increment ? { $inc: { favorites: 1 } } : { $inc: { favorites: -1 } };
    const updatedProduct = await Product.findByIdAndUpdate(productId, update, { new: true });

    if (!updatedProduct) return res.status(404).json({ success: false, message: "Product not found" });

    await User.findByIdAndUpdate(userId, {
      [increment ? "$addToSet" : "$pull"]: {
        "activity.favoritedProducts": productId,
      },
    });

    await UserBehavior.create({
      userId,
      productId,
      actionType: increment ? "favorite" : "unfavorite", // FIXED: Correct actionType
    });

    res.json({ success: true, message: "Favorite status updated", favorites: updatedProduct.favorites });
  } catch (error: any) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

export const recordProductViewBehavior = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid productId' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    await UserBehavior.create({
      userId,
      productId,
      actionType: "view",
      createdAt: new Date(),
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { "activity.viewedProducts": productId },
    });

    await Product.findByIdAndUpdate(productId, { $inc: { views: 1 } });

    res.json({ success: true, message: "View recorded" });
  } catch (error: any) {
    console.error("Error recording view:", error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

export const incrementChatCount = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid productId' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $inc: { chatCount: 1 } },
      { new: true }
    );

    if (!updatedProduct) return res.status(404).json({ success: false, message: "Product not found" });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { "activity.chattedProducts": productId },
    });

    await UserBehavior.create({
      userId,
      productId,
      actionType: "chat",
      createdAt: new Date(),
    });

    res.json({ success: true, message: "Chat count incremented", product: updatedProduct });
  } catch (error: any) {
    console.error("Error incrementing chat count:", error);
    res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
};

export const getPersonalizedRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await User.findById(userId).populate("activity.viewedProducts activity.favoritedProducts activity.chattedProducts");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const interactedProductIds = [
      ...user.activity.viewedProducts,
      ...user.activity.favoritedProducts,
      ...user.activity.chattedProducts,
    ].map((p: any) => p._id);

    const categories = await Product.find({ _id: { $in: interactedProductIds } }).distinct("category");

    const recommendations = await Product.aggregate([
      {
        $match: {
          category: { $in: categories },
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
      {
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "sellerId",
        },
      },
      {
        $unwind: {
          path: "$sellerId",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    res.json({ success: true, data: recommendations });
  } catch (error: any) {
    console.error("Personalized recommendation error:", error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};