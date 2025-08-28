import { Router, Request, Response } from "express";
import {
  getAllUsers,
  deleteUser,
  makeUserAdmin,
  getUserProductsByAdmin,
  deleteUserProduct,
} from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/authMiddleware";
import { isAdmin } from "../middleware/adminMiddleware";


export const adminRoutes = Router();

adminRoutes.get(
  "/users",
  authMiddleware,
  isAdmin,
  async (req: Request, res: Response) => {
    await getAllUsers(req, res);
  }
);


adminRoutes.delete(
  "/user/:userId",
  authMiddleware,
  isAdmin,
  async (req: Request, res: Response) => {
    await deleteUser(req, res);
  }
);


adminRoutes.patch(
  "/user/:userId/make-admin",
  authMiddleware,
  isAdmin,
  async (req: Request, res: Response) => {
    await makeUserAdmin(req, res);
  }
);


adminRoutes.get(
  "/user/:userId/products",
  authMiddleware,
  isAdmin,
  async (req: Request, res: Response) => {
    await getUserProductsByAdmin(req, res);
  }
);


adminRoutes.delete(
  "/product/:productId",
  authMiddleware,
  isAdmin,
  async (req: Request, res: Response) => {
    await deleteUserProduct(req, res);
  }
);
