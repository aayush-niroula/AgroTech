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

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (typeof increment !== "boolean") {
      return res.status(400).json({ success: false, message: "Increment must be a boolean" });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }

    // Update product favorite count
    const update = increment
      ? { $inc: { favorites: 1 } }
      : { $inc: { favorites: -1 } };
    const updatedProduct = await Product.findByIdAndUpdate(productId, update, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Update user's favorite list
    await User.findByIdAndUpdate(userId, {
      [increment ? "$addToSet" : "$pull"]: {
        "activity.favoritedProducts": productId,
      },
    });

    // Always log "favorite" but store increment separately if needed
    await UserBehavior.create({
      userId,
      productId,
      actionType: "favorite", // ✅ Always "favorite"
    });

    res.json({
      success: true,
      message: increment ? "Product favorited" : "Product unfavorited",
      favorites: updatedProduct.favorites,
    });
  } catch (error: any) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
    });
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
    const userId = req.userId as string; // Ensure userId is typed
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Optional location params
    const { coordinates, maxDistance } = req.query;
    let coords: number[] | null = null;
    let maxDist = 50000; // Default 50km

    if (coordinates) {
      coords = parseCoordinates(coordinates as string);
      if (!coords || coords.length !== 2) {
        return res.status(400).json({ success: false, message: "Invalid coordinates format" });
      }
      maxDist = Number(maxDistance) || maxDist;
      if (isNaN(maxDist) || maxDist <= 0) {
        return res.status(400).json({ success: false, message: "Invalid maxDistance" });
      }
    }

    // Fetch user with populated fields
    const user = await User.findById<IUser>(userId).populate([
      { path: "activity.viewedProducts", model: "Product" },
      { path: "activity.favoritedProducts", model: "Product" },
      { path: "activity.chattedProducts", model: "Product" },
    ]);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Explicitly cast product arrays
    const viewedProducts = user.activity.viewedProducts as unknown as IProduct[];
    const favoritedProducts = user.activity.favoritedProducts as unknown as IProduct[];
    const chattedProducts = user.activity.chattedProducts as unknown as IProduct[];

    // Collect interacted product IDs
    const interactedProductIds = new Set<mongoose.Types.ObjectId>([
      ...viewedProducts.map((p) => p._id as mongoose.Types.ObjectId),
      ...favoritedProducts.map((p) => p._id as mongoose.Types.ObjectId),
      ...chattedProducts.map((p) => p._id as mongoose.Types.ObjectId),
    ]);

    // 🔹 Fallback for no activity
    if (interactedProductIds.size === 0) {
      const fallbackRecs = await Product.aggregate([
        {
          $addFields: {
            popularityScore: {
              $add: [
                { $multiply: [{ $ifNull: ["$views", 0] }, 0.1] },
                { $multiply: [{ $ifNull: ["$favorites", 0] }, 0.3] },
                { $multiply: [{ $ifNull: ["$chatCount", 0] }, 0.4] },
                { $multiply: [{ $ifNull: ["$rating", 0] }, 0.2] },
              ],
            },
          },
        },
        { $sort: { popularityScore: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "sellerId",
            foreignField: "_id",
            as: "sellerId",
          },
        },
        { $unwind: { path: "$sellerId", preserveNullAndEmptyArrays: true } },
      ]);
      return res.json({
        success: true,
        data: fallbackRecs,
        message: "No activity yet—showing popular products",
      });
    }

    // 🔹 Aggregate user behavior
    const behaviorCounts = await UserBehavior.aggregate([
      { $match: { userId: user._id, actionType: { $in: ["view", "chat"] } } },
      {
        $group: {
          _id: "$productId",
          viewCount: { $sum: { $cond: [{ $eq: ["$actionType", "view"] }, 1, 0] } },
          chatCount: { $sum: { $cond: [{ $eq: ["$actionType", "chat"] }, 1, 0] } },
        },
      },
    ]);

    // Create a map of counts
    const countsMap: Record<string, { viewCount: number; chatCount: number }> = {};
    behaviorCounts.forEach((b) => {
      countsMap[b._id.toString()] = { viewCount: b.viewCount, chatCount: b.chatCount };
    });

    // Fetch interacted products
    const interactedProducts = await Product.find<IProduct>({
      _id: { $in: Array.from(interactedProductIds) },
    });

    // 🔹 Calculate scores
    const scoresMap: Record<string, number> = {};
    interactedProducts.forEach((product) => {
      const pid = (product._id as mongoose.Types.ObjectId).toString();
      const viewCount = countsMap[pid]?.viewCount || 0;
      const chatCount = countsMap[pid]?.chatCount || 0;
      const isFavorited = favoritedProducts.some((p) =>
        (p._id as mongoose.Types.ObjectId).equals(product._id as mongoose.Types.ObjectId)
      );
      scoresMap[pid] = viewCount * 1 + chatCount * 5 + (isFavorited ? 3 : 0);
    });

    // 🔹 Category scoring
    const categoryScores: Record<string, number> = {};
    const numProductsPerCategory: Record<string, number> = {};

    interactedProducts.forEach((product) => {
      const pid = (product._id as mongoose.Types.ObjectId).toString();
      const cat = product.category;
      const score = scoresMap[pid] || 0;
      categoryScores[cat] = (categoryScores[cat] || 0) + score;
      numProductsPerCategory[cat] = (numProductsPerCategory[cat] || 0) + 1;
    });

    const preferredCategories = Object.keys(categoryScores);
    if (preferredCategories.length === 0) {
      return res.status(200).json({ success: true, data: [], message: "No categorized activity yet" });
    }

    // 🔹 Build switch for category boost
    const switchBranches = preferredCategories.map((cat) => ({
      case: { $eq: ["$category", cat] },
      then: categoryScores[cat],
    }));

    // 🔹 Recommendation pipeline
    const pipeline: any[] = [
      {
        $match: {
          _id: { $nin: Array.from(interactedProductIds) },
          category: { $in: preferredCategories },
        },
      },
      {
        $addFields: {
          popularityScore: {
            $add: [
              { $multiply: [{ $ifNull: ["$views", 0] }, 0.1] },
              { $multiply: [{ $ifNull: ["$favorites", 0] }, 0.3] },
              { $multiply: [{ $ifNull: ["$chatCount", 0] }, 0.4] },
              { $multiply: [{ $ifNull: ["$rating", 0] }, 0.2] },
            ],
          },
          userCategoryScore: {
            $switch: {
              branches: switchBranches,
              default: 0,
            },
          },
        },
      },
      { $addFields: { finalScore: { $add: ["$popularityScore", "$userCategoryScore"] } } },
      { $sort: { finalScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "sellerId",
        },
      },
      { $unwind: { path: "$sellerId", preserveNullAndEmptyArrays: true } },
    ];

    // 🔹 Add geo filtering
    if (coords) {
      pipeline.unshift({
        $geoNear: {
          near: { type: "Point", coordinates: [coords[0], coords[1]] },
          distanceField: "distance",
          spherical: true,
          maxDistance: maxDist,
          query: { category: { $in: preferredCategories }, _id: { $nin: Array.from(interactedProductIds) } },
        },
      });
      pipeline[pipeline.length - 5] = { $sort: { finalScore: -1, distance: 1 } };
    }

    const recommendations = await Product.aggregate(pipeline);

    return res.json({ success: true, data: recommendations });
  } catch (error: any) {
    console.error("Personalized recommendation error:", error);
    return res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};
