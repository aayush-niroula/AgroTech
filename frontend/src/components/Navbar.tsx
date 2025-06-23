

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Leaf, Menu, X, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from '@/app/store';
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/app/slices/authSlice';

interface NavLink {
  href: string;
  label: string;
}

interface User {
  name: string;
  email: string;
  avatar: string;
}

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isDark, setIsDark] = useState<boolean>(
    () => document.documentElement.classList.contains('dark')
  );
  const user = useSelector((state: RootState) => state.auth.user);
const dispatch = useDispatch();
const navigate = useNavigate();


const handleLogout = () => {
  dispatch(logout());
  navigate("/login");
};

  const navLinks: NavLink[] = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it Works' },
    { href: '#marketplace', label: 'Marketplace' },
    { href: '#contact', label: 'Contact' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 20);
      const sections = ['features', 'how-it-works', 'marketplace', 'contact'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      setActiveSection(currentSection || '');
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark', !isDark);
  };

  const navLinkVariants: Variants = {
    initial: { opacity: 0, y: -20 },
    animate: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * i,
        duration: 0.5,
        ease: 'easeOut',
      }
    })
  };

  const dropdownVariants: Variants = {
    initial: { opacity: 0, scale: 0.9, y: -10 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -10,
      transition: { duration: 0.15, ease: [0.4, 0, 1, 1] }
    }
  };

  return (
    <motion.header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-lg'
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-800/50'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <motion.div
          className="flex items-center space-x-2"
          initial={{ opacity: 0, x: -30, rotate: -180 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800 dark:text-white">AgriCare</span>
        </motion.div>

        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link, i) => (
            <motion.a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium hover:text-green-600 dark:hover:text-green-400 ${
                activeSection === link.href.slice(1)
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              custom={i}
              variants={navLinkVariants}
              initial="initial"
              animate="animate"
            >
              {link.label}
            </motion.a>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={toggleTheme} size="icon">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer ring-2 ring-green-600/20">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mt-2">
              <motion.div
                variants={dropdownVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <DropdownMenuLabel>
                  <div>{user?.name}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem  onClick={handleLogout}className="text-red-500">Logout</DropdownMenuItem>
              </motion.div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
};
