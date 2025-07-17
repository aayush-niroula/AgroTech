import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, ShoppingCart, Badge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapView } from "@/components/Map";
import { ProductCard } from "@/components/Product-Card";
import {
 
  useGetProductsQuery,
  useIncrementProductViewMutation,
  useToggleFavoriteMutation,
  useIncrementProductInterestMutation,
  useToggleChatCountMutation,
} from "@/services/productApi";
import type { IProduct, ApiResponse } from '@/types/product';
import { useNavigate } from "react-router-dom";

const cities = [
  { name: "Kathmandu", coordinates: [85.324, 27.7172] },
  { name: "Pokhara", coordinates: [83.9856, 28.2096] },
  { name: "Biratnagar", coordinates: [87.2806, 26.4525] },
  { name: "Birgunj", coordinates: [84.8669, 27.0] },
  { name: "Bharatpur", coordinates: [84.4297, 27.6761] },
  { name: "Butwal", coordinates: [83.4509, 27.7] },
  { name: "Dhangadhi", coordinates: [80.5937, 28.6981] },
  { name: "Nepalgunj", coordinates: [81.625, 28.05] },
];

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(50);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [favoritedProducts, setFavoritedProducts] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [toggleFavorite] = useToggleFavoriteMutation();
const [incrementProductInterest] = useIncrementProductInterestMutation();
const [incrementProductView] = useIncrementProductViewMutation();
  const [toggleChatCount] = useToggleChatCountMutation();

const navigate = useNavigate()


  // Get user geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        },
        () => {
          setUserLocation(null);
        }
      );
    }
  }, []);

 console.log(userLocation);
 
  const {
    data,
    isLoading,
    isError,
  } = useGetProductsQuery({
    category: selectedCategory || undefined,
    coordinates: userLocation ? `${userLocation[0]},${userLocation[1]}` : undefined,
    maxDistance: userLocation ? radius * 1000 : undefined,
  });
 console.log("🌍 Requesting products with:", {
  category: selectedCategory,
  coordinates: userLocation ? `${userLocation[0]},${userLocation[1]}` : undefined,
  maxDistance: userLocation ? radius * 1000 : undefined,
});;
  
  // Categories
  
  const productList: IProduct[] = data?.data ?? [];
  
  const categories = useMemo(() => Array.from(new Set(productList.map((p) => p.category))), [productList]);
const filteredProducts = useMemo(() => {
  if (!productList.length) return [];

  let filtered = productList;

  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    filtered = filtered.filter(product =>
      [product.title, product.description, product.brand].some(field =>
        field?.toLowerCase().includes(lowerSearch)
      )
    );
  }

  if (selectedCategory) {
    const lowerCategory = selectedCategory.toLowerCase();
    filtered = filtered.filter(product => product.category?.toLowerCase() === lowerCategory);
  }

  return filtered;
}, [productList, searchTerm, selectedCategory]);

  // Handlers
  const handleAddToCart = (productId: string) => setCartItems((prev) => [...prev, productId]);

const handleToggleFavorite = async (productId: string) => {
  const isFav = favoritedProducts.includes(productId);
  setFavoritedProducts((prev) =>
    isFav ? prev.filter((id) => id !== productId) : [...prev, productId]
  );
  await toggleFavorite({ productId, increment: !isFav });
};

const handleChat = async (sellerId: string, productId: string) => {
  await toggleChatCount(productId);  // <-- call chatCount increment here
  navigate(`/chat/${sellerId}`);
};

 const handleViewDetails = async (productId: string) => {
  await incrementProductView(productId);
  alert(`Viewing details for product: ${productId}`);
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
              <p className="text-gray-600">Fresh produce from local farmers</p>
            </div>
            <div className="flex items-center gap-4">
             
              
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedCity || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) {
                  setSelectedCity(null);
                  setUserLocation(null);
                  setMapCenter(null);
                } else {
                  const city = cities.find((c) => c.name === value);
                  if (city) {
                    setSelectedCity(value);
                    setUserLocation(city.coordinates as [number, number]);
                    setMapCenter(city.coordinates as [number, number]);
                  }
                }
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All Nepal</option>
              {cities.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>

            {userLocation && (
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                {[5, 10, 20, 50, 100].map((km) => (
                  <option key={km} value={km}>
                    {km} km
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {productList.length} products
            {selectedCategory && ` in ${selectedCategory}`}
            {searchTerm && ` for "${searchTerm}"`}
            {userLocation && ` within ${radius} km`}
          </div>
        </div>

        <MapView
          userLocation={userLocation}
          products={filteredProducts.map((p) => ({ ...p, imageUrl: p.imageUrl }))}
          radius={radius}
          center={mapCenter}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={{ ...product, imageUrl: product.imageUrl }}
                onAddToCart={handleAddToCart}
                onToggleFavorite={handleToggleFavorite}
                onChat={(sellerId) => handleChat(sellerId, product._id)}
                 onViewDetails={() => handleViewDetails(product._id)}
                isFavorited={favoritedProducts.includes(product._id)}
              />
            ))
          ) : (
            <p className="text-gray-500">No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
