import { useEffect, useState } from "react";
import { MapPin, Search, ShoppingCart, Badge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/Product-Card";
import { MapView } from "@/components/Map";

export interface IProduct {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  imageUrls: string[];
  quantity: number;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  weight: number;
  sellerId: {
    _id: string;
    name: string;
    avatar: string;
    rating: number;
    isVerified: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// Mock products

export const mockProducts: IProduct[] = [
  {
    _id: "1",
    title: "Organic Tomatoes - Premium Quality",
    description:
      "Fresh, organic tomatoes grown without pesticides. Perfect for salads, cooking, and canning.",
    price: 4.99,
    category: "Vegetables",
    brand: "Green Valley Farms",
    imageUrls: [
      "https://images.unsplash.com/photo-1582281298052-458f4e7d1e91?w=400&h=300&fit=crop",
    ],
    quantity: 50,
    location: {
      type: "Point",
      coordinates: [85.324, 27.7172], // Kathmandu
    },
    weight: 1.5,
    sellerId: {
      _id: "seller1",
      name: "Aayush Gurung",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 4.8,
      isVerified: true,
    },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    _id: "2",
    title: "Fresh Corn - Sweet & Crispy",
    description: "Locally grown sweet corn, perfect for grilling or boiling.",
    price: 3.5,
    category: "Vegetables",
    brand: "Sunny Acres",
    imageUrls: [
      "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop",
    ],
    quantity: 20,
    location: {
      type: "Point",
      coordinates: [85.324, 27.6872], // Nearby Kathmandu
    },
    weight: 2.0,
    sellerId: {
      _id: "seller2",
      name: "Pratibha Jha",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 4.9,
      isVerified: true,
    },
    createdAt: "2024-01-14T15:30:00Z",
    updatedAt: "2024-01-14T15:30:00Z",
  },
  {
    _id: "3",
    title: "Premium Wheat Flour",
    description:
      "Stone-ground whole wheat flour. Perfect for bread and baking.",
    price: 12.99,
    category: "Grains",
    brand: "Heritage Mills",
    imageUrls: [
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop",
    ],
    quantity: 25,
    location: {
      type: "Point",
      coordinates: [85.324, 27.7072], // Kathmandu
    },
    weight: 5.0,
    sellerId: {
      _id: "seller3",
      name: "Saurav Roy",
      avatar: "https://randomuser.me/api/portraits/men/54.jpg",
      rating: 4.7,
      isVerified: false,
    },
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
  },
  {
    _id: "4",
    title: "Honeycrisp Apples",
    description:
      "Sweet and crisp Honeycrisp apples, freshly picked from the orchard.",
    price: 6.99,
    category: "Fruits",
    brand: "Orchard Fresh",
    imageUrls: [
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop",
    ],
    quantity: 30,
    location: {
      type: "Point",
      coordinates: [85.314, 27.7272], // Near Kathmandu
    },
    weight: 3.0,
    sellerId: {
      _id: "seller4",
      name: "Emily Davis",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      rating: 4.6,
      isVerified: true,
    },
    createdAt: "2024-01-12T14:20:00Z",
    updatedAt: "2024-01-12T14:20:00Z",
  },
  {
    _id: "5",
    title: "Organic Carrots",
    description: "Fresh organic carrots rich in vitamins and minerals.",
    price: 2.99,
    category: "Vegetables",
    brand: "Nature's Best",
    imageUrls: [
      "https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400&h=300&fit=crop",
    ],
    quantity: 15,
    location: {
      type: "Point",
      coordinates: [85.334, 27.7472], // Nearby
    },
    weight: 1.0,
    sellerId: {
      _id: "seller5",
      name: "Michael Brown",
      avatar: "https://randomuser.me/api/portraits/men/65.jpg",
      rating: 4.5,
      isVerified: true,
    },
    createdAt: "2024-01-11T11:45:00Z",
    updatedAt: "2024-01-11T11:45:00Z",
  },
  {
    _id: "6",
    title: "Fresh Milk - Whole",
    description: "Farm-fresh whole milk from grass-fed cows. Rich and creamy.",
    price: 4.5,
    category: "Dairy",
    brand: "Meadow Farm",
    imageUrls: [
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop",
    ],
    quantity: 20,
    location: {
      type: "Point",
      coordinates: [85.354, 27.7672], // Slightly further
    },
    weight: 1.0,
    sellerId: {
      _id: "seller6",
      name: "Sarah Wilson",
      avatar: "https://randomuser.me/api/portraits/women/55.jpg",
      rating: 4.9,
      isVerified: true,
    },
    createdAt: "2024-01-10T08:30:00Z",
    updatedAt: "2024-01-10T08:30:00Z",
  },
];

// 🚩 Haversine Formula to Calculate Distance
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MarketplacePage() {
  const [products] = useState<IProduct[]>(mockProducts);
  const [filteredProducts, setFilteredProducts] =
    useState<IProduct[]>(mockProducts);
  const [favoritedProducts, setFavoritedProducts] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(50);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );

  // ✅ Get User Location on Mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setUserLocation(null); // fallback if permission denied
        }
      );
    } else {
      console.error("Geolocation not available");
      setUserLocation(null);
    }
  }, []);

  // ✅ Unique Categories
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // ✅ Apply Search, Category & Location Filter
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (userLocation) {
      filtered = filtered.filter((product) => {
        const [lon, lat] = product.location.coordinates;
        const distance = getDistanceFromLatLonInKm(
          userLocation[1],
          userLocation[0],
          lat,
          lon
        );
        return distance <= radius;
      });
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products, userLocation, radius]);

  // ✅ Handlers
  const handleAddToCart = (productId: string) => {
    setCartItems((prev) => [...prev, productId]);
  };

  const handleToggleFavorite = (productId: string) => {
    setFavoritedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleChat = (sellerId: string) => {
    alert(`Starting chat with seller: ${sellerId}`);
  };

  const handleCall = (sellerId: string) => {
    alert(`Calling seller: ${sellerId}`);
  };

  const handleViewDetails = (productId: string) => {
    alert(`Viewing details for product: ${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔥 Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
              <p className="text-gray-600">Fresh produce from local farmers</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <MapPin className="w-4 h-4 mr-2" />
                Location
              </Button>
              <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
                {cartItems.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 min-w-[1.25rem] h-5">
                    {cartItems.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
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

          {/* ✅ Radius Selector */}
          {userLocation && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Radius:</label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
            </div>
          )}

          {/* Info */}
          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
            {selectedCategory && ` in ${selectedCategory}`}
            {searchTerm && ` for "${searchTerm}"`}
            {userLocation && ` within ${radius} km`}
          </div>
        </div>
        <MapView
          userLocation={userLocation}
          products={filteredProducts}
          radius={radius}
        />

        {/* 🌟 Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
              onChat={handleChat}
              onCall={handleCall}
              onViewDetails={handleViewDetails}
              isFavorited={favoritedProducts.includes(product._id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
