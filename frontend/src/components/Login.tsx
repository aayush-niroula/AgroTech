import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLoginMutation } from "@/services/authApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/app/slices/authSlice";

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loginUser, { isLoading }] = useLoginMutation();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await loginUser(formData).unwrap();
      dispatch(setCredentials(response));
      setSuccess("Login successful! Redirecting...");
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  return (
    <div className="min-h-screen w-full bg-black relative flex items-center justify-center overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:20px_20px] opacity-20 z-0" />

      <Card className="w-full max-w-md border border-white/10 bg-white/20 backdrop-blur-lg shadow-2xl z-10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-300">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-gray-200">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="email@example.com"
                  className="pl-9 border border-white/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-gray-200">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="pl-9 pr-9 border border-white/20 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-gray-300 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center">
          <p className="text-sm text-gray-300">
            Don't have an account?{" "}
            <Link to="/register" className="underline hover:text-white">
              Create one here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
