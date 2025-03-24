import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Book, Calendar, Map, AlertCircle, Search, Coffee, Clock } from 'lucide-react';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const quickAccess = [
    {
      title: 'Campus Map',
      icon: Map,
      description: 'View campus locations and navigate easily',
      color: 'bg-blue-500',
      path: '/map'
    },
    {
      title: 'Report Issue',
      icon: AlertCircle,
      description: 'Report campus issues or maintenance requests',
      color: 'bg-red-500',
      path: '/issues'
    },
    {
      title: 'Lost & Found',
      icon: Search,
      description: 'Post or search for lost items',
      color: 'bg-purple-500',
      path: '/lost-found'
    },
    {
      title: 'Cafeteria Menu',
      icon: Coffee,
      description: "View today's menu and rate the food",
      color: 'bg-yellow-500',
      path: '/cafeteria'
    },
    {
      title: 'Events',
      icon: Calendar,
      description: 'Browse upcoming campus events',
      color: 'bg-green-500',
      path: '/events'
    },
    {
      title: 'Tutoring',
      icon: Book,
      description: 'Find tutors or manage teaching sessions',
      color: 'bg-indigo-500',
      path: '/teaching'
    },
    {
      title: 'Timetable',
      icon: Clock,
      description: 'View class schedule and mark attendance',
      color: 'bg-pink-500',
      path: '/timetable'
    }
  ];

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Welcome, {user?.email}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Access all campus services from your dashboard
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickAccess.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300 ease-in-out cursor-pointer"
                onClick={() => navigate(item.path)}
              >
                <div className="p-5">
                  <div className={`inline-flex p-3 rounded-lg ${item.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
                    Access &rarr;
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}