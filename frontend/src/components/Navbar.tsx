import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Menu, X, Sun, Moon, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { type RootState } from "@/app/store";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
} from "@/services/notificationApi";
import { useGetUserByIdQuery } from "@/services/authApi";
import { useGetAllUsersQuery } from "@/services/adminApi";

// ------------------- Notification Item -------------------
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

const NotificationItem = ({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: (notification: Notification) => void;
}) => {
  const { data: sender, isLoading: isSenderLoading } = useGetUserByIdQuery(
    notification.senderId._id
  );

  return (
    <DropdownMenuItem
      onClick={() => onClick(notification)}
      className={`flex flex-col items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        notification.isRead ? "" : "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500"
      }`}
    >
      <div className="flex items-center space-x-2 w-full">
        <Avatar className="w-6 h-6">
          <AvatarFallback className="text-xs">
            {isSenderLoading ? "..." : sender?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm">
          {isSenderLoading ? "Loading..." : sender?.name || "Unknown"}
        </span>
        {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto" />}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 truncate w-full mt-1">
        {notification.text}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
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

  const { data: notifications = [], refetch } = useGetNotificationsQuery(undefined, {
    skip: !user,
  });
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const { data: allUsers = [] } = useGetAllUsersQuery(undefined, {
    skip: !user?.isAdmin,
  });

  useEffect(() => {
    socket.on("receive_notification", () => {
      refetch();
    });
    return () => {
      socket.off("receive_notification");
    };
  }, [refetch]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
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
    if (!notification.isRead) await markNotificationAsRead(notification._id).unwrap();
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
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800 dark:text-white">AgroTech</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {[
            { href: "/features", label: "Features" },
            { href: "/marketplace", label: "Marketplace" },
            { href: "/createproduct", label: "Sell Products" },
            {
              href: "/seller/inbox",
              label: "Inbox",
              hasNotification: unreadCount > 0,
              notificationCount: unreadCount,
            },
            ...(user?.isAdmin
              ? [{ href: "/admin", label: "Admin Dashboard" }]
              : []),
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`relative text-sm font-medium transition-colors duration-200 hover:text-green-600 dark:hover:text-green-400 flex items-center space-x-1 ${
                location.pathname === link.href
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              <span>{link.label}</span>
              {link.hasNotification && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold ml-1"
                >
                  {link.notificationCount > 9 ? "9+" : link.notificationCount}
                </motion.div>
              )}
             
            </a>
          ))}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button variant="ghost" onClick={toggleTheme} size="icon">
            {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                  />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <DropdownMenuItem className="text-gray-500 text-center py-8">
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
              {notifications.length > 5 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/seller/inbox")} className="text-center text-green-600">
                    View All Notifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer ring-2 ring-green-500/20">
                <AvatarImage src={user?.avatarUrl || ""} alt={user?.name || "User"} />
                <AvatarFallback>{user?.name?.charAt(0) ?? "U"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <div className="font-semibold">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Button variant="ghost" onClick={() => setMobileOpen(!mobileOpen)} size="icon" className="md:hidden">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-lg overflow-hidden"
          >
            <div className="px-6 py-4 space-y-4">
              {[
                { href: "/features", label: "Features" },
                { href: "/marketplace", label: "Marketplace" },
                { href: "/createproduct", label: "Sell Products" },
                {
                  href: "/seller/inbox",
                  label: "Inbox",
                  hasNotification: unreadCount > 0,
                  notificationCount: unreadCount,
                },
                ...(user?.isAdmin ? [{ href: "/admin", label: "Admin Dashboard", badge: allUsers.length }] : []),
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between text-base font-medium py-2 px-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-green-600 dark:hover:text-green-400 ${
                    location.pathname === link.href
                      ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-1 px-1 text-xs font-semibold bg-green-500 text-white rounded-full">
                      {link.badge}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
