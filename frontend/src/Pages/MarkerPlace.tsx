import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, Filter, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MapView from '@/components/Map';
import { ProductCard } from '@/components/Product-Card';
import {
  useGetProductsQuery,
  useIncrementProductViewMutation,
  useToggleFavoriteMutation,
  useToggleChatCountMutation,
} from '@/services/productApi';
import { useNavigate } from 'react-router-dom';
import type { IProduct, ApiResponse, Seller } from '@/types/product';

interface City {
  name: string;
  coordinates: [number, number]; // [lng, lat] for consistency
}

const cities: City[] = [
  { name: 'Kathmandu', coordinates: [27.7172, 85.324] },
  { name: 'Pokhara', coordinates: [28.2096, 83.9856] },
  { name: 'Biratnagar', coordinates: [26.4525, 87.2806] },
  { name: 'Birgunj', coordinates: [27.0, 84.8669] },
  { name: 'Bharatpur', coordinates: [27.6761, 84.4297] },
  { name: 'Butwal', coordinates: [27.7, 83.4509] },
  { name: 'Dhangadhi', coordinates: [28.6981, 80.5937] },
  { name: 'Nepalgunj', coordinates: [28.05, 81.625] },
];

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(50);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [favoritedProducts, setFavoritedProducts] = useState<string[]>([]);
  const [isGeolocationReady, setIsGeolocationReady] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const navigate = useNavigate();
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [incrementProductView] = useIncrementProductViewMutation();
  const [toggleChatCount] = useToggleChatCountMutation();

  /** Get user geolocation on mount */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          if (!selectedCity) {
            setMapCenter(coords);
          }
          setIsGeolocationReady(true);
        },
        () => {
          // fallback: Kathmandu
          setUserLocation(null);
          if (!selectedCity) {
            setMapCenter([85.324, 27.7172]);
          }
          setIsGeolocationReady(true);
        }
      );
    } else {
      setIsGeolocationReady(true);
    }
  }, [selectedCity]);

  /** Fetch products */
  const { data, isLoading, isError } = useGetProductsQuery({
    category: selectedCategory || undefined,
    coordinates: userLocation ? `${userLocation[0]},${userLocation[1]} `: undefined,
    maxDistance: userLocation ? radius * 1000 : undefined,
  });

  const productList: IProduct[] = (data as ApiResponse<IProduct[]> | undefined)?.data ?? [];

  /** Unique categories */
  const categories = useMemo(
    () => Array.from(new Set(productList.map((p) => p.category).filter(Boolean))),
    [productList]
  );

  /** Filtered products */
  const filteredProducts = useMemo(() => {
    let filtered = [...productList];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((product) =>
        [product.title, product.description, product.brand].some((field) =>
          field?.toLowerCase().includes(lowerSearch)
        )
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return filtered;
  }, [productList, searchTerm, selectedCategory]);

  /** Handlers */

  const handleToggleFavorite = async (productId: string) => {
    try {
      const isFav = favoritedProducts.includes(productId);
      setFavoritedProducts((prev) =>
        isFav ? prev.filter((id) => id !== productId) : [...prev, productId]
      );
      await toggleFavorite({ productId, increment: !isFav }).unwrap();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleChat = async (sellerId: string | Seller, productId: string) => {
    try {
      const sellerIdString = typeof sellerId === 'string' ? sellerId : sellerId._id;
      await toggleChatCount(productId).unwrap();
      navigate(`/chat/${sellerIdString}`);
    } catch (error) {
      console.error('Failed to initiate chat:', error);
    }
  };

  const handleViewDetails = async (productId: string) => {
    try {
      await incrementProductView(productId).unwrap();
      navigate(`/product/${productId}`);
    } catch (error) {
      console.error('Failed to view product details:', error);
    }
  };

  /** City selection */
  const handleCityChange = (value: string) => {
    if (!value) {
      setSelectedCity(null);
      setUserLocation(null);
      setMapCenter(null);
    } else {
      const city = cities.find((c) => c.name === value);
      if (city) {
        setSelectedCity(value);
        setUserLocation(city.coordinates);
        setMapCenter(city.coordinates);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-slate-600 dark:from-gray-100 dark:to-slate-300 bg-clip-text text-transparent">
                Marketplace
              </h1>
              <p className="text-gray-600 dark:text-slate-400 mt-1">
                🌱 Fresh produce from local farmers across Nepal
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Enhanced Filters */}
        <div className="mb-8 space-y-6">
          {/* Search & Location Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Enhanced Search */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-5 h-5" />
              <Input
                placeholder="Search for fresh vegetables, fruits, grains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Enhanced Location */}
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              <select
                value={selectedCity || ''}
                onChange={(e) => handleCityChange(e.target.value)}
                className="h-12 px-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-all"
              >
                <option value="">🏔️ All Nepal</option>
                {cities.map((city) => (
                  <option key={city.name} value={city.name}>
                    📍 {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Enhanced Radius */}
            {userLocation && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-slate-400 whitespace-nowrap">
                  Within
                </span>
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="h-12 px-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-all"
                >
                  {[5, 10, 20, 50, 100].map((km) => (
                    <option key={km} value={km}>
                      {km} km
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Enhanced Categories */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300">Categories</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={`
                  h-10 px-4 transition-all hover:scale-105
                  ${selectedCategory === null 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white shadow-lg' 
                    : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                🌾 All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    h-10 px-4 transition-all hover:scale-105
                    ${selectedCategory === category 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white shadow-lg' 
                      : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-gray-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-slate-400">
                <span className="font-semibold text-gray-900 dark:text-slate-100">
                  {filteredProducts.length}
                </span> of{' '}
                <span className="font-semibold text-gray-900 dark:text-slate-100">
                  {productList.length}
                </span> products
                {selectedCategory && (
                  <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs">
                    in {selectedCategory}
                  </span>
                )}
                {searchTerm && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                    for "{searchTerm}"
                  </span>
                )}
                {userLocation && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs">
                    within {radius} km
                  </span>
                )}
              </div>
              
              {filteredProducts.length > 0 && (
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  Sorted by relevance
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Map */}
        {isGeolocationReady && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-slate-700">
            <MapView
              userLocation={userLocation}
              products={filteredProducts}
              radius={radius}
              center={mapCenter}
            />
          </div>
        )}

        {/* Enhanced Products Grid */}
        {!isLoading && !isError && (
          <div className="space-y-6">
            {filteredProducts.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                    Available Products
                  </h2>
                  <div className="text-sm text-gray-500 dark:text-slate-400">
                    {filteredProducts.length} items
                  </div>
                </div>
                
                <div className={`
                  ${viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                    : 'space-y-4'
                  }
                `}>
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onToggleFavorite={handleToggleFavorite}
                      onChat={(sellerId) => handleChat(sellerId, product._id)}
                      onViewDetails={() => handleViewDetails(product._id)}
                      isFavorited={favoritedProducts.includes(product._id)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-slate-200 dark:from-slate-800 dark:to-gray-800 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-200 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  Try adjusting your search terms, category, or location filters to find more products.
                </p>
                {(searchTerm || selectedCategory) && (
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory(null);
                    }}
                    variant="outline"
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-green-200 dark:border-green-800 border-t-green-600 dark:border-t-green-400 rounded-full animate-spin"></div>
              <p className="text-gray-600 dark:text-slate-400 text-lg">
                Finding fresh products near you...
              </p>
            </div>
            
            {/* Loading skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                  <div className="space-y-3">
                    <div className="h-48 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-100 dark:bg-slate-600 rounded animate-pulse w-3/4"></div>
                    <div className="flex justify-between">
                      <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-20"></div>
                      <div className="h-8 bg-gray-100 dark:bg-slate-600 rounded animate-pulse w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Error State */}
        {isError && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-200 mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              We couldn't load the products right now. Please check your connection and try again.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              Try again
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}