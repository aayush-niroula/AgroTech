import { Request, Response } from "express";
import { Product, UserBehavior } from "../models/product.model";
import mongoose from "mongoose";
import cloudinary from "../middleware/cloudinary";
import streamifier from "streamifier";
import { parseCoordinates } from "../utils/parseCordinates";
import { User } from "../models/user.model";
import type { IUser } from "../models/user.model";
import type { IProduct } from "../models/product.model";
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
   
    await User.findByIdAndUpdate(sellerId, {
      $addToSet: { addedProducts: savedProduct._id },
    });
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
    const { category, brand, maxDistance, coordinates, searchTerm } = req.query;

    // Build base (non-geo) filters
    const baseQuery: Record<string, any> = {};
    if (category) baseQuery.category = { $regex: `^${category}$`, $options: 'i' }; // exact (case-insensitive)
    if (brand) baseQuery.brand = { $regex: `^${brand}$`, $options: 'i' };

    if (searchTerm) {
      const term = String(searchTerm).trim();
      if (term) {
        const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape + i
        baseQuery.$or = [
          { title: rx },
          { description: rx },
          { brand: rx },
          { category: rx },
        ];
      }
    }

    // Decide whether to use geo filter
    const hasCoords = typeof coordinates === 'string' && coordinates.length > 0;
    const parsedMax = maxDistance !== undefined ? Number(maxDistance) : undefined;
    const useGeo =
      hasCoords &&
      parsedMax !== undefined &&
      !Number.isNaN(parsedMax) &&
      parsedMax > 0;

    let products;

    if (useGeo) {
      const coords = parseCoordinates(coordinates as string); // [lng, lat]
      if (!coords) {
        return res.status(400).json({ success: false, message: 'Invalid coordinates format' });
      }
      const [lng, lat] = coords;

      // Use exactly what the client asked for
      const maxDist = parsedMax as number;

      console.log('Executing geospatial query', {
        coordinates: [lng, lat],
        maxDistance: maxDist,
        baseQuery,
      });

      products = await Product.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distance',
            spherical: true,
            maxDistance: maxDist,
            query: baseQuery,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'sellerId',
            foreignField: '_id',
            as: 'sellerId',
          },
        },
        {
          $unwind: { path: '$sellerId', preserveNullAndEmptyArrays: true },
        },
      ]);
    } else {
      // No geo filter → return all matching products
      products = await Product.find(baseQuery).populate('sellerId');
    }

    return res.status(200).json({
      success: true,
      data: products,
      ...(useGeo
        ? undefined
        : { message: 'Returned non-geofiltered results (no/invalid radius provided).' }),
    });
  } catch (error: any) {
    console.error('❌ Error fetching products:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
    });
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
    if (typeof increment !== "boolean") return res.status(400).json({ success: false, message: "Increment must be a boolean" });
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ success: false, message: "Invalid productId" });

    // Update product favorite count
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      increment ? { $inc: { favorites: 1 } } : { $inc: { favorites: -1 } },
      { new: true }
    );
    if (!updatedProduct) return res.status(404).json({ success: false, message: "Product not found" });

    // Update user's activity
    await User.findByIdAndUpdate(userId, {
      [increment ? "$addToSet" : "$pull"]: {
        "activity.favoritedProducts": new mongoose.Types.ObjectId(productId)
      }
    }, { new: true, upsert: true });

    // Log behavior
    await UserBehavior.create({ userId, productId, actionType: "favorite", createdAt: new Date() });

    res.json({
      success: true,
      message: increment ? "Product favorited" : "Product unfavorited",
      favorites: updatedProduct.favorites,
    });
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
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ success: false, message: 'Invalid productId' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // Increment product views
    await Product.findByIdAndUpdate(productId, { $inc: { views: 1 } });

    // Save in user activity
    await User.findByIdAndUpdate(userId, {
      $addToSet: { "activity.viewedProducts": new mongoose.Types.ObjectId(productId) }
    }, { new: true, upsert: true });

    // Optionally log behavior
    await UserBehavior.create({ userId, productId, actionType: "view", createdAt: new Date() });

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
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ success: false, message: 'Invalid productId' });

    // Increment product chat count
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $inc: { chatCount: 1 } },
      { new: true }
    );
    if (!updatedProduct) return res.status(404).json({ success: false, message: "Product not found" });

    // Save in user activity
    await User.findByIdAndUpdate(userId, {
      $addToSet: { "activity.chattedProducts": new mongoose.Types.ObjectId(productId) }
    }, { new: true, upsert: true });

    // Log behavior
    await UserBehavior.create({ userId, productId, actionType: "chat", createdAt: new Date() });

    res.json({ success: true, message: "Chat count incremented", product: updatedProduct });
  } catch (error: any) {
    console.error("Error incrementing chat count:", error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};



export const getPersonalizedRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, message: 'Unauthorized or invalid user ID' });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure activity fields exist
    const activity = user.activity || { viewedProducts: [], favoritedProducts: [], chattedProducts: [] };
    
    // All product IDs user interacted with
    const interactedProducts = new Set([
      ...(activity.viewedProducts || []),
      ...(activity.favoritedProducts || []),
      ...(activity.chattedProducts || []),
      ...(user.addedProducts || []),
    ]);

    // If cold start, fallback to popular recent products
    if (interactedProducts.size === 0) {
      const fallback = await Product.find({ sellerId: { $ne: userId } })
        .sort({ views: -1, favorites: -1, chatCount: -1, createdAt: -1 })
        .limit(20)
        .populate('sellerId', 'name email')
        .lean();
      return res.status(200).json({ success: true, data: fallback });
    }

    // CONTENT-BASED SCORES
    const interactedIds = Array.from(interactedProducts).filter(id => mongoose.Types.ObjectId.isValid(id));
    if (interactedIds.length === 0) {
      console.warn('No valid product IDs for recommendations');
      return res.status(200).json({ success: true, data: [] });
    }

    const interactedProductsData = await Product.find({ _id: { $in: interactedIds } }).lean();

    const categoryCounts: Record<string, number> = {};
    const brandCounts: Record<string, number> = {};
    for (const product of interactedProductsData) {
      if (product.category) {
        categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
      }
      if (product.brand) {
        brandCounts[product.brand] = (brandCounts[product.brand] || 0) + 1;
      }
    }

    // Build $switch branches for aggregation
    const categoryBranches = Object.entries(categoryCounts).map(([category, count]) => ({
      case: { $eq: ['$category', category] },
      then: count * 2,
    }));
    const brandBranches = Object.entries(brandCounts).map(([brand, count]) => ({
      case: { $eq: ['$brand', brand] },
      then: count * 1.5,
    }));

    // AGGREGATION PIPELINE
    const pipeline: any[] = [
      {
        $match: {
          _id: { $nin: interactedIds.map(id => new mongoose.Types.ObjectId(id)) },
          sellerId: { $ne: new mongoose.Types.ObjectId(userId) },
        },
      },
      {
        $addFields: {
          popularityScore: {
            $add: [
              { $multiply: [{ $ifNull: ['$views', 0] }, 0.05] },
              { $multiply: [{ $ifNull: ['$favorites', 0] }, 0.2] },
              { $multiply: [{ $ifNull: ['$chatCount', 0] }, 0.4] },
              { $multiply: [{ $ifNull: ['$rating', 0] }, 0.3] },
              { $multiply: [{ $ifNull: ['$reviewCount', 0] }, 0.1] },
            ],
          },
          recencyScore: {
            $cond: {
              if: { $and: [{ $ne: ['$createdAt', null] }, { $ne: ['$createdAt', undefined] }] },
              then: { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60 * 24] },
              else: 0,
            },
          },
          userCategoryScore: categoryBranches.length ? { $switch: { branches: categoryBranches, default: 0 } } : 0,
          userBrandScore: brandBranches.length ? { $switch: { branches: brandBranches, default: 0 } } : 0,
        },
      },
      {
        $addFields: {
          contentScore: { $add: ['$userCategoryScore', '$userBrandScore'] },
          finalScore: {
            $subtract: [
              { $add: ['$popularityScore', { $multiply: ['$contentScore', 0.6] }] },
              { $multiply: ['$recencyScore', 0.05] },
            ],
          },
        },
      },
      { $sort: { finalScore: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: 'sellerId', foreignField: '_id', as: 'seller' } },
      { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
    ];

    const recommendations = await Product.aggregate(pipeline).exec();

    return res.status(200).json({ success: true, data: recommendations });
  } catch (error: any) {
    console.error('Error fetching recommendations:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Failed to get recommendations', error: error.message });
  }
};
