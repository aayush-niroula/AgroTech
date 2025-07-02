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
   const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

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


// 🛑 Helper to parse coordinates
const parseCoordinates = (coord: string) => {
  const [lng, lat] = coord.split(',').map(Number);
  return [lng, lat];
};


// ✅ Get products with optional location filtering
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, brand, maxDistance, coordinates } = req.query;

    const filters: any = {};
    if (category) filters.category = category;
    if (brand) filters.brand = brand;

    if (coordinates) {
      const [lng, lat] = parseCoordinates(coordinates as string);
      filters.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: Number(maxDistance) || 50000, // default 50km
        },
      };
    }

    const products = await Product.find(filters).populate('sellerId');

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// ✅ Get Recommended Products
export const getRecommendedProducts = async (req: Request, res: Response) => {
  try {
    const { productId, coordinates } = req.query;

    if (!coordinates) {
      return res.status(400).json({ message: 'Coordinates are required' });
    }

    const [lng, lat] = parseCoordinates(coordinates as string);

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


// ✅ Increase view count (Call this on product view)
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

