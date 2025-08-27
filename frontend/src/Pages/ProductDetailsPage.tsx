import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Star, Edit2, Save, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { IProduct } from "@/types/product";
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
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const productCardRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const reviewCardRefs = useRef<Record<string, HTMLDivElement>>({});
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [reviewTilts, setReviewTilts] = useState<Record<string, { x: number; y: number }>>({});

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
    } catch (error) {
      const fetchError = error as FetchBaseQueryError;
      const message = fetchError.data && typeof fetchError.data === 'object' && 'message' in fetchError.data
        ? (fetchError.data as { message: string }).message
        : "Failed to add review.";
      setActionError(message);
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
    } catch (error) {
      const fetchError = error as FetchBaseQueryError;
      const message = fetchError.data && typeof fetchError.data === 'object' && 'message' in fetchError.data
        ? (fetchError.data as { message: string }).message
        : "Failed to edit review.";
      setActionError(message);
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
    } catch (error) {
      const fetchError = error as FetchBaseQueryError;
      const message = fetchError.data && typeof fetchError.data === 'object' && 'message' in fetchError.data
        ? (fetchError.data as { message: string }).message
        : "Failed to add reply.";
      setActionError(message);
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
    } catch (error) {
      const fetchError = error as FetchBaseQueryError;
      const message = fetchError.data && typeof fetchError.data === 'object' && 'message' in fetchError.data
        ? (fetchError.data as { message: string }).message
        : "Failed to delete review.";
      setActionError(message);
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
    } catch (error) {
      const fetchError = error as FetchBaseQueryError;
      const message = fetchError.data && typeof fetchError.data === 'object' && 'message' in fetchError.data
        ? (fetchError.data as { message: string }).message
        : "Failed to delete reply.";
      setActionError(message);
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

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    ref: React.RefObject<HTMLDivElement>,
    isReview: boolean = false,
    reviewId?: string
  ) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = (y / rect.height) * 10;
    const tiltY = -(x / rect.width) * 10;
    if (isReview && reviewId) {
      setReviewTilts((prev) => ({ ...prev, [reviewId]: { x: tiltX, y: tiltY } }));
    } else {
      setTilt({ x: tiltX, y: tiltY });
    }
  };

  const handleMouseLeave = (isReview: boolean = false, reviewId?: string) => {
    if (isReview && reviewId) {
      setReviewTilts((prev) => ({ ...prev, [reviewId]: { x: 0, y: 0 } }));
    } else {
      setTilt({ x: 0, y: 0 });
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
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500 dark:text-red-400"
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
        <p className="text-red-500 dark:text-red-400 text-sm">
        
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
        <div className="absolute top-8 right-6 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s', animationDuration: '2s' }}></div>
        <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-blue-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.5s', animationDuration: '2s' }}></div>
        <div className="absolute bottom-4 right-4 w-2 h-2 bg-purple-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '1.5s', animationDuration: '2s' }}></div>
      </div>

      <motion.div
        className="max-w-5xl mx-auto space-y-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Error Display */}
        {actionError && (
          <p className="text-sm text-red-500 dark:text-red-400 animate-pulse p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
            {actionError}
          </p>
        )}

        {/* Product Info */}
        <div
          ref={productCardRef}
          className="relative group glow-edge"
          onMouseMove={(e) => handleMouseMove(e, productCardRef)}
          onMouseLeave={() => handleMouseLeave()}
          style={{
            transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(15px)`,
            transition: 'transform 0.2s ease-out',
          }}
        >
          <Card className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 border-transparent backdrop-blur-sm shadow-lg"
            style={{
              boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1) dark:shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]',
            }}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title || "Product"}
                className="rounded-lg w-full object-cover aspect-[4/3] transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="rounded-lg w-full bg-gray-100 dark:bg-slate-700/50 aspect-[4/3] flex items-center justify-center text-gray-500 dark:text-slate-400 text-sm">
                No Image Available
              </div>
            )}
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {product.title || "Untitled Product"}
              </h1>
              <p className="text-gray-600 dark:text-slate-300 text-sm">
                {product.description || "No description available."}
              </p>
              <p className="text-green-600 dark:text-green-400 font-semibold text-lg">
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
        </div>

        {/* Seller Info */}
        <Card className="p-4 flex items-center justify-between bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 border-transparent backdrop-blur-sm shadow-lg glow-edge"
          style={{
            boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1) dark:shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]',
          }}
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                {product.sellerId && typeof product.sellerId === "object"
                  ? product.sellerId.name?.[0] || "U"
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {product.sellerId && typeof product.sellerId === "object"
                  ? product.sellerId.name || "Unknown Seller"
                  : "Unknown Seller"}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Seller ID:{" "}
                {product.sellerId && typeof product.sellerId === "object"
                  ? product.sellerId._id
                  : product.sellerId || "N/A"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleChatClick}
            variant="outline"
            className="bg-gray-100/50 hover:bg-gray-200/70 border border-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-300 backdrop-blur-sm transform hover:scale-105 dark:bg-slate-600/50 dark:hover:bg-slate-600/70 dark:border-slate-500/50 dark:text-slate-300 text-sm py-1.5"
            style={{
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1) dark:[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]',
            }}
          >
            <MessageCircle className="w-4 h-4 mr-1" /> Chat
          </Button>
        </Card>

        {/* Reviews */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Reviews
          </h2>

          {/* Add Review */}
          <Card className="p-4 space-y-3 bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 border-transparent backdrop-blur-sm shadow-lg glow-edge"
            style={{
              boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1) dark:shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]',
            }}
          >
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
              className="bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
              style={{
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]',
              }}
            />
            <Button
              onClick={handleAddReview}
              disabled={!comment || rating === 0 || addingReview}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md text-sm py-1.5"
              style={{
                boxShadow: '0 6px 15px rgba(34, 197, 94, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
              }}
            >
              {addingReview ? "Submitting..." : "Submit Review"}
            </Button>
          </Card>

          {/* List Reviews */}
          {reviews.length === 0 && (
            <p className="text-gray-500 dark:text-slate-300 text-sm">
              No reviews yet.
            </p>
          )}
          {reviews.map((rev: IReview) => (
            <div
              key={rev._id}
              className="relative group glow-edge"
              onMouseMove={(e) => handleMouseMove(e, { current: reviewCardRefs.current[rev._id] }, true, rev._id)}
              onMouseLeave={() => handleMouseLeave(true, rev._id)}
              style={{
                transform: `perspective(800px) rotateX(${reviewTilts[rev._id]?.x || 0}deg) rotateY(${reviewTilts[rev._id]?.y || 0}deg) translateZ(10px)`,
                transition: 'transform 0.2s ease-out',
              }}
            >
              <Card
                ref={(el) => {
                  if (el) reviewCardRefs.current[rev._id] = el;
                }}
                className="p-4 space-y-2 bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 border-transparent backdrop-blur-sm shadow-lg"
                style={{
                  boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1) dark:shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        {rev.user?.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
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
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartEditReview(rev)}
                        className="bg-gray-100/50 hover:bg-gray-200/70 border border-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-300 backdrop-blur-sm transform hover:scale-105 dark:bg-slate-600/50 dark:hover:bg-slate-600/70 dark:border-slate-500/50 dark:text-slate-300 text-xs py-1"
                        style={{
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1) dark:[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]',
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteReview(rev._id)}
                        className="bg-red-600 hover:bg-red-700 rounded-lg text-xs py-1"
                        style={{
                          boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                        }}
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
                      className="bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
                      style={{
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]',
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditReview(rev._id)}
                        disabled={!editComment || editRating === 0 || editingReview}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md text-sm py-1.5"
                        style={{
                          boxShadow: '0 6px 15px rgba(34, 197, 94, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {editingReview ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        className="bg-gray-100/50 hover:bg-gray-200/70 border border-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-300 backdrop-blur-sm transform hover:scale-105 dark:bg-slate-600/50 dark:hover:bg-slate-600/70 dark:border-slate-500/50 dark:text-slate-300 text-sm py-1.5"
                        style={{
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1) dark:[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]',
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    {rev.comment}
                  </p>
                )}

                {/* Replies */}
                <div className="pl-6 space-y-2">
                  {rev.replies?.map((rep) => (
                    <div
                      key={rep._id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            {rep.user?.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {rep.user?.name || "Anonymous"}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-slate-300">
                            {rep.comment}
                          </p>
                        </div>
                      </div>
                      {rep.user?._id === userId && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteReply(rev._id, rep._id)}
                          className="bg-red-600 hover:bg-red-700 rounded-lg text-xs py-1"
                          style={{
                            boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                          }}
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
                      className="flex-1 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
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
                      style={{
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]',
                      }}
                    />
                    {replyMap[rev._id]?.trim() && (
                      <Button
                        size="sm"
                        onClick={() => handleReply(rev._id)}
                        disabled={replyLoadingMap[rev._id] || sendingReply}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md text-sm py-1.5"
                        style={{
                          boxShadow: '0 6px 15px rgba(34, 197, 94, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        {replyLoadingMap[rev._id] || sendingReply
                          ? "Sending..."
                          : "Send"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </motion.div>

      <style>{`
        .glow-edge {
          position: relative;
        }
        .glow-edge::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 10px;
          background: linear-gradient(
            45deg,
            rgba(59, 130, 246, 0.3),
            rgba(147, 51, 234, 0.3),
            rgba(59, 130, 246, 0.3)
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
          filter: blur(6px);
        }
        .group:hover .glow-edge::before {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
