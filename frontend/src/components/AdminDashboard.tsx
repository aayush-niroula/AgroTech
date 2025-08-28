import { useState, useRef, useEffect } from "react";
import {
  useGetAllUsersQuery,
  useDeleteUserMutation,
  useMakeUserAdminMutation,
  useGetUserProductsByAdminQuery,
  useDeleteUserProductMutation,
} from "@/services/adminApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Trash, UserPlus, Eye, X } from "lucide-react";
import { motion } from "framer-motion";

// Define AdminUser type
interface AdminUser {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  avatarUrl?: string;
}

// Define Product type based on IProduct
interface Product {
  _id: string;
  title: string;
  brand: string;
  category: string;
  imageUrl: string;
  price: number;
  quantity: number;
}

// Define message type for UI notifications
interface Message {
  id: string;
  text: string;
  type: "success" | "error";
}

const AdminDashboard = () => {
  const { data: users, isLoading, isError } = useGetAllUsersQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [makeAdmin] = useMakeUserAdminMutation();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement>>({});
  const productCardRefs = useRef<Record<string, HTMLDivElement>>({});
  const [tilts, setTilts] = useState<Record<string, { x: number; y: number }>>({});
  const [productTilts, setProductTilts] = useState<Record<string, { x: number; y: number }>>({});
  const [messages, setMessages] = useState<Message[]>([]);

  // Product Query (for selected user)
  const { data: userProducts, refetch: refetchProducts, isFetching: productsLoading } =
    useGetUserProductsByAdminQuery(selectedUser?._id ?? "", {
      skip: !selectedUser,
    });

  const [deleteProduct] = useDeleteUserProductMutation();

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(() => {
      setMessages((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [messages]);

  const addMessage = (text: string, type: "success" | "error") => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, text, type },
    ]);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id).unwrap();
      addMessage("User deleted successfully.", "success");
    } catch (error) {
      addMessage("Failed to delete user.", "error");
    }
  };

  const handleMakeAdmin = async (id: string) => {
    try {
      await makeAdmin(id).unwrap();
      addMessage("User promoted to admin!", "success");
    } catch (error) {
      addMessage("Failed to promote user to admin.", "error");
    }
  };

  const handleViewProducts = (user: AdminUser) => {
    setSelectedUser(user);
    refetchProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id).unwrap();
      addMessage("Product deleted successfully.", "success");
      refetchProducts();
    } catch (error) {
      addMessage("Failed to delete product.", "error");
    }
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    id: string,
    isProduct: boolean = false
  ) => {
    const refs = isProduct ? productCardRefs : cardRefs;
    const card = refs.current[id];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = (y / rect.height) * 10; // Subtle tilt
    const tiltY = -(x / rect.width) * 10;
    if (isProduct) {
      setProductTilts((prev) => ({ ...prev, [id]: { x: tiltX, y: tiltY } }));
    } else {
      setTilts((prev) => ({ ...prev, [id]: { x: tiltX, y: tiltY } }));
    }
  };

  const handleMouseLeave = (id: string, isProduct: boolean = false) => {
    if (isProduct) {
      setProductTilts((prev) => ({ ...prev, [id]: { x: 0, y: 0 } }));
    } else {
      setTilts((prev) => ({ ...prev, [id]: { x: 0, y: 0 } }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-10">
        <Loader2 className="animate-spin w-12 h-12 text-green-600 dark:text-green-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-10 text-red-500 dark:text-red-400">
        Failed to load users
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 py-6 px-4 sm:px-6 lg:px-8 relative">
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60" style={{ animationDelay: "0s", animationDuration: "2s" }}></div>
        <div className="absolute top-8 right-6 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-60" style={{ animationDelay: "1s", animationDuration: "2s" }}></div>
        <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-blue-300 rounded-full animate-ping opacity-60" style={{ animationDelay: "0.5s", animationDuration: "2s" }}></div>
        <div className="absolute bottom-4 right-4 w-2 h-2 bg-purple-300 rounded-full animate-ping opacity-60" style={{ animationDelay: "1.5s", animationDuration: "2s" }}></div>
      </div>

      <motion.div
        className="max-w-6xl mx-auto space-y-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Messages */}
        {messages.length > 0 && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm sm:max-w-md md:max-w-lg mt-16">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-3 rounded-lg text-sm ${
                  msg.type === "error"
                    ? "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400"
                    : "bg-green-50 dark:bg-green-900/20 text-green-500 dark:text-green-400"
                } animate-pulse backdrop-blur-sm shadow-md flex justify-between items-center`}
                style={{
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
                }}
              >
                <span>{msg.text}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMessages((prev) => prev.filter((m) => m.id !== msg.id))}
                  className="p-1 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Admin Dashboard
        </h1>

        {/* User List */}
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {users?.map((user) => (
            <div
              key={user._id}
              className="relative group pulse-glow"
              onMouseMove={(e) => handleMouseMove(e, user._id)}
              onMouseLeave={() => handleMouseLeave(user._id)}
              style={{
                transform: `perspective(800px) rotateX(${tilts[user._id]?.x || 0}deg) rotateY(${tilts[user._id]?.y || 0}deg) translateZ(10px)`,
                transition: "transform 0.2s ease-out",
              }}
            >
              <Card
                ref={(el) => {
                  if (el) cardRefs.current[user._id] = el;
                }}
                className="shadow-md bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 border-transparent backdrop-blur-sm"
                style={{
                  boxShadow:
                    "0 10px 20px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1) dark:shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]",
                }}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-base">
                      {user.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {user.email}
                    </p>
                    {user.isAdmin && (
                      <span className="text-xs bg-green-200 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex justify-between gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewProducts(user)}
                    className="bg-gray-100/50 hover:bg-gray-200/70 border border-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-300 backdrop-blur-sm transform hover:scale-105 dark:bg-slate-600/50 dark:hover:bg-slate-600/70 dark:border-slate-500/50 dark:text-slate-300 text-sm py-1.5"
                    style={{
                      boxShadow:
                        "0 4px 10px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1) dark:[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" /> View Products
                  </Button>
                  {!user.isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMakeAdmin(user._id)}
                      className="bg-gray-100/50 hover:bg-gray-200/70 border border-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-300 backdrop-blur-sm transform hover:scale-105 dark:bg-slate-600/50 dark:hover:bg-slate-600/70 dark:border-slate-500/50 dark:text-slate-300 text-sm py-1.5"
                      style={{
                        boxShadow:
                          "0 4px 10px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1) dark:[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-1" /> Make Admin
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(user._id)}
                    className="bg-red-600 hover:bg-red-700 rounded-lg text-sm py-1.5"
                    style={{
                      boxShadow:
                        "0 4px 10px rgba(239, 68, 68, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    <Trash className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Products Modal */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-[90vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 border-transparent backdrop-blur-sm overflow-y-auto max-h-[80vh]">
            <DialogHeader className="flex justify-between items-center mb-4">
              <DialogTitle className="text-gray-900 dark:text-white text-xl">
                {selectedUser?.name}'s Products
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="bg-gray-100/50 hover:bg-gray-200/70 border border-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-300 backdrop-blur-sm transform hover:scale-105 dark:bg-slate-600/50 dark:hover:bg-slate-600/70 dark:border-slate-500/50 dark:text-slate-300 text-sm py-1.5"
                style={{
                  boxShadow:
                    "0 4px 10px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1) dark:[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                }}
              >
                <X className="w-4 h-4 mr-1" /> Close
              </Button>
            </DialogHeader>

            {productsLoading ? (
              <div className="flex justify-center items-center min-h-[50vh]">
                <Card className="p-6 bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 border-transparent backdrop-blur-sm shadow-lg animate-pulse">
                  <Loader2 className="animate-spin w-12 h-12 text-green-600 dark:text-green-400" />
                </Card>
              </div>
            ) : userProducts?.length ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 p-4">
                {userProducts.map((product: Product) => (
                  <div
                    key={product._id}
                    className="relative group pulse-glow"
                    onMouseMove={(e) => handleMouseMove(e, product._id, true)}
                    onMouseLeave={() => handleMouseLeave(product._id, true)}
                    style={{
                      transform: `perspective(800px) rotateX(${productTilts[product._id]?.x || 0}deg) rotateY(${productTilts[product._id]?.y || 0}deg) translateZ(10px)`,
                      transition: "transform 0.2s ease-out",
                      zIndex: 0,
                    }}
                  >
                    <Card
                      ref={(el) => {
                        if (el) productCardRefs.current[product._id] = el;
                      }}
                      className="shadow-sm bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 border-transparent backdrop-blur-sm"
                      style={{
                        boxShadow:
                          "0 10px 20px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1) dark:shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]",
                      }}
                    >
                      <CardContent className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-24 h-24 object-cover rounded transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 dark:bg-slate-700/50 rounded flex items-center justify-center text-gray-500 dark:text-slate-400 text-sm">
                            No Image
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                            {product.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            Brand: {product.brand}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            Category: {product.category}
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                            NPR {product.price.toLocaleString()} / unit
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            Stock: {product.quantity}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProduct(product._id)}
                          className="bg-red-600 hover:bg-red-700 rounded-lg text-sm py-1.5"
                          style={{
                            boxShadow:
                              "0 4px 10px rgba(239, 68, 68, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
                          }}
                        >
                          <Trash className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center flex justify-center items-center min-h-[50vh]">
                <Card className="p-4 bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 border-transparent backdrop-blur-sm shadow-lg">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700/30 dark:to-gray-900/30 rounded-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-slate-400 text-sm">
                    No products found
                  </p>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>

      <style>{`
        @keyframes pulse-glow {
          0% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.3), 0 0 15px rgba(147, 51, 234, 0.2);
            opacity: 0.7;
          }
          50% {
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(147, 51, 234, 0.3);
            opacity: 1;
          }
          100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.3), 0 0 15px rgba(147, 51, 234, 0.2);
            opacity: 0.7;
          }
        }

        .pulse-glow {
          position: relative;
        }

        .pulse-glow::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 10px;
          background: radial-gradient(
            circle at center,
            rgba(59, 130, 246, 0.3) 0%,
            rgba(147, 51, 234, 0.3) 50%,
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }

        .group:hover .pulse-glow::before {
          opacity: 1;
        }

        .pulse-glow:hover {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
