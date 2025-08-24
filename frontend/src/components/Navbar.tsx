import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Menu, X, Sun, Moon, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { type RootState } from "@/app/store";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { socket } from "@/utils/socketClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/slices/authSlice";
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation } from "@/services/notificationApi";
import { useGetUserByIdQuery } from "@/services/authApi";

interface Notification {
  _id: string;
  senderId: {
    _id: string;
    name: string;
  };
  conversationId: string;
  messageId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

// Separate component for rendering a single notification
const NotificationItem = ({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: (notification: Notification) => void;
}) => {
  const { data: sender, isLoading: isSenderLoading } = useGetUserByIdQuery(notification.senderId._id);

  return (
    <DropdownMenuItem
      onClick={() => onClick(notification)}
      className={`flex flex-col items-start ${notification.isRead ? "" : "font-semibold"}`}
    >
      <div className="flex items-center space-x-2">
        <Avatar className="w-6 h-6">
          <AvatarFallback>
            {isSenderLoading ? "..." : sender?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <span>{isSenderLoading ? "Loading..." : sender?.name || "Unknown"}</span>
      </div>
      <p className="text-sm text-gray-500 truncate w-full">
        {notification.text}
      </p>
      <p className="text-xs text-gray-400">
        {new Date(notification.createdAt).toLocaleTimeString()}
      </p>
    </DropdownMenuItem>
  );
};

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark")
  );

  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { data: notifications = [], isLoading, refetch } = useGetNotificationsQuery(undefined, {
    skip: !user,
  });
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    socket.on("receive_notification", () => {
      console.log("receive_notification");
      refetch();
    });
    return () => {
      socket.off("receive_notification");
    };
  }, [refetch]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark", !isDark);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification._id).unwrap();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    navigate(`/seller/inbox?conversationId=${notification.conversationId}`);
  };

  return (
    <motion.header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-lg"
          : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-800/50"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800 dark:text-white">
            AgroTech
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          {[
            { href: "/features", label: "Features" },
            { href: "/marketplace", label: "Marketplace" },
            { href: "/how-it-works", label: "How it Works" },
            { href: "/contact", label: "Contact" },
            { href: "/createproduct", label: "Add product" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium hover:text-green-600 dark:hover:text-green-400 ${
                location.pathname === link.href
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={toggleTheme} size="icon">
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-block w-3 h-3 bg-red-500 rounded-full" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoading ? (
                <DropdownMenuItem className="text-gray-500">
                  Loading notifications...
                </DropdownMenuItem>
              ) : notifications.length === 0 ? (
                <DropdownMenuItem className="text-gray-500">
                  No notifications
                </DropdownMenuItem>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onClick={handleNotificationClick}
                  />
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/seller/inbox")}>
                View All Notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer ring-2 ring-green-600/20">
                <AvatarFallback>{user?.name?.charAt(0) ?? "U"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>
                <div>{user?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {user?.email}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/seller/inbox")}>
                📬 Inbox
                {unreadCount > 0 && (
                  <span className="ml-2 inline-block w-3 h-3 bg-red-500 rounded-full" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden"
            size="icon"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 px-6 py-4 border-t dark:border-gray-800 space-y-4"
          >
            {[
              { href: "/features", label: "Features" },
              { href: "/marketplace", label: "Marketplace" },
              { href: "/how-it-works", label: "How it Works" },
              { href: "/contact", label: "Contact" },
              { href: "/createproduct", label: "Add product" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block text-base font-medium hover:text-green-600 dark:hover:text-green-400 ${
                  location.pathname === link.href
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};