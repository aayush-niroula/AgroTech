import { Request, Response } from "express";
import mongoose from "mongoose";
import { Review } from "../models/review.model";
import { Product } from "../models/product.model";

const updateProductRating = async (productId: mongoose.Types.ObjectId | string) => {
  const reviews = await Review.find({ product: productId });
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: avgRating,
    reviewCount: reviews.length,
  });
};

export const addReview = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const review = await Review.create({
      product: new mongoose.Types.ObjectId(productId),
      user: userObjectId,
      rating,
      comment,
    });

    await updateProductRating(productId);

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: "Failed to add review" });
  }
};

/**
 * Get all reviews for a product
 */
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate("user", "name avatarUrl")
      .populate("replies.user", "name avatarUrl")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

/**
 * Reply to a review
 */
export const replyToReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });

    review.replies.push({
      user: new mongoose.Types.ObjectId(userId),
      comment,
    } as any); // typecast for TS

    await review.save();

    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ error: "Failed to reply" });
  }
};

/**
 * Edit a review
 */
export const editReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });
    if (review.user.toString() !== userId)
      return res.status(403).json({ error: "Not authorized" });

    if (rating !== undefined) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();
    await updateProductRating(review.product);

    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ error: "Failed to update review" });
  }
};

/**
 * Delete a review
 */
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });
    if (review.user.toString() !== userId)
      return res.status(403).json({ error: "Not authorized" });

    await review.deleteOne();
    await updateProductRating(review.product);

    res.status(200).json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete review" });
  }
};

/**
 * Delete a reply
 */
export const deleteReply = async (req: Request, res: Response) => {
  try {
    const { reviewId, replyId } = req.params;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });

    // Find reply manually
    const replyIndex = review.replies.findIndex(
      (r: any) => r._id.toString() === replyId
    );

    if (replyIndex === -1)
      return res.status(404).json({ error: "Reply not found" });

    const reply = review.replies[replyIndex];
    if (reply.user.toString() !== userId)
      return res.status(403).json({ error: "Not authorized" });

    review.replies.splice(replyIndex, 1);
    await review.save();

    res.status(200).json({ message: "Reply deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete reply" });
  }
};
