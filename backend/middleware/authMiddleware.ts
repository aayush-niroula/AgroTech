import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    // Check for missing or malformed Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("Authentication failed: Missing or malformed Authorization header", {
        authHeader,
      });
      res.status(401).json({ success: false, message: "Authorization token missing or malformed" });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Validate token is not empty
    if (!token) {
      console.warn("Authentication failed: Empty token");
      res.status(401).json({ success: false, message: "Authorization token is empty" });
      return;
    }

    // Ensure JWT_SECRET is set
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET environment variable is not set");
      res.status(500).json({ success: false, message: "Server configuration error" });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Ensure userId exists in decoded token
    if (!decoded.userId) {
      console.warn("Authentication failed: userId missing in token", { decoded });
      res.status(401).json({ success: false, message: "Invalid token: userId missing" });
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch (error: any) {
    console.error("Authentication error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    // Provide specific error messages for JWT errors
    let message = "Invalid or expired token";
    if (error.name === "TokenExpiredError") {
      message = "Token has expired";
    } else if (error.name === "JsonWebTokenError") {
      message = "Invalid token format";
    }

    res.status(401).json({ success: false, message });
    return;
  }
};