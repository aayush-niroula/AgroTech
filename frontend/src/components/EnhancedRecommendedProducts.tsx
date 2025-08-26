
import { useGetPersonalizedRecommendationsQuery, useIncrementProductViewMutation } from "@/services/productApi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowRight, Badge, ChevronLeft, ChevronRight, Eye, Star } from "lucide-react";
import { motion } from "framer-motion";
export const EnhancedRecommendedProducts = () => {
  const { data: response, isLoading } =
    useGetPersonalizedRecommendationsQuery();
    console.log(response);
    
  const products = response?.data || []; 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
   const [incrementProductView] = useIncrementProductViewMutation();
   const navigate = useNavigate();

 const handleViewDetails = async (productId: string) => {
    try {
      await incrementProductView(productId).unwrap(); // increment view count
      navigate(`/product/${productId}`); // navigate to product details page
    } catch (err) {
      console.error("Failed to navigate to product details:", err);
    }
  };

  // Responsive products per view
  const getProductsPerView = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return 1;
      if (window.innerWidth < 1024) return 2;
      return 3;
    }
    return 3;
  };
  const [productsPerView, setProductsPerView] = useState(getProductsPerView());

  useEffect(() => {
    const handleResize = () => setProductsPerView(getProductsPerView());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, products.length - productsPerView);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const goToSlide = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 300);
  };

  if (isLoading) return <div>Loading personalized recommendations...</div>;
  if (!products.length) return <div>No personalized products available.</div>;

  return (
    <div className="relative">
      {/* Slider */}
      <div className="relative overflow-hidden">
        <motion.div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${
              currentIndex * (100 / productsPerView)
            }%)`,
          }}
        >
          {products.map((product, index) => (
            <motion.div
              key={product._id}
              className="flex-shrink-0 px-2"
              style={{ width: `${100 / productsPerView}%` }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow-xl dark:hover:shadow-slate-900/25 transition-all duration-300 group cursor-pointer overflow-hidden">
                <div className="relative">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                      {product.category}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                    onClick={()=>handleViewDetails(product._id)}
                      size="sm"
                      className="bg-white/90 text-gray-900 hover:bg-white"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {product.title}
                    </h3>
                    <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                      ${product.price}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(product.rating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300 dark:text-slate-600"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-gray-500 dark:text-slate-400 ml-1">
                        ({product.rating})
                      </span>
                    </div>
                  </div>
              
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    by{product.seller?.name || (typeof product.sellerId === "string" ? product.sellerId : product.sellerId.name)}
                                      
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Navigation Arrows */}
      <div className="flex justify-center items-center mt-6 gap-4">
        <Button
          onClick={prevSlide}
          size="sm"
          variant="outline"
          disabled={isAnimating}
          className="w-10 h-10 rounded-full border-gray-300 dark:border-slate-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex space-x-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isAnimating}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-green-600 dark:bg-green-400 w-6"
                  : "bg-gray-300 dark:bg-slate-600 hover:bg-green-400 dark:hover:bg-green-500"
              }`}
            />
          ))}
        </div>
        <Button
          onClick={nextSlide}
          size="sm"
          variant="outline"
          disabled={isAnimating}
          className="w-10 h-10 rounded-full border-gray-300 dark:border-slate-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* View All Button */}
      <div className="text-center mt-8">
        <Button
          onClick={() => navigate("/marketplace")}
          variant="outline"
          size="lg"
          className="group border-green-300 dark:border-green-600 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-400 dark:hover:border-green-500 px-6 py-3"
        >
          <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
          View All Recommended Products
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};
