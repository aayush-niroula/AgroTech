import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Users, Shield, Zap, Star, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { EnhancedRecommendedProducts } from "@/components/EnhancedRecommendedProducts";
import { TestimonialSection } from "@/components/TestimonialSection";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

// Stats Section
const stats = [
  { number: "50K+", label: "Active Farmers" },
  { number: "95%", label: "Accuracy Rate" },
  { number: "200+", label: "Plant Diseases" },
  { number: "24/7", label: "Support" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <motion.div {...fadeInUp}>
            <Badge className="mb-4 bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered Plant Health
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Protect Your Crops with
              <span className="block">Smart Agriculture</span>
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Detect plant diseases instantly with AI, connect with local farmers, and access expert advice through our comprehensive agricultural marketplace platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/predict-disease")}
                size="lg"
                className="relative px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{
                  boxShadow: '0 8px 25px rgba(147, 51, 234, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                }}
              >
                <Camera className="w-5 h-5 mr-2" />
                Scan Plant Now
              </Button>
              <Button
                onClick={() => navigate("/marketplace")}
                size="lg"
                variant="outline"
                className="px-8 py-3 bg-gray-100/50 hover:bg-gray-200/70 border border-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-300 backdrop-blur-sm transform hover:scale-105 dark:bg-slate-600/50 dark:hover:bg-slate-600/70 dark:border-slate-500/50 dark:text-slate-300"
                style={{
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                }}
              >
                <Users className="w-5 h-5 mr-2" />
                Browse Marketplace
              </Button>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div className="mt-16 relative" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }}>
            <div className="relative mx-auto max-w-4xl">
              <div className="relative bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 rounded-2xl p-8 shadow-2xl border border-transparent transform-gpu snake-border"
                style={{
                  transform: 'perspective(1000px) rotateX(2deg)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1) dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]'
                }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stat.number}</div>
                      <div className="text-gray-600 dark:text-slate-400 text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recommended Products Section */}
      <section className="relative py-20 px-4 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 overflow-hidden">
        <div className="container mx-auto relative z-10">
          <motion.div className="text-center mb-12" {...fadeInUp}>
            <Badge className="mb-4 bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50">
              <Star className="w-3 h-3 mr-1" />
              Personalized for You
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Recommended Products
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4"></div>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
              Based on your location and farming interests, these products might help boost your efficiency.
            </p>
          </motion.div>

          <div className="relative snake-border">
            <EnhancedRecommendedProducts />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialSection />

      <style>{`
        @keyframes snake-light {
          0% {
            border-image: conic-gradient(
              from 0deg,
              rgba(59, 130, 246, 0.9) 0deg,
              rgba(147, 51, 234, 0.9) 30deg,
              transparent 40deg,
              transparent 320deg,
              rgba(59, 130, 246, 0.9) 360deg
            ) 1;
            border-image-slice: 1;
          }
          25% {
            border-image: conic-gradient(
              from 90deg,
              rgba(59, 130, 246, 0.9) 0deg,
              rgba(147, 51, 234, 0.9) 30deg,
              transparent 40deg,
              transparent 320deg,
              rgba(59, 130, 246, 0.9) 360deg
            ) 1;
            border-image-slice: 1;
          }
          50% {
            border-image: conic-gradient(
              from 180deg,
              rgba(59, 130, 246, 0.9) 0deg,
              rgba(147, 51, 234, 0.9) 30deg,
              transparent 40deg,
              transparent 320deg,
              rgba(59, 130, 246, 0.9) 360deg
            ) 1;
            border-image-slice: 1;
          }
          75% {
            border-image: conic-gradient(
              from 270deg,
              rgba(59, 130, 246, 0.9) 0deg,
              rgba(147, 51, 234, 0.9) 30deg,
              transparent 40deg,
              transparent 320deg,
              rgba(59, 130, 246, 0.9) 360deg
            ) 1;
            border-image-slice: 1;
          }
          100% {
            border-image: conic-gradient(
              from 360deg,
              rgba(59, 130, 246, 0.9) 0deg,
              rgba(147, 51, 234, 0.9) 30deg,
              transparent 40deg,
              transparent 320deg,
              rgba(59, 130, 246, 0.9) 360deg
            ) 1;
            border-image-slice: 1;
          }
        }

        .snake-border {
          position: relative;
          border: 5px solid transparent;
          border-radius: 16px;
          animation: snake-light 3s linear infinite;
        }
      `}</style>
    </>
  );
}