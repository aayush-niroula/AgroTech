import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Camera,
  Users,
  Shield,
  Zap,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useRef, useEffect } from "react";
import type { RootState } from "@/app/store";
import { useGetPersonalizedRecommendationsQuery, useIncrementProductViewMutation } from "@/services/productApi";

// Animation Variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const stats = [
  { number: "50K+", label: "Active Farmers" },
  { number: "95%", label: "Accuracy Rate" },
  { number: "200+", label: "Plant Diseases" },
  { number: "24/7", label: "Support" },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Organic Farmer",
    content:
      "This platform saved my tomato crop! The AI detected early blight before I even noticed symptoms.",
    rating: 5,
    location: "California, USA",
  },
  {
    name: "Miguel Rodriguez",
    role: "Agricultural Consultant",
    content:
      "The location-based marketplace helped me connect with local farmers efficiently. Great tool!",
    rating: 5,
    location: "Texas, USA",
  },
  {
    name: "Priya Patel",
    role: "Small Scale Farmer",
    content:
      "Being able to chat and call experts directly has transformed how I manage my farm.",
    rating: 5,
    location: "Gujarat, India",
  },
];

// Enhanced RecommendedProducts Component with Slider
const EnhancedRecommendedProducts = () => {
  const { data: response, isLoading } =
    useGetPersonalizedRecommendationsQuery();
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
                    by{" "}
                    {typeof product.sellerId === "object" &&
                    product.sellerId !== null &&
                    "name" in product.sellerId
                      ? product.sellerId.name
                      : product.sellerId}
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

export default function HomePage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Dark mode texture overlay */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='m0 40l40-40h-40v40z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <motion.div {...fadeInUp}>
            <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/40 border dark:border-green-800/50">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered Plant Health
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-slate-100 mb-6 leading-tight">
              Protect Your Crops with
              <span className="text-green-600 dark:text-green-400 block">
                Smart Agriculture
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Detect plant diseases instantly with AI, connect with local
              farmers, and access expert advice through our comprehensive
              agricultural marketplace platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/predict-disease")}
                size="lg"
                className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 text-white text-lg px-8 py-3 shadow-lg dark:shadow-green-900/25"
              >
                <Camera className="w-5 h-5 mr-2" />
                Scan Plant Now
              </Button>
              <Button
                onClick={() => navigate("/marketplace")}
                size="lg"
                variant="outline"
                className="text-lg px-8 py-3 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <Users className="w-5 h-5 mr-2" />
                Browse Marketplace
              </Button>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            className="mt-16 relative"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="relative mx-auto max-w-4xl">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 dark:from-green-500 dark:to-blue-600 rounded-2xl p-1 shadow-2xl dark:shadow-slate-900/50">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 backdrop-blur-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                      <motion.div
                        key={index}
                        className="text-center"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                      >
                        <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100">
                          {stat.number}
                        </div>
                        <div className="text-gray-600 dark:text-slate-400 text-sm">
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Recommended Products Section */}
      <section className="relative py-20 px-4 bg-gray-50 dark:bg-slate-800 overflow-hidden">
        {/* Dark mode subtle pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="container mx-auto relative z-10">
          <motion.div className="text-center mb-12" {...fadeInUp}>
            <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border dark:border-blue-800/50">
              <Star className="w-3 h-3 mr-1" />
              Personalized for You
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Recommended Products
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
              Based on your location and farming interests, these products might
              help boost your efficiency.
            </p>
          </motion.div>

          <EnhancedRecommendedProducts />
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="relative py-20 px-4 bg-white dark:bg-slate-900 overflow-hidden"
      >
        {/* Dark mode subtle pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="container mx-auto relative z-10">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              How AgriCare Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
              Get started in three simple steps and transform your farming
              experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Capture & Upload",
                description:
                  "Take a photo of your plant or upload existing images for instant analysis",
                icon: Camera,
              },
              {
                step: "02",
                title: "AI Analysis",
                description:
                  "Our advanced AI identifies diseases, pests, and provides detailed diagnosis",
                icon: Shield,
              },
              {
                step: "03",
                title: "Connect & Solve",
                description:
                  "Chat or call local experts and farmers for personalized solutions",
                icon: Users,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="relative mb-8">
                  <div className="w-16 h-16 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg dark:shadow-green-900/25 group-hover:scale-105 transition-transform duration-300">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md dark:shadow-blue-900/25">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 px-4 bg-gray-50 dark:bg-slate-800 overflow-hidden">
        {/* Geometric pattern for dark mode */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.03'%3E%3Cpath d='M0 0h40v40H0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="container mx-auto relative z-10">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Trusted by Farmers Worldwide
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
              See how AgriCare is helping farmers protect their crops and
              increase yields.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow-xl dark:hover:shadow-slate-900/25 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-slate-300 mb-4 italic">
                      "{testimonial.content}"
                    </p>
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                      <div className="font-semibold text-gray-900 dark:text-slate-100">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">
                        {testimonial.role}
                      </div>
                      <div className="text-sm text-gray-400 dark:text-slate-500 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {testimonial.location}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-700 dark:to-blue-700 overflow-hidden">
        {/* Subtle overlay texture */}
        <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 100V.5h50L50 0H0v100z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "100px 100px",
            }}
          />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Farming?
            </h2>
            <p className="text-xl text-green-100 dark:text-green-200 mb-8 max-w-2xl mx-auto">
              Join thousands of farmers who are already using AgriCare to
              protect their crops and connect with agricultural experts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100 dark:bg-slate-100 dark:text-green-700 dark:hover:bg-slate-200 text-lg px-8 py-3 shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-green-600 dark:border-slate-200 dark:hover:bg-slate-200 dark:hover:text-green-700 text-lg px-8 py-3"
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
