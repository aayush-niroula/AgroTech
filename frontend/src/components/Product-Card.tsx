import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MapPin,
  MessageCircle,
  Phone,
  ShoppingCart,
  Heart,
  Package,
  Scale,
  Eye,
} from "lucide-react";
import type { IProduct, Seller } from "../types/product";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: IProduct & { sellerId: Seller | string }; // support string or Seller object
  onAddToCart?: (productId: string) => void;
  onToggleFavorite?: (productId: string) => void;
  onChat?: (sellerId: string) => void;
  onCall?: (sellerId: string) => void;
  onViewDetails?: (productId: string) => void;
  isFavorited?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  onAddToCart,
  onToggleFavorite,
  onChat,
  onCall,
  onViewDetails,
  isFavorited = false,
  className = "",
}: ProductCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const navigate = useNavigate()
 
  const getSellerName = (): string => {
    if (typeof product.sellerId === "object" && product.sellerId.name) {
      return product.sellerId.name;
    }
    return "Unknown Seller";
  };

  // Helper to get seller id string safely
  const getSellerId = (): string => {
    if (typeof product.sellerId === "string") return product.sellerId;
    if (typeof product.sellerId === "object") return product.sellerId._id;
    return "";
  };

  // Mock distance calculation
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
      <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden bg-white">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {product.imageUrl.length > 0 && (
            <img
              src={product.imageUrl || "/placeholder.svg?height=300&width=400"}
              alt={product.title}
              className={`object-cover transition-all duration-300 group-hover:scale-105 ${
                isImageLoading ? "blur-sm" : "blur-0"
              }`}
              onLoad={() => setIsImageLoading(false)}
            />
          )}

          {/* Favorite Button */}
          <button
            onClick={() => onToggleFavorite?.(product._id)}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-green-600 hover:bg-green-700 text-white">{product.category}</Badge>
          </div>

          {/* Quantity Badge */}
          {product.quantity < 10 && (
            <div className="absolute bottom-3 right-3">
              <Badge variant="destructive" className="text-xs">
                Only {product.quantity} left
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Product Title & Brand */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 mb-1">{product.title}</h3>
            <p className="text-sm text-gray-500 font-medium">{product.brand}</p>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{product.description}</p>

          {/* Product Details */}
          <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>{product.quantity} units</span>
            </div>
            <div className="flex items-center gap-1">
              <Scale className="w-3 h-3" />
              <span>{product.weight}kg</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 mb-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{getDistance(product.location.coordinates)}</span>
          </div>

          {/* Seller Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                {/* No avatar URL available */}
                <AvatarFallback className="text-xs bg-green-100 text-green-700">
                  {getSellerInitials(getSellerName())}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-sm font-medium text-gray-900">{getSellerName()}</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="mb-4">
            <span className="text-2xl font-bold text-green-600">{formatPrice(product.price)}</span>
            <span className="text-sm text-gray-500 ml-1">per unit</span>
          </div>
        </CardContent>

<CardFooter className="p-4 pt-0 space-y-3">
  <div className="flex flex-wrap gap-2 w-full">
    {/* Product Details */}
    <Button
      onClick={() =>navigate(`/product/${product._id}`)}
      className="flex-1 bg-green-600 hover:bg-green-700"
      size="sm"
    >
       <Eye className="w-4 h-4" />
      Product Details
    </Button>


    {/* Chat */}
    <Button
      onClick={() => onChat?.(getSellerId())}
      variant="outline"
      size="sm"
      className="flex-1"
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
