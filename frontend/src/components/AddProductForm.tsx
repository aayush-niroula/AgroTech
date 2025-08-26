import { useState, type ChangeEvent, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useCreateProductMutation } from "@/services/productApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSelector } from "react-redux";
import type { RootState } from '@/app/store';
import {
  Package,
  DollarSign,
  Tag,
  Scale,
  MapPin,
  Upload,
  Sparkles,
  CheckCircle,
  Loader2
} from "lucide-react";

const OPENCAGE_API_KEY = 'baffb2c26c114e6994d055bfeee4afda';

interface Coordinates {
  lat: number;
  lng: number;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  category: string;
  brand: string;
  quantity: string;
  weight: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface FormStep {
  title: string;
  fields: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const categories = ["Animals", "Crops", "Fertilizer", "Seeds", "Equipment", "Unknown"];

async function getCoords(address: string): Promise<Coordinates> {
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

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

const formSteps: FormStep[] = [
  { title: "Basic Info", fields: ["title", "description", "category", "brand"], icon: Package, color: "from-blue-500 to-cyan-500" },
  { title: "Pricing & Stock", fields: ["price", "quantity", "weight"], icon: DollarSign, color: "from-green-500 to-emerald-500" },
  { title: "Location & Image", fields: ["city", "image"], icon: MapPin, color: "from-purple-500 to-pink-500" },
];

export default function AddProductForm() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    title: "", description: "", price: "", category: "", brand: "", quantity: "", weight: "", city: "", latitude: 0, longitude: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());

  const user = useSelector((state: RootState) => state.auth.user);
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    const isCompleted = ['price', 'quantity', 'weight'].includes(name) ? value.trim() && parseFloat(value) > 0 : value.trim();
    setCompletedFields((prev) => {
      const newSet = new Set(prev);
      isCompleted ? newSet.add(name) : newSet.delete(name);
      return newSet;
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
      setCompletedFields((prev) => new Set(prev).add("image"));
    }
  };

  const nextStep = () => currentStep < formSteps.length - 1 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 0 && setCurrentStep(currentStep - 1);

  const isStepComplete = (stepIndex: number): boolean => {
    return formSteps[stepIndex].fields.every((field) => {
      if (field === "image") return imageFile !== null;
      if (['price', 'quantity', 'weight'].includes(field)) {
        const value = formData[field as keyof FormData];
        return value && parseFloat(value.toString()) > 0;
      }
      return completedFields.has(field);
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in to add a product.");
    if (!imageFile) return alert("Please upload a product image.");

    if (formData.city) {
      setIsGeocoding(true);
      try {
        const coords = await getCoords(formData.city + ', Nepal');
        setFormData((prev) => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
      } catch (error) {
        alert("Invalid location. Please enter a valid city or address in Nepal.");
        setIsGeocoding(false);
        return;
      }
      setIsGeocoding(false);
    } else {
      alert("Please provide a location.");
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => payload.append(key, value.toString()));
    payload.append('sellerId', user.id);
    payload.append('image', imageFile);

    try {
      await createProduct(payload).unwrap();
      alert("Product created successfully!");
      setFormData({ title: "", description: "", price: "", category: "", brand: "", quantity: "", weight: "", city: "", latitude: 0, longitude: 0 });
      setImageFile(null);
      setImagePreview(null);
      setCompletedFields(new Set());
      setCurrentStep(0);
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const currentStepData = formSteps[currentStep];

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
        <div className="absolute top-8 right-6 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s', animationDuration: '2s' }}></div>
        <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-blue-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.5s', animationDuration: '2s' }}></div>
        <div className="absolute bottom-4 right-4 w-2 h-2 bg-purple-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '1.5s', animationDuration: '2s' }}></div>
      </div>

      <motion.div className="w-full max-w-3xl relative z-10" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-full mb-4 shadow-lg">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Create New Product</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add Your Product</h1>
          <p className="text-gray-600 dark:text-slate-300">Share your agricultural products with the community</p>
        </motion.div>

        <motion.div className="flex justify-center mb-8" variants={itemVariants}>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {formSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = isStepComplete(index);

              return (
                <div key={index} className="flex items-center">
                  <motion.div
                    className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-300 ${
                      isActive ? `bg-gradient-to-r ${step.color} text-white shadow-lg scale-110` :
                      isCompleted ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                    }`}
                    whileHover={{ scale: isActive ? 1.15 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isCompleted && !isActive ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </motion.div>
                  {index < formSteps.length - 1 && (
                    <div className={`w-6 sm:w-8 h-0.5 mx-1 sm:mx-2 transition-colors duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="relative snake-border">
            <Card className="backdrop-blur-lg bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 border-transparent shadow-2xl transform-gpu rounded-xl"
              style={{
                transform: 'perspective(1000px) rotateX(2deg)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1) dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]'
              }}>
              <div className={`bg-gradient-to-r ${currentStepData.color} text-white rounded-t-xl p-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <currentStepData.icon className="w-7 h-7 sm:w-8 sm:h-8" />
                    <h2 className="text-xl sm:text-2xl font-semibold">{currentStepData.title}</h2>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                    Step {currentStep + 1} of {formSteps.length}
                  </Badge>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <form onSubmit={handleSubmit}>
                  <motion.div className="space-y-6" key={currentStep} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                    {currentStep === 0 && (
                      <>
                        <motion.div variants={itemVariants} className="group">
                          <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <Package className="w-4 h-4" /> Product Title
                          </Label>
                          <div className="relative">
                            <Input
                              name="title"
                              value={formData.title}
                              onChange={handleChange}
                              required
                              className="w-full h-12 px-4 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
                              placeholder="Enter product title..."
                              style={{
                                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                              }}
                            />
                            {completedFields.has('title') && <CheckCircle className="absolute right-3 top-3 w-6 h-6 text-green-500" />}
                          </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="group">
                          <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Description</Label>
                          <div className="relative">
                            <Textarea
                              name="description"
                              value={formData.description}
                              onChange={handleChange}
                              required
                              className="w-full min-h-[120px] p-4 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
                              placeholder="Describe your product..."
                              style={{
                                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                              }}
                            />
                            {completedFields.has('description') && <CheckCircle className="absolute right-3 top-3 w-6 h-6 text-green-500" />}
                          </div>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <motion.div variants={itemVariants} className="group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                              <Tag className="w-4 h-4" /> Category
                            </Label>
                            <div className="relative">
                              <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full h-12 px-4 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60 appearance-none"
                                style={{
                                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                                }}
                              >
                                <option value="" disabled>Select a category</option>
                                {categories.map((category) => (
                                  <option key={category} value={category}>{category}</option>
                                ))}
                              </select>
                              {completedFields.has('category') && <CheckCircle className="absolute right-3 top-3 w-6 h-6 text-green-500" />}
                            </div>
                          </motion.div>

                          <motion.div variants={itemVariants} className="group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Brand</Label>
                            <div className="relative">
                              <Input
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                required
                                className="w-full h-12 px-4 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
                                placeholder="Brand name..."
                                style={{
                                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                                }}
                              />
                              {completedFields.has('brand') && <CheckCircle className="absolute right-3 top-3 w-6 h-6 text-green-500" />}
                            </div>
                          </motion.div>
                        </div>
                      </>
                    )}

                    {currentStep === 1 && (
                      <>
                        <div className="space-y-6">
                          <div className="group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                              <DollarSign className="w-5 h-5" /> Price (NPR)
                            </Label>
                            <div className="relative">
                              <Input
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                className="w-full h-12 px-4 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
                                placeholder="Enter price in NPR (e.g., 150.00)"
                                style={{
                                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                                }}
                              />
                              {completedFields.has('price') && <CheckCircle className="absolute right-3 top-3 w-6 h-6 text-green-500" />}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="group">
                              <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <Package className="w-5 h-5" /> Quantity (Stock)
                              </Label>
                              <div className="relative">
                                <Input
                                  name="quantity"
                                  type="number"
                                  value={formData.quantity}
                                  onChange={handleChange}
                                  required
                                  min="1"
                                  step="1"
                                  className="w-full h-12 px-4 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
                                  placeholder="Available stock (e.g., 100)"
                                  style={{
                                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                                  }}
                                />
                                {completedFields.has('quantity') && <CheckCircle className="absolute right-3 top-3 w-6 h-6 text-green-500" />}
                              </div>
                            </div>

                            <div className="group">
                              <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <Scale className="w-5 h-5" /> Weight (kg)
                              </Label>
                              <div className="relative">
                                <Input
                                  name="weight"
                                  type="number"
                                  value={formData.weight}
                                  onChange={handleChange}
                                  required
                                  min="0"
                                  step="0.1"
                                  className="w-full h-12 px-4 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
                                  placeholder="Weight in kg (e.g., 2.5)"
                                  style={{
                                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                                  }}
                                />
                                {completedFields.has('weight') && <CheckCircle className="absolute right-3 top-3 w-6 h-6 text-green-500" />}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <DollarSign className="w-5 h-5" />
                            <span className="font-semibold">Pricing Information</span>
                          </div>
                          <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                            Set competitive pricing for your agricultural products. Include quantity available and total weight for buyers.
                          </p>
                        </div>
                      </>
                    )}

                    {currentStep === 2 && (
                      <>
                        <div className="space-y-6">
                          <div className="group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                              <MapPin className="w-5 h-5" /> Location (City or Address)
                            </Label>
                            <div className="relative">
                              <Input
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                required
                                disabled={isGeocoding}
                                className="w-full h-12 px-4 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
                                placeholder="e.g., Kathmandu, Nepal"
                                style={{
                                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                                }}
                              />
                              {isGeocoding && <Loader2 className="absolute right-3 top-3 w-6 h-6 text-purple-500 animate-spin" />}
                              {completedFields.has('city') && !isGeocoding && <CheckCircle className="absolute right-3 top-3 w-6 h-6 text-green-500" />}
                            </div>
                          </div>

                          <div className="group">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                              <Upload className="w-5 h-5" /> Product Image
                            </Label>
                            <div className="relative">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                required
                                className="w-full h-12 px-4 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-purple-50 dark:file:bg-purple-900/30 file:text-purple-700 dark:file:text-purple-300 hover:file:bg-purple-100 dark:hover:file:bg-purple-800/40"
                                style={{
                                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                                }}
                              />
                              {completedFields.has('image') && <CheckCircle className="absolute right-3 top-3 w-6 h-6 text-green-500" />}
                            </div>

                            {imagePreview && (
                              <div className="mt-6 flex justify-center">
                                <div className="relative">
                                  <img
                                    src={imagePreview}
                                    alt="Product preview"
                                    className="w-48 h-48 object-cover rounded-xl shadow-lg border-4 border-purple-200 dark:border-purple-800 transition-transform hover:scale-105"
                                  />
                                  <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-2 shadow-lg">
                                    <CheckCircle className="w-5 h-5" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mt-6">
                          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                            <MapPin className="w-5 h-5" />
                            <span className="font-semibold">Location & Image Guidelines</span>
                          </div>
                          <p className="text-sm text-purple-600 dark:text-purple-300 mt-1">
                            Provide your location in Nepal for local buyers to find you easily. Upload a clear, high-quality image of your product.
                          </p>
                        </div>
                      </>
                    )}
                  </motion.div>

                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="px-6 py-3 bg-gray-200/50 hover:bg-gray-300/70 border border-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-300 backdrop-blur-sm transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 dark:bg-slate-600/50 dark:hover:bg-slate-600/70 dark:border-slate-500/50 dark:text-slate-300"
                      style={{
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.1) dark:[0_4px_15px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.1)]'
                      }}
                    >
                      Previous
                    </Button>

                    {currentStep < formSteps.length - 1 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        disabled={!isStepComplete(currentStep)}
                        className={`px-8 py-3 bg-gradient-to-r ${currentStepData.color} text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none`}
                      >
                        Next Step
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isLoading || isGeocoding || !isStepComplete(currentStep)}
                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                      >
                        {isLoading || isGeocoding ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Create Product
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </Card>
          </div>
        </motion.div>
      </motion.div>

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
    </div>
  );
}