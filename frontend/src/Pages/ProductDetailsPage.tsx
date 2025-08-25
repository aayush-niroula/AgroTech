import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { IProduct } from "@/types/product";
import {
  useGetProductByIdQuery,
  useIncrementProductViewMutation,
} from "@/services/productApi";
import {
  useGetReviewsQuery,
  useAddReviewMutation,
  useReplyToReviewMutation,
  useDeleteReviewMutation,
  useDeleteReplyMutation,
} from "@/services/reviewApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  // Current logged-in user
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  // Fetch product
  const { data: productRes, isLoading, isError } = useGetProductByIdQuery(
    productId || ""
  );
  const product: IProduct | undefined = productRes?.data;

  const [incrementView] = useIncrementProductViewMutation();

  useEffect(() => {
    if (productId) incrementView(productId).catch(() => {});
  }, [productId, incrementView]);

  // Reviews
  const { data: reviews = [], refetch: refetchReviews } = useGetReviewsQuery(
    productId || ""
  );
  const [addReview, { isLoading: addingReview }] = useAddReviewMutation();
  const [replyToReview, { isLoading: sendingReply }] = useReplyToReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();
  const [deleteReply] = useDeleteReplyMutation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [replyLoadingMap, setReplyLoadingMap] = useState<Record<string, boolean>>({});

  const handleAddReview = async () => {
    if (!rating || !comment || !productId) return;
    await addReview({ productId, rating, comment });
    setRating(0);
    setComment("");
    await refetchReviews();
  };

  const handleReply = async (reviewId: string) => {
    const replyText = replyMap[reviewId]?.trim();
    if (!replyText || !productId) return;

    setReplyLoadingMap((prev) => ({ ...prev, [reviewId]: true }));
    await replyToReview({ productId, reviewId, comment: replyText });
    setReplyMap((prev) => ({ ...prev, [reviewId]: "" }));
    await refetchReviews();
    setReplyLoadingMap((prev) => ({ ...prev, [reviewId]: false }));
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!productId) return;
    await deleteReview({ productId, reviewId });
    await refetchReviews();
  };

  const handleDeleteReply = async (reviewId: string, replyId: string) => {
    if (!productId) return;
    await deleteReply({ productId, reviewId, replyId });
    await refetchReviews();
  };

  const handleChatClick = () => {
    if (!product) return;
    const sellerId =
      typeof product.sellerId === "string" ? product.sellerId : product.sellerId._id;
    navigate(`/chat/${sellerId}`);
  };

  if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (isError || !product)
    return <div className="p-6 text-red-500">Error loading product.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Product Info */}
      <Card className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="rounded-md w-full object-cover aspect-video"
          />
        ) : (
          <div className="rounded-md w-full bg-gray-200 aspect-video flex items-center justify-center text-gray-500">
            No Image Available
          </div>
        )}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-gray-600">{product.description}</p>
          <p className="text-green-600 font-semibold text-lg">
            NPR {product.price.toLocaleString()} / unit
          </p>
          <div className="text-sm text-gray-500">Category: {product.category}</div>
          <div className="text-sm text-gray-500">Brand: {product.brand}</div>
          <div className="text-sm text-gray-500">Stock: {product.quantity}</div>
          <div className="text-sm text-gray-500">Weight: {product.weight}kg</div>
          <div className="text-sm text-gray-500">Favorites: {product.favorites}</div>
          <div className="text-sm text-gray-500">Views: {product.views}</div>
        </div>
      </Card>

      {/* Seller Info */}
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback>
              {product.sellerId && typeof product.sellerId === "object"
                ? product.sellerId.name?.[0] || "U"
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">
              {product.sellerId && typeof product.sellerId === "object"
                ? product.sellerId.name
                : "Unknown Seller"}
            </p>
            <p className="text-sm text-gray-500">
              Seller ID:{" "}
              {product.sellerId &&
              typeof product.sellerId === "object"
                ? product.sellerId._id
                : product.sellerId}
            </p>
          </div>
        </div>
        <Button onClick={handleChatClick} variant="outline">
          <MessageCircle className="w-4 h-4 mr-1" /> Chat
        </Button>
      </Card>

      {/* Reviews */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Reviews</h2>

        {/* Add Review */}
        <Card className="p-4 space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                onClick={() => setRating(n)}
                className={`w-5 h-5 cursor-pointer ${
                  n <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your review..."
          />
          <Button
            onClick={handleAddReview}
            disabled={!comment || rating === 0 || addingReview}
          >
            {addingReview ? "Submitting..." : "Submit Review"}
          </Button>
        </Card>

        {/* List Reviews */}
        {reviews.length === 0 && (
          <p className="text-gray-500 text-sm">No reviews yet.</p>
        )}
        {reviews.map((rev: any) => (
          <Card key={rev._id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{rev.user?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{rev.user?.name || "Anonymous"}</p>
                  <div className="flex">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                </div>
              </div>
              {rev.user?._id === userId && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteReview(rev._id)}
                >
                  Delete
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-600">{rev.comment}</p>

            {/* Replies */}
            <div className="pl-8 space-y-2">
              {rev.replies?.map((rep: any) => (
                <div key={rep._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback>{rep.user?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">{rep.user?.name}</p>
                    <p className="text-sm">{rep.comment}</p>
                  </div>
                  {rep.user?._id === userId && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteReply(rev._id, rep._id)}
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
                  className="flex-1"
                  onChange={(e) =>
                    setReplyMap((prev) => ({ ...prev, [rev._id]: e.target.value }))
                  }
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      await handleReply(rev._id);
                    }
                  }}
                  disabled={replyLoadingMap[rev._id]}
                />
                {replyMap[rev._id]?.trim() !== "" && (
                  <Button
                    size="sm"
                    onClick={() => handleReply(rev._id)}
                    disabled={replyLoadingMap[rev._id]}
                  >
                    {replyLoadingMap[rev._id] ? "Sending..." : "Send"}
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
