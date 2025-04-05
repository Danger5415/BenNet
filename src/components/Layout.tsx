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
  Coffee,
  Clock,
  BarChart,
  GraduationCap,
  Menu,
  X,
  Users,
  Library,
  FileText,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const { isDark } = useThemeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavigationItems = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Campus Map', href: '/map', icon: MapPin },
      { name: 'Issues', href: '/issues', icon: AlertCircle },
      { name: 'Lost & Found', href: '/lost-found', icon: Search },
      { name: 'Timetable', href: '/timetable', icon: Clock },
      { name: 'Library', href: '/library', icon: Library },
      { name: 'Study Material', href: '/study-material', icon: BookOpen },
      { name: 'Assignments', href: '/assignments', icon: FileText }
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
        <span className="ml-2 text-xl font-semibold theme-transition text-gray-900 dark:text-white">
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
              className={`nav-item group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                isActive
                  ? 'active bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              <Icon className={`h-5 w-5 mr-3 transition-colors duration-300 ${
                isActive 
                  ? 'text-white' 
                  : 'text-gray-400 group-hover:text-primary-500 dark:text-gray-400 dark:group-hover:text-primary-400'
              }`} />
              {item.name}
              <div className="nav-indicator" />
            </Link>
          );
        })}
      </nav>
    </>
  );

  const UserSection = () => (
    <div className="flex-shrink-0 border-t theme-transition border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-800 flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <span className="status-dot online absolute bottom-0 right-0 transform translate-x-1 translate-y-1" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium theme-transition text-gray-900 dark:text-white">
            {user?.email}
          </p>
          <p className="text-xs theme-transition text-gray-500 dark:text-gray-400">
            {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
          </p>
          <button
            onClick={() => signOut()}
            className="flex items-center text-sm mt-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen theme-transition ${isDark ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header with logo and menu button for mobile */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden">
        <div className={`flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 shadow-md`}>
          <div className="flex items-center">
            <motion.button
              onClick={toggleMobileMenu}
              className={`p-2 rounded-lg mr-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg`}
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
            <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
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
                className="fixed inset-y-0 left-0 w-64 z-40 md:hidden bg-white dark:bg-gray-800 shadow-xl mt-12"
              >
                <div className="flex flex-col h-full">
                  <div className="flex-grow overflow-y-auto">
                    <NavigationContent />
                  </div>
                  <UserSection />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64 bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
              <NavigationContent />
            </div>
            <UserSection />
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
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