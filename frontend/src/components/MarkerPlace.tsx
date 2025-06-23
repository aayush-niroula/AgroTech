import { ProductCard } from "./Product-Card"
import type { IProduct } from "../types/product"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"
import { Badge, MapPin, Search, ShoppingCart } from "lucide-react"
import { Input } from "./ui/input"

interface MarketplaceGridProps {
  products: IProduct[]
  onAddToCart?: (productId: string) => void
  onToggleFavorite?: (productId: string) => void
  onChat?: (sellerId: string) => void
  onCall?: (sellerId: string) => void
  onViewDetails?: (productId: string) => void
  favoritedProducts?: string[]
}
const mockProducts: IProduct[] = [
  {
    _id: "1",
    title: "Organic Tomatoes - Premium Quality",
    description:
      "Fresh, organic tomatoes grown without pesticides. Perfect for salads, cooking, and canning. Harvested daily for maximum freshness.",
    price: 4.99,
    category: "Vegetables",
    brand: "Green Valley Farms",
    imageUrls: [
      "https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop",
    ],
    quantity: 50,
    location: {
      type: "Point",
      coordinates: [-122.4194, 37.7749],
    },
    weight: 1.5,
    sellerId: {
      _id: "seller1",
      name: "John Smith",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      rating: 4.8,
      isVerified: true,
    },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    _id: "2",
    title: "Fresh Corn - Sweet & Crispy",
    description: "Locally grown sweet corn, perfect for grilling or boiling. Non-GMO and pesticide-free.",
    price: 3.5,
    category: "Vegetables",
    brand: "Sunny Acres",
    imageUrls: ["https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop"],
    quantity: 8,
    location: {
      type: "Point",
      coordinates: [-122.4094, 37.7849],
    },
    weight: 2.0,
    sellerId: {
      _id: "seller2",
      name: "Maria Garcia",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
      rating: 4.9,
      isVerified: true,
    },
    createdAt: "2024-01-14T15:30:00Z",
    updatedAt: "2024-01-14T15:30:00Z",
  },
  {
    _id: "3",
    title: "Premium Wheat Flour",
    description: "Stone-ground whole wheat flour from organic wheat. Perfect for bread making and baking.",
    price: 12.99,
    category: "Grains",
    brand: "Heritage Mills",
    imageUrls: ["https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop"],
    quantity: 25,
    location: {
      type: "Point",
      coordinates: [-122.4294, 37.7649],
    },
    weight: 5.0,
    sellerId: {
      _id: "seller3",
      name: "Robert Johnson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      rating: 4.7,
      isVerified: false,
    },
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
  },
  {
    _id: "4",
    title: "Fresh Apples - Honeycrisp",
    description: "Crisp and sweet Honeycrisp apples, perfect for snacking or baking. Locally grown and hand-picked.",
    price: 6.99,
    category: "Fruits",
    brand: "Orchard Fresh",
    imageUrls: ["https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop"],
    quantity: 30,
    location: {
      type: "Point",
      coordinates: [-122.4394, 37.7549],
    },
    weight: 3.0,
    sellerId: {
      _id: "seller4",
      name: "Emily Davis",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      rating: 4.6,
      isVerified: true,
    },
    createdAt: "2024-01-12T14:20:00Z",
    updatedAt: "2024-01-12T14:20:00Z",
  },
  {
    _id: "5",
    title: "Organic Carrots",
    description: "Fresh organic carrots, perfect for cooking, juicing, or snacking. Rich in vitamins and minerals.",
    price: 2.99,
    category: "Vegetables",
    brand: "Nature's Best",
    imageUrls: ["https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400&h=300&fit=crop"],
    quantity: 5,
    location: {
      type: "Point",
      coordinates: [-122.4494, 37.7449],
    },
    weight: 1.0,
    sellerId: {
      _id: "seller5",
      name: "Michael Brown",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
      rating: 4.5,
      isVerified: true,
    },
    createdAt: "2024-01-11T11:45:00Z",
    updatedAt: "2024-01-11T11:45:00Z",
  },
  {
    _id: "6",
    title: "Fresh Milk - Whole",
    description: "Farm-fresh whole milk from grass-fed cows. Rich, creamy, and nutritious. Delivered daily.",
    price: 4.5,
    category: "Dairy",
    brand: "Meadow Farm",
    imageUrls: ["https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop"],
    quantity: 20,
    location: {
      type: "Point",
      coordinates: [-122.4594, 37.7349],
    },
    weight: 1.0,
    sellerId: {
      _id: "seller6",
      name: "Sarah Wilson",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face",
      rating: 4.9,
      isVerified: true,
    },
    createdAt: "2024-01-10T08:30:00Z",
    updatedAt: "2024-01-10T08:30:00Z",
  },
]

export function MarketplaceGrid({
  products,
  onAddToCart,
  onToggleFavorite,
  onChat,
  onCall,
  onViewDetails,
  favoritedProducts = [],
}: MarketplaceGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite}
          onChat={onChat}
          onCall={onCall}
          onViewDetails={onViewDetails}
          isFavorited={favoritedProducts.includes(product._id)}
        />
      ))}
    </div>
  )
}


export default function MarketplacePage() {
  const [products, setProducts] = useState<IProduct[]>(mockProducts)
  const [filteredProducts, setFilteredProducts] = useState<IProduct[]>(mockProducts)
  const [favoritedProducts, setFavoritedProducts] = useState<string[]>([])
  const [cartItems, setCartItems] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories
  const categories = Array.from(new Set(products.map((p) => p.category)))

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    setFilteredProducts(filtered)
  }, [searchTerm, selectedCategory, products])

  const handleAddToCart = (productId: string) => {
    setCartItems((prev) => [...prev, productId])
    console.log("Added to cart:", productId)
    // You can add a toast notification here
  }

  const handleToggleFavorite = (productId: string) => {
    setFavoritedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const handleChat = (sellerId: string) => {
    console.log("Starting chat with seller:", sellerId)
    // Implement chat logic - could open a modal or navigate to chat page
    alert(`Starting chat with seller: ${sellerId}`)
  }

  const handleCall = (sellerId: string) => {
    console.log("Calling seller:", sellerId)
    // Implement call logic - could open phone app or VOIP
    alert(`Calling seller: ${sellerId}`)
  }

  const handleViewDetails = (productId: string) => {
    console.log("Viewing product details:", productId)
    // Navigate to product details page
    alert(`Viewing details for product: ${productId}`)
  }

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

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filters */}
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

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
            {selectedCategory && ` in ${selectedCategory}`}
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </div>

        {/* Products Grid */}
        <MarketplaceGrid
          products={filteredProducts}
          onAddToCart={handleAddToCart}
          onToggleFavorite={handleToggleFavorite}
          onChat={handleChat}
          onCall={handleCall}
          onViewDetails={handleViewDetails}
          favoritedProducts={favoritedProducts}
        />
      </div>
    </div>
  )
}


