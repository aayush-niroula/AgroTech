import React, { useState, type ChangeEvent } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/app/store";
import {
  useUpdateProfileMutation,
  useResetPasswordMutation,
  useGetUserProductsQuery,
} from "@/services/authApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "react-hot-toast";
import { setCredentials } from "@/app/slices/authSlice";
import type { IProduct } from "@/types/product";
import { Camera, User, Lock, Package, Edit, Save, Eye, EyeOff } from "lucide-react";

interface SmallProductCardProps {
  product: IProduct;
  onEdit?: (product: IProduct) => void;
}

const SmallProductCard: React.FC<SmallProductCardProps> = ({ product, onEdit }) => (
  <div className="group relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100">
    <div className="relative h-32 bg-gray-100 overflow-hidden">
      <img 
        src={product.imageUrl} 
        alt={product.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
    </div>
    <div className="p-3 space-y-1">
      <h4 className="font-medium text-sm text-gray-800 truncate group-hover:text-blue-600 transition-colors">
        {product.title}
      </h4>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {product.category}
        </span>
        <span className="font-bold text-sm text-green-600">
          ${product.price.toFixed(2)}
        </span>
      </div>
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-2">
      <Button 
        variant="secondary" 
        size="sm"
        className="text-xs py-1 px-3 bg-white/90 text-gray-700 hover:bg-white"
        onClick={() => onEdit?.(product)}
      >
        <Edit className="w-3 h-3 mr-1" />
        Edit
      </Button>
    </div>
  </div>
);

export const ProfileSettings: React.FC = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);
  const userId = authState.user?.id;

  // Fetch all user products
  const { data: products, isLoading: productsLoading } = useGetUserProductsQuery();

  const [updateProfile, { isLoading: updatingProfile }] = useUpdateProfileMutation();
  const [resetPassword, { isLoading: updatingPassword }] = useResetPasswordMutation();

  const [profile, setProfile] = useState({
    name: authState.user?.name || "",
    email: authState.user?.email || "",
    avatarUrl: authState.user?.avatarUrl || "",
  });
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setProfile((prev) => ({
        ...prev,
        avatarUrl: URL.createObjectURL(file),
      }));
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await updateProfile({
        userId: userId!,
        name: profile.name,
        email: profile.email,
        avatarFile,
      }).unwrap();

      const updatedUser = response.user;
      setProfile({
        name: updatedUser.name,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl || "",
      });
      setAvatarFile(undefined);

      dispatch(setCredentials({ user: updatedUser, token: authState.token! }));
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update profile");
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      await resetPassword({ userId: userId!, currentPassword, newPassword }).unwrap();
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update password");
    }
  };

  // Placeholder for edit product (can be expanded with modal)
  const handleEditProduct = (product: IProduct) => {
    toast.success(`Editing product: ${product.title}`);
    // Implement edit logic here, e.g., open a modal
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
      <div className="container mx-auto px-4 space-y-8 max-w-6xl">
        {/* Header */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Profile Update Card */}
          <Card className="transform hover:scale-105 transition-all duration-500 hover:shadow-2xl animate-slide-up">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Update Profile</h2>
              </div>
              <div className="flex items-center space-x-6 mb-4">
                <div className="relative group">
                  <Avatar className="w-20 h-20 ring-4 ring-blue-500/20 shadow-xl transition-all duration-300 group-hover:ring-blue-500/40">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback>
                        {profile.name?.trim().charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-gray-800">Profile Picture</p>
                  <p className="text-sm text-gray-500">Click to change</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={profile.name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                    className="transform focus:scale-105 transition-transform"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <Input
                    placeholder="Enter your email"
                    value={profile.email}
                    onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                    className="transform focus:scale-105 transition-transform"
                  />
                </div>
                <Button 
                  onClick={handleProfileUpdate} 
                  disabled={updatingProfile}
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {updatingProfile ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reset Password Card */}
          <Card className="transform hover:scale-105 transition-all duration-500 hover:shadow-2xl animate-slide-up delay-100">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Lock className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pr-12 transform focus:scale-105 transition-transform"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">New Password</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-12 transform focus:scale-105 transition-transform"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  onClick={handlePasswordUpdate} 
                  disabled={updatingPassword}
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {updatingPassword ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Update Password</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Products Section */}
        <Card className="animate-slide-up delay-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Your Products</h2>
                <p className="text-gray-600">Manage your added products</p>
              </div>
            </div>
            {productsLoading ? (
              <p className="text-center text-gray-500">Loading products...</p>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.map((product: IProduct, index) => (
                  <div 
                    key={product._id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <SmallProductCard product={product} onEdit={handleEditProduct} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">You haven't added any products yet.</p>
                <Button 
                  variant="secondary" 
                  onClick={() => toast.success("Add product functionality coming soon!")}
                >
                  Add Your First Product
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fade-in {
            animation: fade-in 0.6s ease-out forwards;
          }
          
          .animate-slide-up {
            animation: slide-up 0.8s ease-out forwards;
          }
          
          .delay-100 {
            animation-delay: 100ms;
          }
          
          .delay-200 {
            animation-delay: 200ms;
          }
        `}
      </style>
    </div>
  );
};