import { Router, Request, Response } from "express";
import {
  addReview,
  getProductReviews,
  replyToReview,
  editReview,
  deleteReview,
  deleteReply,
} from "../controllers/review.controller";
import { authMiddleware } from "../middleware/authMiddleware";


export const reviewRoutes = Router();


reviewRoutes.post(
  "/:productId",
  authMiddleware,
  async (req: Request, res: Response) => {
    await addReview(req, res);
  }
);


reviewRoutes.get(
  "/:productId",
  async (req: Request, res: Response) => {
    await getProductReviews(req, res);
  }
);


reviewRoutes.post(
  "/:reviewId/reply",
  authMiddleware,
  async (req: Request, res: Response) => {
    await replyToReview(req, res);
  }
);


reviewRoutes.put(
  "/:reviewId",
  authMiddleware,
  async (req: Request, res: Response) => {
    await editReview(req, res);
  }
);

reviewRoutes.delete(
  "/:reviewId",
  authMiddleware,
  async (req: Request, res: Response) => {
    await deleteReview(req, res);
  }
);


reviewRoutes.delete(
  "/:reviewId/reply/:replyId",
  authMiddleware,
  async (req: Request, res: Response) => {
    await deleteReply(req, res);
  }
);
