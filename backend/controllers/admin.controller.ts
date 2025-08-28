import { Request, Response } from "express";
import { User } from "../models/user.model";
import { Product } from "../models/product.model";
import mongoose from "mongoose";


export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    await Product.deleteMany({ sellerId: userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User and their products deleted successfully" });
  } catch (error) {
    console.error("deleteUser error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const makeUserAdmin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isAdmin: true },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User promoted to admin", user });
  } catch (error) {
    console.error("makeUserAdmin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserProductsByAdmin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const products = await Product.find({ sellerId: userId }).populate("sellerId", "name email");
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("getUserProductsByAdmin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUserProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    await Product.findByIdAndDelete(productId);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("deleteUserProduct error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
