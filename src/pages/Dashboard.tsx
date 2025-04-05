import React, { useEffect, useState } from 'react';
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
  AlertTriangle,
  MapPin,
  Loader
} from 'lucide-react';

interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  location: string;
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
  const { user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lon: longitude });
          await fetchWeather(latitude, longitude);
        },
        (err) => {
          console.error('Error getting location:', err);
          setError('Unable to get location. Using default location.');
          // Use default coordinates (New Delhi)
          fetchWeather(28.449209191001916, 77.58342079646457);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      // Use default coordinates
      fetchWeather(28.449209191001916, 77.58342079646457);
    }

    fetchNotifications();
  }, []);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=c22edca13bf58ee8f45410521cc7d24e&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      
      // Get location name using reverse geocoding
      const locationResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=c22edca13bf58ee8f45410521cc7d24e`
      );
      
      const locationData = await locationResponse.json();
      const locationName = locationData[0]?.name || 'Unknown Location';

      setWeather({
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        location: locationName
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (iconCode: string) => {
    const iconMap: { [key: string]: typeof Cloud } = {
      '01d': Sun,
      '01n': Moon,
      '02d': Cloud,
      '02n': Cloud,
      '03d': Cloud,
      '03n': Cloud,
      '04d': Cloud,
      '04n': Cloud,
      '09d': CloudRain,
      '09n': CloudRain,
      '10d': CloudRain,
      '10n': CloudRain,
      '11d': CloudLightning,
      '11n': CloudLightning,
      '13d': CloudSnow,
      '13n': CloudSnow,
      '50d': Cloud,
      '50n': Cloud
    };

    return iconMap[iconCode] || Cloud;
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
        {/* Welcome Section with Weather Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJsLTIgMnYtNGwyIDJzMi0yIDItNGMwLTItMi00LTItNHMtMiAyLTQgMmwtMi0ydjRsMi0yczIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi00LTJsLTIgMnYtNGwyIDJzMi0yIDItNGMwLTItMi00LTItNHMtMiAyLTQgMmwtMi0ydjRsMi0yczIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi00LTJsLTIgMnYtNGwyIDJzMi0yIDItNGMwLTItMi00LTItNHMtMiAyLTQgMmwtMi0ydjRsMi0yczIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi00LTJsLTIgMnYtNGwyIDJzMi0yIDItNGMwLTItMi00LTItNHMtMiAyLTQgMmwtMi0ydjRsMi0yczIgMiAyIDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
            <div className="relative">
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name || user?.email}</h1>
              <p className="text-primary-100">Access all campus services from your dashboard</p>
            </div>
          </motion.div>

          {/* Weather Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="h-8 w-8 text-primary-500 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-red-500">
                <AlertCircle className="h-6 w-6 mr-2" />
                <p>{error}</p>
              </div>
            ) : weather && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium dark:text-white">{weather.location}</h3>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20
                    }}
                    className="relative"
                  >
                    {React.createElement(getWeatherIcon(weather.icon), {
                      className: "h-24 w-24 text-primary-500 animate-float"
                    })}
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-4xl font-bold text-gray-900 dark:text-white">
                      {weather.temp}°C
                    </div>
                  </motion.div>
                </div>

                <div className="mt-8">
                  <p className="text-center text-gray-600 dark:text-gray-300 capitalize mb-4">
                    {weather.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center text-blue-500">
                        <Wind className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Wind</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {weather.windSpeed} m/s
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center text-blue-500">
                        <Droplets className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Humidity</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {weather.humidity}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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