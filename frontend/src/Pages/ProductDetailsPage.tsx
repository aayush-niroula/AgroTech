import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle, Star, Edit2, Save, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { IProduct} from "@/types/product";
import type { IReview } from "@/types/review";
import {
  useGetProductByIdQuery,
  useIncrementProductViewMutation,
} from "@/services/productApi";
import {
  useGetReviewsQuery,
  useAddReviewMutation,
  useReplyToReviewMutation,
  useEditReviewMutation,
  useDeleteReviewMutation,
  useDeleteReplyMutation,
} from "@/services/reviewApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  // Authentication state
  const { userId, isAuthenticated } = useSelector((state: RootState) => ({
    userId: state.auth.user?.id,
    isAuthenticated: !!state.auth.user,
  }));

  // Fetch product
  const { data: productRes, isLoading, isError, error } = useGetProductByIdQuery(
    productId || "",
    { skip: !productId }
  );
  const product: IProduct | undefined = productRes?.data;

  const [incrementView] = useIncrementProductViewMutation();

  // Increment view count
  useEffect(() => {
    if (productId) {
      incrementView(productId).catch((err) =>
        console.error("Failed to increment view:", err)
      );
    }
  }, [productId, incrementView]);

  // Fetch reviews
  const { data: reviews = [], isLoading: reviewsLoading, isError: reviewsError } =
    useGetReviewsQuery(productId || "", { skip: !productId });

  const [addReview, { isLoading: addingReview }] = useAddReviewMutation();
  const [replyToReview, { isLoading: sendingReply }] = useReplyToReviewMutation();
  const [editReview, { isLoading: editingReview }] = useEditReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();
  const [deleteReply] = useDeleteReplyMutation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [replyLoadingMap, setReplyLoadingMap] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [editReviewId, setEditReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(0);
  const [editComment, setEditComment] = useState<string>("");

  const handleAddReview = async () => {
    setActionError(null);
    if (!isAuthenticated) {
      setActionError("Please log in to add a review.");
      navigate("/login");
      return;
    }
    if (!rating || !comment || !productId) {
      setActionError("Please provide a rating and comment.");
      return;
    }
    try {
      await addReview({ productId, rating, comment }).unwrap();
      setRating(0);
      setComment("");
    } catch (error: any) {
      setActionError(error?.data?.message || "Failed to add review.");
    }
  };

  const handleEditReview = async (reviewId: string) => {
    setActionError(null);
    if (!isAuthenticated) {
      setActionError("Please log in to edit a review.");
      navigate("/login");
      return;
    }
    if (!editRating || !editComment || !productId) {
      setActionError("Please provide a rating and comment.");
      return;
    }
    try {
      await editReview({ reviewId, rating: editRating, comment: editComment, productId }).unwrap();
      setEditReviewId(null);
      setEditRating(0);
      setEditComment("");
    } catch (error: any) {
      setActionError(error?.data?.message || "Failed to edit review.");
    }
  };

  const handleStartEditReview = (review: IReview) => {
    setEditReviewId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setActionError(null);
  };

  const handleCancelEdit = () => {
    setEditReviewId(null);
    setEditRating(0);
    setEditComment("");
    setActionError(null);
  };

  const handleReply = async (reviewId: string) => {
    setActionError(null);
    if (!isAuthenticated) {
      setActionError("Please log in to reply to a review.");
      navigate("/login");
      return;
    }
    const replyText = replyMap[reviewId]?.trim();
    if (!replyText || !productId) {
      setActionError("Please provide a reply.");
      return;
    }
    setReplyLoadingMap((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await replyToReview({ productId, reviewId, comment: replyText }).unwrap();
      setReplyMap((prev) => ({ ...prev, [reviewId]: "" }));
    } catch (error: any) {
      setActionError(error?.data?.message || "Failed to add reply.");
    } finally {
      setReplyLoadingMap((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    setActionError(null);
    if (!isAuthenticated) {
      setActionError("Please log in to delete a review.");
      navigate("/login");
      return;
    }
    if (!productId) return;
    try {
      await deleteReview({ productId, reviewId }).unwrap();
    } catch (error: any) {
      setActionError(error?.data?.message || "Failed to delete review.");
    }
  };

  const handleDeleteReply = async (reviewId: string, replyId: string) => {
    setActionError(null);
    if (!isAuthenticated) {
      setActionError("Please log in to delete a reply.");
      navigate("/login");
      return;
    }
    if (!productId) return;
    try {
      await deleteReply({ productId, reviewId, replyId }).unwrap();
    } catch (error: any) {
      setActionError(error?.data?.message || "Failed to delete reply.");
    }
  };

  const handleChatClick = () => {
    setActionError(null);
    if (!product) {
      setActionError("Product not found.");
      return;
    }
    try {
      const sellerId =
        typeof product.sellerId === "string"
          ? product.sellerId
          : product.sellerId?._id;
      if (!sellerId) {
        setActionError("Seller ID not found.");
        return;
      }
      navigate(`/chat/${sellerId}`);
    } catch (error) {
      setActionError("Failed to initiate chat.");
    }
  };

  if (isLoading || reviewsLoading) {
    return (
      <div className="p-6 text-center text-gray-600 dark:text-slate-400">
        Loading...
      </div>
    );
  }

  if (isError || !product || reviewsError) {
    return (
      <div className="p-6 text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-red-500 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-red-500 dark:text-red-400">
          {(error as any)?.data?.message ||
            (reviewsError && "Failed to load reviews") ||
            "Error loading product."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Error Display */}
      {actionError && (
        <p className="text-sm text-red-500 dark:text-red-400 animate-pulse">
          {actionError}
        </p>
      )}

      {/* Product Info */}
      <Card className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-gray-200 dark:border-slate-600">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title || "Product"}
            className="rounded-md w-full object-cover aspect-video"
          />
        ) : (
          <div className="rounded-md w-full bg-gray-200 dark:bg-slate-700 aspect-video flex items-center justify-center text-gray-500 dark:text-slate-400">
            No Image Available
          </div>
        )}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {product.title || "Untitled Product"}
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            {product.description || "No description available."}
          </p>
          <p className="text-green-600 font-semibold text-lg">
            NPR {product.price?.toLocaleString() || "0"} / unit
          </p>
          <div className="text-sm text-gray-500 dark:text-slate-400">
            Category: {product.category || "N/A"}
          </div>
          <div className="text-sm text-gray-500 dark:text-slate-400">
            Brand: {product.brand || "N/A"}
          </div>
          <div className="text-sm text-gray-500 dark:text-slate-400">
            Stock: {product.quantity ?? "N/A"}
          </div>
          <div className="text-sm text-gray-500 dark:text-slate-400">
            Weight: {product.weight ? `${product.weight}kg` : "N/A"}
          </div>
          <div className="text-sm text-gray-500 dark:text-slate-400">
            Favorites: {product.favorites ?? 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-slate-400">
            Views: {product.views ?? 0}
          </div>
        </div>
      </Card>

      {/* Seller Info */}
      <Card className="p-4 flex items-center justify-between bg-white/80 dark:bg-slate-800/80 backdrop-blur border-gray-200 dark:border-slate-600">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback>
              {product.sellerId && typeof product.sellerId === "object"
                ? product.sellerId.name?.[0] || "U"
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900 dark:text-slate-100">
              {product.sellerId && typeof product.sellerId === "object"
                ? product.sellerId.name || "Unknown Seller"
                : "Unknown Seller"}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Seller ID:{" "}
              {product.sellerId &&
              typeof product.sellerId === "object"
                ? product.sellerId._id
                : product.sellerId || "N/A"}
            </p>
          </div>
        </div>
        <Button
          onClick={handleChatClick}
          variant="outline"
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          <MessageCircle className="w-4 h-4 mr-1" /> Chat
        </Button>
      </Card>

      {/* Reviews */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          Reviews
        </h2>

        {/* Add Review */}
        <Card className="p-4 space-y-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-gray-200 dark:border-slate-600">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                onClick={() => setRating(n)}
                className={`w-5 h-5 cursor-pointer ${
                  n <= rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300 dark:text-slate-500"
                }`}
              />
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your review..."
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-gray-200 dark:border-slate-600"
          />
          <Button
            onClick={handleAddReview}
            disabled={!comment || rating === 0 || addingReview}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            {addingReview ? "Submitting..." : "Submit Review"}
          </Button>
        </Card>

        {/* List Reviews */}
        {reviews.length === 0 && (
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            No reviews yet.
          </p>
        )}
        {reviews.map((rev: IReview) => (
          <Card
            key={rev._id}
            className="p-4 space-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-gray-200 dark:border-slate-600"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {rev.user?.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">
                    {rev.user?.name || "Anonymous"}
                  </p>
                  <div className="flex">
                    {[...Array(rev.rating || 0)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                </div>
              </div>
              {rev.user?._id === userId && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartEditReview(rev)}
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteReview(rev._id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
            {editReviewId === rev._id ? (
              <div className="space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      onClick={() => setEditRating(n)}
                      className={`w-5 h-5 cursor-pointer ${
                        n <= editRating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300 dark:text-slate-500"
                      }`}
                    />
                  ))}
                </div>
                <Textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Edit your review..."
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-gray-200 dark:border-slate-600"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEditReview(rev._id)}
                    disabled={!editComment || editRating === 0 || editingReview}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {editingReview ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {rev.comment}
              </p>
            )}

            {/* Replies */}
            <div className="pl-8 space-y-2">
              {rev.replies?.map((rep) => (
                <div
                  key={rep._id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback>
                        {rep.user?.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      {rep.user?.name || "Anonymous"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {rep.comment}
                    </p>
                  </div>
                  {rep.user?._id === userId && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteReply(rev._id, rep._id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              ))}

              {/* Reply Input */}
              <div className="flex gap-2 mt-1">
                <Textarea
                  value={replyMap[rev._id] || ""}
                  placeholder="Reply..."
                  className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-gray-200 dark:border-slate-600"
                  onChange={(e) =>
                    setReplyMap((prev) => ({
                      ...prev,
                      [rev._id]: e.target.value,
                    }))
                  }
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      await handleReply(rev._id);
                    }
                  }}
                  disabled={replyLoadingMap[rev._id] || sendingReply}
                />
                {replyMap[rev._id]?.trim() && (
                  <Button
                    size="sm"
                    onClick={() => handleReply(rev._id)}
                    disabled={replyLoadingMap[rev._id] || sendingReply}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    {replyLoadingMap[rev._id] || sendingReply
                      ? "Sending..."
                      : "Send"}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}