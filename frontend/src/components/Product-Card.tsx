import { useState, useRef } from "react";
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
  onToggleFavorite?: (productId: string) => void;
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = (y / rect.height) * 15; // Reduced tilt angle for smaller card
    const tiltY = -(x / rect.width) * 15;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full max-w-[250px] ${className}`} // Reduced max-width for smaller card
    >
      <div
        ref={cardRef}
        className="relative group hover:shadow-xl transition-all duration-300"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(15px)`, // Adjusted perspective for smaller size
          transition: 'transform 0.2s ease-out',
        }}
      >
        <Card className="relative bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 border border-transparent backdrop-blur-sm shadow-lg glow-edge"
          style={{
            boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1) dark:shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]',
          }}>
          {actionError && (
            <p className="text-xs text-red-500 dark:text-red-400 animate-pulse p-1">
              {actionError}
            </p>
          )}

          {/* Image Section */}
          <div className="relative aspect-[3/2] overflow-hidden bg-gray-100 dark:bg-slate-700"> {/* Adjusted aspect ratio for smaller card */}
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
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-slate-400 text-xs">
                No Image
              </div>
            )}

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              disabled={togglingFavorite}
              className="absolute top-2 right-2 p-1.5 bg-gray-100/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-full shadow-md hover:bg-gray-200/90 dark:hover:bg-slate-600/90 transition-colors"
              style={{
                boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1) dark:[0_3px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]',
              }}
            >
              <Heart
                className={`w-3 h-3 transition-colors ${
                  localFavorite ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-slate-400"
                }`}
              />
            </button>

            {/* Category Badge */}
            {product.category && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-green-600 hover:bg-green-700 text-white border border-green-500 dark:border-green-700 text-xs py-0.5 px-1.5">
                  {product.category}
                </Badge>
              </div>
            )}

            {/* Low Stock Badge */}
            {product.quantity !== undefined && product.quantity < 10 && (
              <div className="absolute bottom-2 right-2">
                <Badge variant="destructive" className="text-[10px] bg-red-600 dark:bg-red-700 border border-red-500 dark:border-red-800 py-0.5 px-1.5">
                  Only {product.quantity} left
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="p-3"> {/* Reduced padding */}
            <div className="mb-2">
              <h3 className="font-semibold text-base text-gray-900 dark:text-white line-clamp-1 mb-0.5"> {/* Smaller font, single line */}
                {product.title || "Untitled Product"}
              </h3>
              <p className="text-xs text-gray-600 dark:text-slate-400 font-medium">
                {product.brand || "N/A"}
              </p>
            </div>

            <p className="text-gray-600 dark:text-slate-300 text-xs line-clamp-1 mb-2"> {/* Single line description */}
              {product.description || "No description available."}
            </p>

            <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-500 dark:text-slate-400"> {/* Smaller icons and text */}
              <div className="flex items-center gap-0.5">
                <Package className="w-2.5 h-2.5" />
                <span>{product.quantity ?? "N/A"} units</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Scale className="w-2.5 h-2.5" />
                <span>{product.weight ? `${product.weight}kg` : "N/A"}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Heart className="w-2.5 h-2.5" />
                <span>{favoriteCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3 text-gray-400 dark:text-slate-500" />
              <span className="text-xs text-gray-600 dark:text-slate-300">
                {product.location?.coordinates
                  ? getDistance(product.location.coordinates)
                  : "Location N/A"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-2">
              <Avatar className="w-6 h-6"> {/* Smaller avatar */}
                <AvatarFallback className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  {getSellerInitials(getSellerName())}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {getSellerName()}
                </span>
              </div>
            </div>

            <div className="mb-2">
              <span className="text-lg font-bold text-green-600 dark:text-green-400"> {/* Smaller price font */}
                {formatPrice(product.price || 0)}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-slate-400 ml-1">
                per unit
              </span>
            </div>
          </CardContent>

          <CardFooter className="p-3 pt-0 space-y-2"> {/* Reduced padding and spacing */}
            <div className="flex flex-wrap gap-1.5 w-full">
              <Button
                onClick={() => {
                  if (onViewDetails) onViewDetails(product._id);
                  else navigate(`/product/${product._id}`);
                }}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md text-xs py-1.5"
                style={{
                  boxShadow: '0 6px 15px rgba(34, 197, 94, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                }}
              >
                <Package className="w-3 h-3 mr-1" />
                Details
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
                className="flex-1 bg-gray-200/50 hover:bg-gray-300/70 border border-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-300 backdrop-blur-sm transform hover:scale-105 dark:bg-slate-600/50 dark:hover:bg-slate-600/70 dark:border-slate-500/50 dark:text-slate-300 text-xs py-1.5"
                style={{
                  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1) dark:[0_3px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]',
                }}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Chat
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <style>{`
        .glow-edge {
          position: relative;
        }
        .glow-edge::before {
          content: '';
          position: absolute;
          inset: -4px; /* Slightly smaller glow for compact card */
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
          filter: blur(6px); /* Reduced blur for smaller card */
        }
        .group:hover .glow-edge::before {
          opacity: 1;
        }
      `}</style>
    </motion.div>
  );
}