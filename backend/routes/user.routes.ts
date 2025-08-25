import { Router} from "express";
import { Request, Response } from "express";
import { upload } from "../middleware/multer";
import { registerUser, loginUser, getUserProfile, resetPassword, getUserProducts, updateUserProfile, forgotPassword } from "../controllers/user.controller";
import { AuthenticatedRequest, authMiddleware } from "../middleware/authMiddleware";

export const userRoutes=Router();

userRoutes.post('/register', async (req: Request, res: Response) => {
  await registerUser(req, res);
});

userRoutes.post('/login', async (req: Request, res: Response) => {
  await loginUser(req, res);
});
// ----------------- USER PRODUCTS -----------------
userRoutes.get("/products",authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  await getUserProducts(req, res);
});
userRoutes.get('/:userId',authMiddleware,async (req: Request, res: Response) => {
  await getUserProfile(req, res);
} )

userRoutes.post("/forgot-password", async (req: Request, res: Response) => {
  await forgotPassword(req, res);
});

userRoutes.put(
  "/:userId",
  upload.single("avatar"), 
  authMiddleware,
  async (req: Request, res: Response) => {
    await updateUserProfile(req, res);
  }
);
userRoutes.put("/:userId/reset-password",authMiddleware, async (req: Request, res: Response) => {
  await resetPassword(req, res);
});




