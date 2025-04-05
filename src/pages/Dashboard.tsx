import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book,
  Calendar,
  Map,
  AlertCircle,
  Search,
  Coffee,
  Clock,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Thermometer,
  Wind,
  Droplets,
  ArrowRight,
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

// Weather API key
const WEATHER_API_KEY = '89ac3b0c6b12e272f81248c8e2c11f1c';
const CAMPUS_LAT = '28.450717';
const CAMPUS_LONG = '77.584179';

interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning';
  timestamp: Date;
}

interface QuickAccessCard {
  title: string;
  icon: React.ElementType;
  description: string;
  color: string;
  path: string;
  stats?: string;
  loading?: boolean;
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchWeather();
    fetchNotifications();
  }, []);

  const fetchWeather = async () => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${CAMPUS_LAT}&lon=${CAMPUS_LONG}&appid=${WEATHER_API_KEY}&units=metric`
      );
      const data = await response.json();
      
      setWeather({
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        description: data.weather[0].description,
        icon: data.weather[0].icon
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = () => {
    // Simulated notifications - replace with real API call
    setNotifications([
      {
        id: 1,
        title: 'Assignment Due',
        message: 'Data Structures assignment due in 2 days',
        type: 'warning',
        timestamp: new Date()
      },
      {
        id: 2,
        title: 'Attendance Updated',
        message: 'Your attendance has been marked for today',
        type: 'success',
        timestamp: new Date()
      }
    ]);
  };

  const getWeatherIcon = (description: string) => {
    if (description.includes('rain')) return CloudRain;
    if (description.includes('snow')) return CloudSnow;
    if (description.includes('thunder')) return CloudLightning;
    return Cloud;
  };

  const quickAccess: QuickAccessCard[] = [
    {
      title: 'Campus Map',
      icon: Map,
      description: 'View campus locations and navigate easily',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      path: '/map',
      stats: '15 Buildings'
    },
    {
      title: 'Report Issue',
      icon: AlertCircle,
      description: 'Report campus issues or maintenance requests',
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      path: '/issues',
      stats: '2 Active Issues'
    },
    {
      title: 'Lost & Found',
      icon: Search,
      description: 'Post or search for lost items',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      path: '/lost-found',
      stats: '5 New Items'
    },
    {
      title: 'Cafeteria Menu',
      icon: Coffee,
      description: "View today's menu and rate the food",
      color: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      path: '/cafeteria',
      stats: 'Menu Updated'
    },
    {
      title: 'Events',
      icon: Calendar,
      description: 'Browse upcoming campus events',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      path: '/events',
      stats: '3 Upcoming'
    },
    {
      title: 'Tutoring',
      icon: Book,
      description: 'Find tutors or manage teaching sessions',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      path: '/teaching',
      stats: '2 Active Sessions'
    },
    {
      title: 'Timetable',
      icon: Clock,
      description: 'View class schedule and mark attendance',
      color: 'bg-gradient-to-br from-pink-500 to-pink-600',
      path: '/timetable',
      stats: 'Next: Mathematics'
    }
  ];

  const NotificationIcon = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle
  };

  const NotificationColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500'
  };

  return (
    <div className="py-6 space-y-6">
      {/* Header with Theme Toggle and Notifications */}
      <div className="fixed top-4 right-4 flex items-center space-x-4 z-50">
        {/* Notifications Button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </motion.button>

          {/* Notifications Panel */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
              >
                <div className="p-4 border-b dark:border-gray-700">
                  <h3 className="text-lg font-semibold dark:text-white">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => {
                    const Icon = NotificationIcon[notification.type];
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start">
                          <div className={`p-2 ${NotificationColor[notification.type]} rounded-full`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium dark:text-white">{notification.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{notification.message}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {notification.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="relative p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
        >
          <motion.div
            initial={false}
            animate={{
              scale: isDark ? 0 : 1,
              opacity: isDark ? 0 : 1,
              y: isDark ? 20 : 0
            }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="h-6 w-6 text-yellow-500" />
          </motion.div>
          <motion.div
            initial={false}
            animate={{
              scale: isDark ? 1 : 0,
              opacity: isDark ? 1 : 0,
              y: isDark ? 0 : -20
            }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="h-6 w-6 text-blue-500" />
          </motion.div>
          <div className="w-6 h-6" /> {/* Spacer */}
        </motion.button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJsLTIgMnYtNGwyIDJzMi0yIDItNGMwLTItMi00LTItNHMtMiAyLTQgMmwtMi0ydjRsMi0yczIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi00LTJsLTIgMnYtNGwyIDJzMi0yIDItNGMwLTItMi00LTItNHMtMiAyLTQgMmwtMi0ydjRsMi0yczIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi00LTJsLTIgMnYtNGwyIDJzMi0yIDItNGMwLTItMi00LTItNHMtMiAyLTQgMmwtMi0ydjRsMi0yczIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi00LTJsLTIgMnYtNGwyIDJzMi0yIDItNGMwLTItMi00LTItNHMtMiAyLTQgMmwtMi0ydjRsMi0yczIgMiAyIDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
          <div className="relative">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name || user?.email}</h1>
            <p className="text-primary-100">Access all campus services from your dashboard</p>
          </div>

          {/* Weather Widget */}
          {weather && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-8 right-8 bg-white/10 backdrop-blur-md rounded-lg p-4 flex items-center space-x-6"
            >
              <div className="flex items-center space-x-4">
                {React.createElement(getWeatherIcon(weather.description), {
                  className: "h-10 w-10 text-white"
                })}
                <div>
                  <div className="text-3xl font-bold">{weather.temp}°C</div>
                  <div className="text-sm capitalize">{weather.description}</div>
                </div>
              </div>
              <div className="border-l border-white/20 pl-6 space-y-2">
                <div className="flex items-center text-sm">
                  <Wind className="h-4 w-4 mr-2" />
                  {weather.windSpeed} m/s
                </div>
                <div className="flex items-center text-sm">
                  <Droplets className="h-4 w-4 mr-2" />
                  {weather.humidity}%
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Quick Access Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickAccess.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => navigate(item.path)}
              >
                <div className={`absolute inset-0 ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${item.color} bg-opacity-10 group-hover:bg-opacity-20 transition-colors`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 group-hover:text-white/90 transition-colors">
                    {item.description}
                  </p>
                  {item.stats && (
                    <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 group-hover:bg-white/20 group-hover:text-white transition-colors">
                      {item.stats}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}