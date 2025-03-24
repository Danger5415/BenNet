import React from 'react';
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
  BarChart
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Campus Map', href: '/map', icon: MapPin },
    { name: 'Issues', href: '/issues', icon: AlertCircle },
    { name: 'Lost & Found', href: '/lost-found', icon: Search },
    { name: 'Cafeteria Menu', href: '/cafeteria', icon: Coffee },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Teaching', href: '/teaching', icon: Book },
    { name: 'Timetable', href: '/timetable', icon: Clock },
    { name: 'Attendance', href: '/attendance', icon: BarChart },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className={`flex flex-col w-64 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r`}>
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <img 
                  src="/logo.svg" 
                  alt="BenNet Logo" 
                  className="h-8 w-8"
                />
                <span className={`ml-2 text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  BenNet
                </span>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        location.pathname === item.href
                          ? isDark 
                            ? 'bg-gray-900 text-blue-400'
                            : 'bg-blue-50 text-blue-600'
                          : isDark
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-600 hover:bg-gray-50'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className={`flex-shrink-0 flex border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4`}>
              <div className="flex items-center flex-1">
                <User className={`h-8 w-8 rounded-full ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <div className="ml-3">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    {user?.email}
                  </p>
                  <button
                    onClick={() => signOut()}
                    className={`flex items-center text-sm ${
                      isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <LogOut className="mr-1 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
            <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={toggleTheme}
                className={`flex items-center justify-center w-full px-4 py-2 rounded-md ${
                  isDark
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors duration-150`}
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
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}