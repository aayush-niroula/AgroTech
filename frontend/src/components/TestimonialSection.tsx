import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import {
  useGetTestimonialsQuery,
  useDeleteTestimonialMutation,
  useUpdateTestimonialMutation,
} from "@/services/testimonialApi";
import { AddTestimonialForm } from "./AddTestimonial";
import { Textarea } from "./ui/textarea";

interface IUser {
  _id: string;
  name: string;
  role?: string;
}

export interface ITestimonial {
  _id: string;
  userId: IUser;
  content: string;
  rating: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export const TestimonialSection = () => {
  const { data: testimonials = [], isLoading, error } = useGetTestimonialsQuery();
  const [deleteTestimonial] = useDeleteTestimonialMutation();
  const [updateTestimonial] = useUpdateTestimonialMutation();
  const user = useSelector((state: RootState) => state.auth.user);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Debugging logs
  console.log("TestimonialSection - Testimonials:", testimonials);
  console.log("TestimonialSection - IsLoading:", isLoading);
  console.log("TestimonialSection - Error:", error);
  console.log("TestimonialSection - User:", user);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this testimonial?")) {
      try {
        await deleteTestimonial(id).unwrap();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleEdit = (testimonial: ITestimonial) => {
    setEditingId(testimonial._id);
    setEditContent(testimonial.content);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateTestimonial({ id: editingId, data: { content: editContent } }).unwrap();
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        <motion.div className="text-center mb-12 max-w-4xl mx-auto" {...fadeInUp}>
          <Badge className="mb-4 bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50">
            Testimonials
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            What Farmers Say
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
            Hear from users who are benefiting from our AI-powered agriculture platform.
          </p>
        </motion.div>
        <div className="text-center text-gray-600 dark:text-slate-300">Loading testimonials...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        <motion.div className="text-center mb-12 max-w-4xl mx-auto" {...fadeInUp}>
          <Badge className="mb-4 bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50">
            Testimonials
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            What Farmers Say
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
            Hear from users who are benefiting from our AI-powered agriculture platform.
          </p>
        </motion.div>
        <div className="text-center text-red-500">
          Error loading testimonials. Please try again later.
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      <motion.div className="text-center mb-12 max-w-4xl mx-auto" {...fadeInUp}>
        <Badge className="mb-4 bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50">
          Testimonials
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          What Farmers Say
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
          Hear from users who are benefiting from our AI-powered agriculture platform.
        </p>
        {user && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="mt-4 relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            style={{
              boxShadow: '0 8px 25px rgba(147, 51, 234, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? "Cancel" : "Add Testimonial"}
          </Button>
        )}
      </motion.div>

      {showForm && user && <AddTestimonialForm onClose={() => setShowForm(false)} />}

      {testimonials.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-slate-300">
          No testimonials available. Be the first to share your experience!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t) => {
            const userObj = typeof t.userId === "object" ? t.userId : null;
            const canEditDelete = user && userObj?._id === (user.id || user.id);

            return (
              <motion.div key={t._id} {...fadeInUp}>
                <div className="relative snake-border">
                  <Card className="relative bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 border border-transparent shadow-2xl transform-gpu"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1) dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]'
                    }}>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < t.rating ? "text-yellow-400 fill-current filter drop-shadow-lg" : "text-gray-400 dark:text-slate-500"
                            }`}
                            style={{
                              filter: i < t.rating ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))' : 'none'
                            }}
                          />
                        ))}
                      </div>

                      {editingId === t._id ? (
                        <div className="mb-2">
                          <Textarea
                            className="w-full px-4 py-3 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={4}
                            style={{
                              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                            }}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 bg-gray-200/50 hover:bg-gray-300/70 border border-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-300 backdrop-blur-sm transform hover:scale-105 dark:bg-slate-600/50 dark:hover:bg-slate-600/70 dark:border-slate-500/50 dark:text-slate-300"
                              style={{
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.1) dark:[0_4px_15px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.1)]'
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                              style={{
                                boxShadow: '0 8px 25px rgba(147, 51, 234, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-slate-300 mb-2 italic">"{t.content}"</p>
                      )}

                      <div className="border-t border-gray-200 dark:border-slate-700/50 pt-2">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {userObj?.name || "Anonymous"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-slate-400">
                          {userObj?.role || "User"}
                        </div>
                        {t.location && (
                          <div className="text-sm text-gray-500 dark:text-slate-500 mt-1">
                            {t.location}
                          </div>
                        )}

                        {canEditDelete && editingId !== t._id && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(t)}
                              className="px-4 py-2 bg-gray-200/50 hover:bg-gray-300/70 border border-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-300 backdrop-blur-sm transform hover:scale-105 dark:bg-slate-600/50 dark:hover:bg-slate-600/70 dark:border-slate-500/50 dark:text-slate-300"
                              style={{
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.1) dark:[0_4px_15px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.1)]'
                              }}
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(t._id)}
                              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                              style={{
                                boxShadow: '0 8px 25px rgba(220, 38, 38, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

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
    </section>
  );
};