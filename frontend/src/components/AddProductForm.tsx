import { useState } from "react";
import { useCreateProductMutation } from "@/services/productApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { citiesOfNepal } from "@/lib/cities";
import { useSelector } from "react-redux";
import type { RootState } from '@/app/store';

export default function AddProductForm() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    brand: "",
    quantity: "",
    weight: "",
    city: "",
    latitude: 0,
    longitude: 0,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const user = useSelector((state: RootState) => state.auth.user);
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCitySelect = (cityName: string) => {
    const selectedCity = citiesOfNepal.find((city) => city.name === cityName);
    if (selectedCity) {
      setFormData((prev) => ({
        ...prev,
        city: cityName,
        latitude: selectedCity.latitude,
        longitude: selectedCity.longitude,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to add a product.");
      return;
    }

    if (!imageFile) {
      alert("Please upload a product image.");
      return;
    }

    const payload = {
      ...formData,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      weight: Number(formData.weight),
      sellerId: user.id,
      image: imageFile,
    };

    try {
      await createProduct(payload).unwrap();
      alert("Product created successfully!");
      setFormData({
        title: "",
        description: "",
        price: "",
        category: "",
        brand: "",
        quantity: "",
        weight: "",
        city: "",
        latitude: 0,
        longitude: 0,
      });
      setImageFile(null);
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product.");
    }
  };

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl">Add New Product</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input name="title" value={formData.title} onChange={handleChange} required />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea name="description" value={formData.description} onChange={handleChange} required />
          </div>

          {/* Price */}
          <div>
            <Label>Price (NPR)</Label>
            <Input name="price" type="number" value={formData.price} onChange={handleChange} required />
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <Input name="category" value={formData.category} onChange={handleChange} required />
          </div>

          {/* Brand */}
          <div>
            <Label>Brand</Label>
            <Input name="brand" value={formData.brand} onChange={handleChange} required />
          </div>

          {/* Quantity */}
          <div>
            <Label>Quantity</Label>
            <Input name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
          </div>

          {/* Weight */}
          <div>
            <Label>Weight (kg)</Label>
            <Input name="weight" type="number" value={formData.weight} onChange={handleChange} required />
          </div>

          {/* City Selector */}
          <div>
            <Label>Location (City)</Label>
            <Select onValueChange={handleCitySelect} value={formData.city}>
              <SelectTrigger>
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {citiesOfNepal.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div>
            <Label>Product Image</Label>
            <Input type="file" accept="image/*" onChange={handleFileChange} required />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Add Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
