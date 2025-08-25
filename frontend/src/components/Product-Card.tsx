import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, MessageCircle, Heart, Package, Scale } from "lucide-react";
import type { IProduct, Seller } from "../types/product";
import { useNavigate } from "react-router-dom";
import { useToggleFavoriteMutation } from "@/services/productApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";

interface ProductCardProps {
  product: IProduct & { sellerId: Seller | string };
  onChat?: (sellerId: string) => void;
  onViewDetails?: (productId: string) => void;
  onToggleFavorite?:(productId:string)=>void;
  isFavorited?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  onChat,
  onViewDetails,
  isFavorited = false,
  className = "",
}: ProductCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [localFavorite, setLocalFavorite] = useState(isFavorited);
  const [favoriteCount, setFavoriteCount] = useState(product.favorites || 0);
  const [actionError, setActionError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => ({
    isAuthenticated: !!state.auth.user,
  }));

  const [toggleFavorite, { isLoading: togglingFavorite }] = useToggleFavoriteMutation();

  const handleFavoriteClick = async () => {
    setActionError(null);
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      setLocalFavorite(!localFavorite);
      setFavoriteCount((prev) => (localFavorite ? prev - 1 : prev + 1));
      await toggleFavorite({
        productId: product._id,
        increment: !localFavorite,
      }).unwrap();
    } catch (error: any) {
      setActionError(error?.data?.message || "Failed to toggle favorite.");
      // revert UI change if error
      setLocalFavorite((prev) => !prev);
      setFavoriteCount(product.favorites || 0);
    }
  };

  const getSellerName = (): string => {
    if (typeof product.sellerId === "object" && product.sellerId?.name) {
      return product.sellerId.name;
    }
    return "Unknown Seller";
  };

  const getSellerId = (): string => {
    if (typeof product.sellerId === "string") return product.sellerId;
    if (typeof product.sellerId === "object" && product.sellerId?._id) return product.sellerId._id;
    return "";
  };

  const getDistance = (coordinates: [number, number]) => {
    return `${Math.floor(Math.random() * 50 + 1)} km away`;
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "NPR",
    }).format(price);

  const getSellerInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur">
        {actionError && (
          <p className="text-sm text-red-500 dark:text-red-400 animate-pulse p-2">
            {actionError}
          </p>
        )}

        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-slate-700">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title || "Product"}
              className={`object-cover transition-all duration-300 group-hover:scale-105 ${
                isImageLoading ? "blur-sm" : "blur-0"
              }`}
              onLoad={() => setIsImageLoading(false)}
              onError={() => setIsImageLoading(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-slate-400">
              No Image Available
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            disabled={togglingFavorite}
            className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white dark:hover:bg-slate-700 transition-colors"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                localFavorite ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-slate-400"
              }`}
            />
          </button>

          {/* Category Badge */}
          {product.category && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-green-600 hover:bg-green-700 text-white">
                {product.category}
              </Badge>
            </div>
          )}

          {/* Low Stock Badge */}
          {product.quantity !== undefined && product.quantity < 10 && (
            <div className="absolute bottom-3 right-3">
              <Badge variant="destructive" className="text-xs">
                Only {product.quantity} left
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-slate-100 line-clamp-2 mb-1">
              {product.title || "Untitled Product"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
              {product.brand || "N/A"}
            </p>
          </div>

          <p className="text-gray-600 dark:text-slate-400 text-sm line-clamp-2 mb-3">
            {product.description || "No description available."}
          </p>

          <div className="flex items-center gap-4 mb-3 text-xs text-gray-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>{product.quantity ?? "N/A"} units</span>
            </div>
            <div className="flex items-center gap-1">
              <Scale className="w-3 h-3" />
              <span>{product.weight ? `${product.weight}kg` : "N/A"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{favoriteCount} favorites</span>
            </div>
          </div>

          <div className="flex items-center gap-1 mb-3">
            <MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500" />
            <span className="text-sm text-gray-600 dark:text-slate-400">
              {product.location?.coordinates
                ? getDistance(product.location.coordinates)
                : "Location N/A"}
            </span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  {getSellerInitials(getSellerName())}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  {getSellerName()}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatPrice(product.price || 0)}
            </span>
            <span className="text-sm text-gray-500 dark:text-slate-400 ml-1">
              per unit
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 space-y-3">
          <div className="flex flex-wrap gap-2 w-full">
            <Button
              onClick={() => {
                if (onViewDetails) onViewDetails(product._id);
                else navigate(`/product/${product._id}`);
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Package className="w-4 h-4 mr-2" />
              Product Details
            </Button>

            <Button
              onClick={() => {
                const sellerId = getSellerId();
                if (!sellerId) {
                  setActionError("Seller ID not found.");
                  return;
                }
                if (onChat) onChat(sellerId);
                else navigate(`/chat/${sellerId}`);
              }}
              variant="outline"
              size="sm"
              className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
