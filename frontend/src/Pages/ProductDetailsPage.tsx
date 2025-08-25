import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetProductByIdQuery,
  useIncrementProductViewMutation,
  
} from "@/services/productApi";
import { MessageCircle, Phone, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { IProduct } from "@/types/product";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();

  const {
    data: response,
    isLoading,
    isError,
  } = useGetProductByIdQuery(productId || "");
  const [incrementView] = useIncrementProductViewMutation();


  // Unwrap product from response safely
  const product: IProduct | undefined = response?.data;
  console.log(product);

  // Local state for reviews
  const [reviews, setReviews] = useState<
    { user: string; rating: number; comment: string }[]
  >([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (productId) {
      incrementView(productId).catch(() => {
        console.warn("Failed to increment view");
      });
    }
  }, [productId, incrementView]);

  const submitReview = () => {
    if (!comment || rating === 0) return;
    setReviews([{ user: "Anonymous", rating, comment }, ...reviews]);
    setRating(0);
    setComment("");
  };
  const handleChatClick = async () => {
    if (!product) return;
  
    const sellerId =
      typeof product.sellerId === "string"
        ? product.sellerId
        : product.sellerId._id;
    navigate(`/chat/${sellerId}`);
  };
  if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (isError || !product)
    return <div className="p-6 text-red-500">Error loading product.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Product Info */}
      <Card className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Product Image */}
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

        {/* Product Details */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-gray-600">{product.description}</p>
          <p className="text-green-600 font-semibold text-lg">
            NPR {product.price.toLocaleString()} / unit
          </p>
          <div className="text-sm text-gray-500">
            Category: {product.category}
          </div>
          <div className="text-sm text-gray-500">Brand: {product.brand}</div>
          <div className="text-sm text-gray-500">Stock: {product.quantity}</div>
          <div className="text-sm text-gray-500">
            Weight: {product.weight}kg
          </div>
          <div className="text-sm text-gray-500">
            Favorites: {product.favorites}
          </div>
          <div className="text-sm text-gray-500">Views: {product.views}</div>
        </div>
      </Card>

      {/* Seller Info */}
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback>
              {product.sellerId &&
              typeof product.sellerId === "object" &&
              product.sellerId.name
                ? product.sellerId.name[0]
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">
              {product.sellerId &&
              typeof product.sellerId === "object" &&
              product.sellerId.name
                ? product.sellerId.name
                : "Unknown Seller"}
            </p>
            <p className="text-sm text-gray-500">
              Seller ID:{" "}
              {product.sellerId &&
              typeof product.sellerId === "object" &&
              product.sellerId._id
                ? product.sellerId._id
                : typeof product.sellerId === "string"
                ? product.sellerId
                : "Unknown"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleChatClick} variant="outline">
            <MessageCircle className="w-4 h-4 mr-1" />
            Chat
          </Button>
        </div>
      </Card>

      {/* Review Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Reviews</h2>
        <Card className="p-4 space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                onClick={() => setRating(n)}
                className={`w-5 h-5 cursor-pointer ${
                  n <= rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your review..."
          />
          <Button onClick={submitReview} disabled={!comment || rating === 0}>
            Submit Review
          </Button>
        </Card>

        {/* List Reviews */}
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-sm">No reviews yet.</p>
        ) : (
          reviews.map((rev, idx) => (
            <Card key={idx} className="p-4 space-y-1">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{rev.user[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{rev.user}</p>
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
              <p className="text-sm text-gray-600">{rev.comment}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
