import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Book, Calendar, Map, AlertCircle, Search, Coffee, Clock, User, GraduationCap } from 'lucide-react';

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
        {/* User Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center">
            <div className="relative">
              <User className="h-16 w-16 rounded-full p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300" />
              <span className="absolute bottom-0 right-0 h-4 w-4 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></span>
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.full_name || 'Student'}
              </h2>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <GraduationCap className="flex-shrink-0 mr-1.5 h-5 w-5" />
                  {user?.department || 'Department'} • Year {user?.year || 'N/A'}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <User className="flex-shrink-0 mr-1.5 h-5 w-5" />
                  Roll Number: {user?.roll_number || 'N/A'}
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5" />
                Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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