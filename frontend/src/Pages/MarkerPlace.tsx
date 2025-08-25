import { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, MapPin, Filter, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MapView from '@/components/Map';
import { ProductCard } from '@/components/Product-Card';
import {
  useGetProductsQuery,
  useIncrementProductViewMutation,
  useToggleFavoriteMutation,
} from '@/services/productApi';
import { useNavigate } from 'react-router-dom';
import type { IProduct, ApiResponse, Seller } from '@/types/product';
import { debounce } from 'lodash';

const OPENCAGE_API_KEY = 'baffb2c26c114e6994d055bfeee4afda';

async function getCoords(address: string): Promise<{ lat: number; lng: number }> {
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${OPENCAGE_API_KEY}&limit=1&countrycode=np`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      return { lat, lng };
    } else {
      throw new Error('Location not found');
    }
  } catch (error) {
    throw new Error('Failed to fetch coordinates');
  }
}

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(50);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null); // [lng, lat]
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null); // [lat, lng]
  const [favoritedProducts, setFavoritedProducts] = useState<string[]>([]);
  const [isGeolocationReady, setIsGeolocationReady] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [locationQuery, setLocationQuery] = useState('');
  const [trackLocation, setTrackLocation] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [selectedProductForRoute, setSelectedProductForRoute] = useState<IProduct | null>(null);

  const navigate = useNavigate();
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [incrementProductView] = useIncrementProductViewMutation();

  // Debounced search location function
  const debouncedSearchLocation = useCallback(
    debounce(async (query: string) => {
      if (!query) return;
      setGeocodingLoading(true);
      setGeocodingError(null);
      try {
        const coords = await getCoords(query + ', Nepal');
        setUserLocation([coords.lng, coords.lat]);
        setMapCenter([coords.lat, coords.lng]);
        setTrackLocation(false);
      } catch (error) {
        setGeocodingError('Location not found. Please try a different search.');
      } finally {
        setGeocodingLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (locationQuery) {
      debouncedSearchLocation(locationQuery);
    }
  }, [locationQuery, debouncedSearchLocation]);

  // Get user geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setUserLocation(coords);
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          setIsGeolocationReady(true);
        },
        () => {
          // Fallback: Kathmandu
          setUserLocation([85.324, 27.7172]);
          setMapCenter([27.7172, 85.324]);
          setIsGeolocationReady(true);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setUserLocation([85.324, 27.7172]);
      setMapCenter([27.7172, 85.324]);
      setIsGeolocationReady(true);
    }
  }, []);

  // Watch location if tracking enabled
  useEffect(() => {
    let watchId: number | undefined;
    if (trackLocation && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setUserLocation(coords);
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          setLocationQuery('');
          setSelectedProductForRoute(null);
        },
        (err) => {
          console.error('Geolocation watch error:', err);
          setGeocodingError('Failed to track location.');
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [trackLocation]);

  // Fetch products
  const { data, isLoading, isError } = useGetProductsQuery({
    category: selectedCategory || undefined,
    coordinates: userLocation ? `${userLocation[0]},${userLocation[1]}` : undefined,
    maxDistance: userLocation ? radius * 1000 : undefined,
  });

  const productList: IProduct[] = (data as ApiResponse<IProduct[]> | undefined)?.data ?? [];

  // Unique categories
  const categories = useMemo(
    () => Array.from(new Set(productList.map((p) => p.category).filter(Boolean))),
    [productList]
  );

  // Filtered products
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

  // Handlers
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

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setGeocodingLoading(true);
      setGeocodingError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setUserLocation(coords);
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          setLocationQuery('');
          setTrackLocation(false);
          setSelectedProductForRoute(null);
          setGeocodingLoading(false);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setGeocodingError('Unable to get current location.');
          setGeocodingLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleSelectForRoute = (product: IProduct | null) => {
    setSelectedProductForRoute(product);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
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
        <div className="mb-8 space-y-6">
          <div className="flex flex-wrap items-center gap-4">
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
            <div className="flex items-center gap-2 flex-1">
              <MapPin className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              <Input
                placeholder="Enter city or address in Nepal"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-all"
                disabled={trackLocation || geocodingLoading}
              />
            </div>
            <Button
              onClick={handleUseCurrentLocation}
              variant="outline"
              className="h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur hover:bg-gray-100 dark:hover:bg-slate-700"
              disabled={trackLocation || geocodingLoading}
            >
              {geocodingLoading ? 'Locating...' : 'Use My Location'}
            </Button>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="track-location"
                checked={trackLocation}
                onChange={(e) => setTrackLocation(e.target.checked)}
                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
              />
              <Label htmlFor="track-location" className="text-sm text-gray-600 dark:text-slate-400 cursor-pointer">
                Track my location in real-time
              </Label>
            </div>
          </div>
          {geocodingError && (
            <p className="text-sm text-red-500 dark:text-red-400 animate-pulse">{geocodingError}</p>
          )}
          {userLocation && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-slate-400 whitespace-nowrap">
                Within
              </span>
              <select
                value={radius}
                onChange={(e) => {
                  setRadius(Number(e.target.value));
                  setSelectedProductForRoute(null);
                }}
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
        {isGeolocationReady && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-slate-700">
            <MapView
              userLocation={userLocation}
              products={filteredProducts}
              radius={radius}
              center={mapCenter}
              selectedProductForRoute={selectedProductForRoute}
              onSelectForRoute={handleSelectForRoute}
            />
          </div>
        )}
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
                      setSelectedProductForRoute(null);
                    }}
                    variant="outline"
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
        {isLoading && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-green-200 dark:border-green-800 border-t-green-600 dark:border-t-green-400 rounded-full animate-spin"></div>
              <p className="text-gray-600 dark:text-slate-400 text-lg">
                Finding fresh products near you...
              </p>
            </div>
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