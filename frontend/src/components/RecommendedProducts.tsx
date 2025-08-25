import React from "react";
import { motion } from "framer-motion";
import { useGetPersonalizedRecommendationsQuery, useIncrementProductViewMutation } from "@/services/productApi";
import { ProductCard } from "./Product-Card";
import type { IProduct } from "@/types/product";
import { useNavigate } from "react-router-dom";

interface RecommendedProductsProps {
  coordinates?: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({ coordinates }) => {
  const { data, isLoading, isError } = useGetPersonalizedRecommendationsQuery();
    const [incrementProductView] = useIncrementProductViewMutation();
  const navigate = useNavigate()
  const handleViewDetails = async (productId: string) => {
    try {
      await incrementProductView(productId).unwrap(); // increment view count
      navigate(`/product/${productId}`); // navigate to details page
    } catch (err) {
      console.error("Failed to navigate to product details:", err);
    }
  };

  if (isLoading) return <p>Loading recommended products...</p>;
  if (isError) return <p>Failed to load recommended products.</p>;
  if (!data?.data || data.data.length === 0)
    return <p>No recommendations available.</p>;

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {data.data.map((product: IProduct) => (
        <motion.div key={product._id} variants={fadeInUp}>
          <ProductCard product={product}
          onViewDetails={()=>handleViewDetails(product._id)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default RecommendedProducts;
