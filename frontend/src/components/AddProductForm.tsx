import { useState } from "react";
import { useCreateProductMutation } from "@/services/productApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSelector } from "react-redux";
import type { RootState } from '@/app/store';

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
  const [isGeocoding, setIsGeocoding] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    let latitude = formData.latitude;
    let longitude = formData.longitude;

    if (formData.city) {
      setIsGeocoding(true);
      try {
        const coords = await getCoords(formData.city + ', Nepal');
        latitude = coords.lat;
        longitude = coords.lng;
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
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('price', formData.price);
    payload.append('category', formData.category);
    payload.append('brand', formData.brand);
    payload.append('quantity', formData.quantity);
    payload.append('weight', formData.weight);
    payload.append('city', formData.city);
    payload.append('latitude', latitude.toString());
    payload.append('longitude', longitude.toString());
    payload.append('sellerId', user.id);
    payload.append('image', imageFile);

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
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl">Add New Product</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea name="description" value={formData.description} onChange={handleChange} required />
          </div>
          <div>
            <Label>Price (NPR)</Label>
            <Input name="price" type="number" value={formData.price} onChange={handleChange} required />
          </div>
          <div>
            <Label>Category</Label>
            <Input name="category" value={formData.category} onChange={handleChange} required />
          </div>
          <div>
            <Label>Brand</Label>
            <Input name="brand" value={formData.brand} onChange={handleChange} required />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
          </div>
          <div>
            <Label>Weight (kg)</Label>
            <Input name="weight" type="number" value={formData.weight} onChange={handleChange} required />
          </div>
          <div>
            <Label>Location (City or Address)</Label>
            <Input
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              placeholder="e.g., Kathmandu, Nepal"
              disabled={isGeocoding}
            />
          </div>
          <div>
            <Label>Product Image</Label>
            <Input type="file" accept="image/*" onChange={handleFileChange} required />
          </div>
          <Button type="submit" disabled={isLoading || isGeocoding} className="w-full">
            {isLoading || isGeocoding ? "Processing..." : "Add Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}