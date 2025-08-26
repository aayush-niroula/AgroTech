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



export const getPersonalizedRecommendations = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId; // comes from your auth middleware
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Collect product IDs the user has interacted with (from User.activity)
    const interactedProducts = new Set([
      ...(user.activity?.viewedProducts || []),
      ...(user.activity?.favoritedProducts || []),
      ...(user.activity?.chattedProducts || []),
      ...(user.addedProducts || []), // products user listed
    ]);

    const interactedIds = [
      ...(user.activity?.viewedProducts || []),
      ...(user.activity?.favoritedProducts || []),
      ...(user.activity?.chattedProducts || []),
    ];

    // If no interactions (cold start), fallback to popular recent products
    if (interactedIds.length === 0) {
      const fallbackRecommendations = await Product.aggregate([
        {
          $match: {
            sellerId: { $ne: new mongoose.Types.ObjectId(userId) },
          },
        },
        {
          $addFields: {
            popularityScore: {
              $add: [
                { $multiply: [{ $ifNull: ["$views", 0] }, 0.05] },
                { $multiply: [{ $ifNull: ["$favorites", 0] }, 0.2] },
                { $multiply: [{ $ifNull: ["$chatCount", 0] }, 0.4] },
                { $multiply: [{ $ifNull: ["$rating", 0] }, 0.3] },
                { $multiply: [{ $ifNull: ["$reviewCount", 0] }, 0.1] },
              ],
            },
            recencyScore: {
              $divide: [
                { $subtract: [new Date(), "$createdAt"] },
                1000 * 60 * 60 * 24, // Days since posted
              ],
            },
          },
        },
        {
          $addFields: {
            finalScore: {
              $subtract: [
                "$popularityScore",
                { $multiply: ["$recencyScore", 0.05] },
              ],
            },
          },
        },
        { $sort: { finalScore: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: "users",
            localField: "sellerId",
            foreignField: "_id",
            as: "seller",
          },
        },
        { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
      ]);
      return res.status(200).json({ success: true, data: fallbackRecommendations });
    }

    // Count categories and brands from interacted products (content-based)
    const categoryCounts: Record<string, number> = {};
    const brandCounts: Record<string, number> = {};
    const interactedProductsData = await Product.find({
      _id: { $in: interactedIds },
    }).lean();

    for (const product of interactedProductsData) {
      if (product.category) {
        categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
      }
      if (product.brand) {
        brandCounts[product.brand] = (brandCounts[product.brand] || 0) + 1;
      }
    }

    // Build $switch branches for category and brand
    const categoryBranches = Object.entries(categoryCounts).map(([category, count]) => ({
      case: { $eq: ["$category", category] },
      then: count * 2,
    }));
    const brandBranches = Object.entries(brandCounts).map(([brand, count]) => ({
      case: { $eq: ["$brand", brand] },
      then: count * 1.5, // Lower weight than category
    }));

    // Collaborative Filtering: Find similar users and their recommended products
    // Step 1: Get user's positive interactions (favorite/chat, weighted higher)
    const userInteractions = await UserBehavior.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          actionType: { $in: ["favorite", "chat", "view"] },
        },
      },
      {
        $group: {
          _id: "$productId",
          score: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ["$actionType", "favorite"] }, then: 3 },
                  { case: { $eq: ["$actionType", "chat"] }, then: 4 },
                  { case: { $eq: ["$actionType", "view"] }, then: 1 },
                ],
                default: 0,
              },
            },
          },
        },
      },
    ]);

    const userProductScores = userInteractions.reduce((acc, item) => {
      acc[item._id.toString()] = item.score;
      return acc;
    }, {} as Record<string, number>);

    // Step 2: Find similar users (those who interacted with at least 2 overlapping products)
    const similarUsers = await UserBehavior.aggregate([
      {
        $match: {
          productId: { $in: interactedIds.map(id => new mongoose.Types.ObjectId(id)) },
          userId: { $ne: new mongoose.Types.ObjectId(userId) },
        },
      },
      { $group: { _id: "$userId", sharedProducts: { $addToSet: "$productId" } } },
      { $match: { $expr: { $gte: [{ $size: "$sharedProducts" }, 2] } } }, // At least 2 shared
      { $limit: 50 }, // Limit for performance
    ]);

    const similarUserIds = similarUsers.map(u => u._id);

    // Step 3: Get products from similar users, score by frequency and action weight
    let collabProducts = [];
    if (similarUserIds.length > 0) {
      collabProducts = await UserBehavior.aggregate([
        {
          $match: {
            userId: { $in: similarUserIds },
            productId: { $nin: Array.from(interactedProducts) }, // Exclude user's interacted
          },
        },
        {
          $group: {
            _id: "$productId",
            collabScore: {
              $sum: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$actionType", "favorite"] }, then: 3 },
                    { case: { $eq: ["$actionType", "chat"] }, then: 4 },
                    { case: { $eq: ["$actionType", "view"] }, then: 1 },
                  ],
                  default: 0,
                },
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { collabScore: -1 } },
        { $limit: 50 }, // Pre-limit before joining
      ]);
    }

    const collabProductScores = collabProducts.reduce((acc, item) => {
      acc[item._id.toString()] = item.collabScore * (item.count / similarUserIds.length); // Normalize by user count
      return acc;
    }, {} as Record<string, number>);

    // Main Product Aggregation Pipeline (Hybrid: Content + Collab)
    const pipeline: any[] = [
      {
        $match: {
          _id: { $nin: Array.from(interactedProducts) },
          sellerId: { $ne: new mongoose.Types.ObjectId(userId) },
        },
      },
      {
        $addFields: {
          popularityScore: {
            $add: [
              { $multiply: [{ $ifNull: ["$views", 0] }, 0.05] },
              { $multiply: [{ $ifNull: ["$favorites", 0] }, 0.2] },
              { $multiply: [{ $ifNull: ["$chatCount", 0] }, 0.4] },
              { $multiply: [{ $ifNull: ["$rating", 0] }, 0.3] },
              { $multiply: [{ $ifNull: ["$reviewCount", 0] }, 0.1] },
            ],
          },
          recencyScore: {
            $divide: [
              { $subtract: [new Date(), "$createdAt"] },
              1000 * 60 * 60 * 24,
            ],
          },
          userCategoryScore: categoryBranches.length
            ? { $switch: { branches: categoryBranches, default: 0 } }
            : 0,
          userBrandScore: brandBranches.length
            ? { $switch: { branches: brandBranches, default: 0 } }
            : 0,
          collabScore: {
            $toDouble: { // Lookup from collab dict (use $function for dynamic lookup)
              $function: {
                body: `function(collabScores, productId) { return collabScores[productId.toString()] || 0; }`,
                args: [collabProductScores, "$_id"],
                lang: "js",
              },
            },
          },
        },
      },
      {
        $addFields: {
          contentScore: { $add: ["$userCategoryScore", "$userBrandScore"] },
          finalScore: {
            $subtract: [
              {
                $add: [
                  "$popularityScore",
                  { $multiply: ["$contentScore", 0.6] }, // 60% content
                  { $multiply: ["$collabScore", 0.4] }, // 40% collab
                ],
              },
              { $multiply: ["$recencyScore", 0.05] },
            ],
          },
        },
      },
      { $sort: { finalScore: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
    ];

    const recommendations = await Product.aggregate(pipeline);
    return res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get recommendations",
    });
  }
};
