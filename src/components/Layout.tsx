import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import {
  LayoutDashboard,
  MapPin,
  AlertCircle,
  Search,
  Calendar,
  Book,
  LogOut,
  User,
  Sun,
  Moon,
  Coffee,
  Clock,
  BarChart,
  GraduationCap,
  Menu,
  X,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavigationItems = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Campus Map', href: '/map', icon: MapPin },
      { name: 'Issues', href: '/issues', icon: AlertCircle },
      { name: 'Lost & Found', href: '/lost-found', icon: Search },
      { name: 'Timetable', href: '/timetable', icon: Clock },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseNavigation,
        { name: 'Events', href: '/events', icon: Calendar },
        { name: 'Teaching', href: '/teaching', icon: Book },
        { name: 'Cafeteria Menu', href: '/cafeteria', icon: Coffee },
        { name: 'Students', href: '/students', icon: GraduationCap },
        { name: 'Teachers', href: '/teachers', icon: Users }
      ];
    } else if (user?.role === 'teacher') {
      return [
        ...baseNavigation,
        { name: 'Teaching', href: '/teaching', icon: Book }
      ];
    } else {
      return [
        ...baseNavigation,
        { name: 'Events', href: '/events', icon: Calendar },
        { name: 'Teaching', href: '/teaching', icon: Book },
        { name: 'Cafeteria Menu', href: '/cafeteria', icon: Coffee },
        { name: 'Attendance', href: '/attendance', icon: BarChart }
      ];
    }
  };

  const navigation = getNavigationItems();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    document.body.style.overflow = !isMobileMenuOpen ? 'hidden' : 'auto';
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = 'auto';
  };

  const NavigationContent = () => (
    <>
      <div className="flex items-center flex-shrink-0 px-4 mb-5">
        <img 
          src="/logo.svg" 
          alt="BenNet Logo" 
          className="h-8 w-8 transform transition-transform duration-200 hover:scale-110"
        />
        <span className={`ml-2 text-xl font-semibold theme-transition ${isDark ? 'text-white' : 'text-gray-900'}`}>
          BenNet
        </span>
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={closeMobileMenu}
              className={`nav-item group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive
                  ? isDark 
                    ? 'bg-primary-900/50 text-primary-400 shadow-soft'
                    : 'bg-primary-50 text-primary-600 shadow-soft'
                  : isDark
                    ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                isActive 
                  ? 'text-primary-500' 
                  : 'group-hover:text-primary-500'
              }`} />
              {item.name}
              {isActive && (
                <span className="absolute right-0 w-1 h-8 bg-primary-500 rounded-l-md transform transition-transform duration-200" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );

  const UserSection = () => (
    <div className={`flex-shrink-0 border-t theme-transition ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4`}>
      <div className="flex items-center">
        <div className="relative">
          <User className={`h-8 w-8 rounded-full p-1 theme-transition ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-100'}`} />
          <span className="status-dot online absolute bottom-0 right-0 transform translate-x-1 translate-y-1" />
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium theme-transition ${isDark ? 'text-white' : 'text-gray-700'}`}>
            {user?.email}
          </p>
          <p className={`text-xs theme-transition ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
          </p>
          <button
            onClick={() => signOut()}
            className={`flex items-center text-sm theme-transition ${
              isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LogOut className="mr-1 h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  const ThemeToggle = () => (
    <div className={`p-4 border-t theme-transition ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <button
        onClick={toggleTheme}
        className={`btn-primary flex items-center justify-center w-full px-4 py-2 rounded-md ${
          isDark
            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {isDark ? (
          <>
            <Sun className="h-4 w-4 mr-2" />
            Light Mode
          </>
        ) : (
          <>
            <Moon className="h-4 w-4 mr-2" />
            Dark Mode
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen theme-transition ${isDark ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header with logo and menu button for mobile */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden">
        <div className={`flex items-center justify-between px-4 py-2 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <div className="flex items-center">
            <motion.button
              onClick={toggleMobileMenu}
              className={`p-2 rounded-md mr-3 ${
                isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
              } shadow-lg`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isMobileMenuOpen ? 'close' : 'menu'}
                  initial={{ opacity: 0, rotate: -180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 180 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
            <img 
              src="/logo.svg" 
              alt="BenNet Logo" 
              className="h-8 w-8"
            />
            <span className={`ml-2 text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              BenNet
            </span>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                onClick={closeMobileMenu}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed inset-y-0 left-0 w-64 z-40 md:hidden ${
                  isDark ? 'dark-card border-gray-700' : 'light-card border-gray-200'
                } border-r backdrop-blur-lg bg-white/90 dark:bg-gray-800/90 mt-12`}
              >
                <div className="flex flex-col h-full">
                  <div className="flex-grow overflow-y-auto">
                    <NavigationContent />
                  </div>
                  <UserSection />
                  <ThemeToggle />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className={`flex flex-col w-64 theme-transition ${isDark ? 'dark-card border-gray-700' : 'light-card border-gray-200'} border-r`}>
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
              <NavigationContent />
            </div>
            <UserSection />
            <ThemeToggle />
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6 page-transition">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {/* Add padding to account for fixed mobile header */}
                <div className="md:pt-0 pt-16">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}