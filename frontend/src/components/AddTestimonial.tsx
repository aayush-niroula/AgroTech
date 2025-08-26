import { useState } from "react";
import { Star } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

interface TestimonialFormData {
  name: string;
  role: string;
  content: string;
  rating: number;
  location: string;
}

interface SubmitEvent extends React.FormEvent<HTMLFormElement> {}

interface AddTestimonialFormProps {
  onClose: () => void;
}

export function AddTestimonialForm({ onClose }: AddTestimonialFormProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: SubmitEvent): Promise<void> => {
    e.preventDefault();
    if (!name || !role || !content || rating < 1 || rating > 5 || !location) {
      alert("Please fill out all required fields and provide a rating between 1 and 5.");
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setName("");
      setRole("");
      setContent("");
      setRating(0);
      setLocation("");
      setIsLoading(false);
      alert("Testimonial submitted successfully!");
      onClose(); // Call onClose after successful submission
    }, 2000);
  };

  return (
    <section className="py-16 px-4 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      <div className="max-w-md mx-auto">
        <div className="relative">
          {/* Main form container with 3D effects */}
          <div className="relative bg-white dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 rounded-2xl p-8 shadow-2xl border border-transparent transform-gpu snake-border"
               style={{ 
                 transform: 'perspective(1000px) rotateX(2deg)',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1) dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]'
               }}>
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Add Your Testimonial
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>

              <div className="space-y-6">
                {/* Name Field */}
                <div className="group">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                    Name
                  </label>
                  <div className="relative">
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
                      placeholder="Your full name"
                      required
                      style={{
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                      }}
                    />
                  </div>
                </div>

                {/* Role Field */}
                <div className="group">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                    Role
                  </label>
                  <input
                    id="role"
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
                    placeholder="e.g., Farmer, Agronomist"
                    required
                    style={{
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                    }}
                  />
                </div>

                {/* Content Field */}
                <div className="group">
                  <label htmlFor="content" className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                    Feedback
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60 resize-none"
                    placeholder="Share your experience with AgriCare..."
                    required
                    style={{
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                    }}
                  />
                </div>

                {/* Rating Field */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-8 h-8 cursor-pointer transition-all duration-300 transform hover:scale-110 ${
                          star <= rating 
                            ? "text-yellow-400 fill-current filter drop-shadow-lg" 
                            : "text-gray-400 dark:text-slate-500 hover:text-gray-300 dark:hover:text-slate-400"
                        }`}
                        onClick={() => setRating(star)}
                        style={{
                          filter: star <= rating ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Location Field */}
                <div className="group">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-100/50 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-gray-100/70 dark:focus:bg-slate-700/70 hover:bg-gray-100/60 dark:hover:bg-slate-700/60"
                    placeholder="e.g., Kathmandu, Nepal"
                    required
                    style={{
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) dark:inset-[0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)]'
                    }}
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gray-200/50 hover:bg-gray-300/70 border border-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-300 backdrop-blur-sm transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 dark:bg-slate-600/50 dark:hover:bg-slate-600/70 dark:border-slate-500/50 dark:text-slate-300"
                    style={{
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.1) dark:[0_4px_15px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.1)]'
                    }}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg overflow-hidden"
                    style={{
                      boxShadow: '0 8px 25px rgba(147, 51, 234, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    {isLoading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-80">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </div>
                    )}
                    <span className="relative z-10">
                      {isLoading ? "Submitting..." : "Submit"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

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

        .group:hover input,
        .group:hover textarea {
          transform: translateY(-1px);
        }
      `}</style>
    </section>
  );
}