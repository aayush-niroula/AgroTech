import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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

const features = [
  {
    icon: Camera,
    title: "AI Disease Detection",
    description: "Upload plant photos for instant disease identification using advanced AI technology",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: MapPin,
    title: "Location-Based Marketplace",
    description: "Find farmers and agricultural experts in your area with precise location filtering",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: MessageCircle,
    title: "Direct Chat",
    description: "Connect instantly with farmers and experts through our integrated chat system",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Phone,
    title: "Voice Calls",
    description: "Make direct calls to farmers for immediate consultation and support",
    color: "bg-orange-100 text-orange-600",
  },
];

export default function FeaturesPage() {
    const navigate = useNavigate()
  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto">
        <Button
          variant="outline"
          className="mb-8 flex items-center"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <motion.div className="text-center mb-16" {...fadeInUp}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Smart Farming
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our comprehensive platform combines AI technology with community-driven marketplace to revolutionize
            agricultural practices.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
