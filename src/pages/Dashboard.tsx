import React from 'react';
import { useAuthStore } from '../store/authStore';
import WidgetGrid from '../components/WidgetGrid';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Welcome back, {user?.full_name || user?.email}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Your personalized dashboard
            </p>
          </div>
        </div>

        <WidgetGrid />
      </div>
    </div>
  );
}