import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const user = await User.findById(userId);
    if (!user || !user.isAdmin) {
      res.status(403).json({ message: "Access denied. Admin only." });
      return; 
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
