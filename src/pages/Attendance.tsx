import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, BarChart } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AttendanceStats {
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  status: 'good' | 'warning' | 'danger';
  subjectWise: {
    [key: string]: {
      total: number;
      attended: number;
      percentage: number;
    };
  };
  recentAttendance: {
    date: string;
    subject: string;
    status: 'present' | 'absent';
  }[];
}

// Demo attendance data for different students
const demoAttendanceData: { [key: string]: AttendanceStats } = {
  'student@campus.edu': {
    totalClasses: 45,
    attendedClasses: 38,
    percentage: 84.44,
    status: 'good',
    subjectWise: {
      'Design and Analysis of Algorithm': {
        total: 12,
        attended: 11,
        percentage: 91.67
      },
      'Computer Networks': {
        total: 15,
        attended: 12,
        percentage: 80
      },
      'Operating System': {
        total: 10,
        attended: 8,
        percentage: 80
      },
      'Design Thinking and Innovation': {
        total: 8,
        attended: 7,
        percentage: 87.5
      }
    },
    recentAttendance: [
      {
        date: '2024-04-06',
        subject: 'Operating System',
        status: 'present'
      },
      {
        date: '2024-04-05',
        subject: 'Computer Networks',
        status: 'present'
      },
      {
        date: '2024-04-04',
        subject: 'Design Thinking and Innovation',
        status: 'absent'
      },
      {
        date: '2024-04-03',
        subject: 'Design and Analysis of Algorithm',
        status: 'present'
      }
    ]
  },
  'e23cseu1927@bennett.edu.in': {
    totalClasses: 45,
    attendedClasses: 32,
    percentage: 71.11,
    status: 'warning',
    subjectWise: {
      'Design and Analysis of Algorithm': {
        total: 12,
        attended: 9,
        percentage: 75
      },
      'Computer Networks': {
        total: 15,
        attended: 10,
        percentage: 66.67
      },
      'Operating System': {
        total: 10,
        attended: 7,
        percentage: 70
      },
      'Design Thinking and Innovation': {
        total: 8,
        attended: 6,
        percentage: 75
      }
    },
    recentAttendance: [
      {
        date: '2024-04-06',
        subject: 'Operating System',
        status: 'absent'
      },
      {
        date: '2024-04-05',
        subject: 'Computer Networks',
        status: 'present'
      },
      {
        date: '2024-04-04',
        subject: 'Design Thinking and Innovation',
        status: 'present'
      },
      {
        date: '2024-04-03',
        subject: 'Design and Analysis of Algorithm',
        status: 'present'
      }
    ]
  },
  'e23cseu1935@bennett.edu.in': {
    totalClasses: 45,
    attendedClasses: 25,
    percentage: 55.56,
    status: 'danger',
    subjectWise: {
      'Design and Analysis of Algorithm': {
        total: 12,
        attended: 7,
        percentage: 58.33
      },
      'Computer Networks': {
        total: 15,
        attended: 8,
        percentage: 53.33
      },
      'Operating System': {
        total: 10,
        attended: 5,
        percentage: 50
      },
      'Design Thinking and Innovation': {
        total: 8,
        attended: 5,
        percentage: 62.5
      }
    },
    recentAttendance: [
      {
        date: '2024-04-06',
        subject: 'Operating System',
        status: 'absent'
      },
      {
        date: '2024-04-05',
        subject: 'Computer Networks',
        status: 'absent'
      },
      {
        date: '2024-04-04',
        subject: 'Design Thinking and Innovation',
        status: 'present'
      },
      {
        date: '2024-04-03',
        subject: 'Design and Analysis of Algorithm',
        status: 'present'
      }
    ]
  }
};

export default function Attendance() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AttendanceStats>({
    totalClasses: 0,
    attendedClasses: 0,
    percentage: 0,
    status: 'good',
    subjectWise: {},
    recentAttendance: []
  });

  // Animated circular progress
  const [progressAnimation, setProgressAnimation] = useState(0);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressAnimation / 100) * circumference;

  useEffect(() => {
    if (!user) return;

    // Get demo data based on user email or fallback to default student
    const userStats = demoAttendanceData[user.email] || demoAttendanceData['student@campus.edu'];
    setStats(userStats);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressAnimation(stats.percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [stats.percentage]);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-500 dark:text-green-400';
    if (percentage >= 65) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'stroke-green-500';
    if (percentage >= 65) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold dark:text-white">Attendance Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Attendance Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Overall Attendance</h2>
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg className="transform -rotate-90 w-48 h-48">
                {/* Background circle */}
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  className="stroke-gray-200 dark:stroke-gray-700"
                  strokeWidth="12"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  className={`${getProgressColor(stats.percentage)} transition-all duration-1000 ease-out`}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className={`text-4xl font-bold ${getStatusColor(stats.percentage)}`}>
                    {Math.round(progressAnimation)}%
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Attendance</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalClasses}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Classes</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.attendedClasses}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Classes Attended</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalClasses - stats.attendedClasses}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Classes Missed</p>
            </div>
          </div>
        </div>

        {/* Subject-wise Attendance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Subject-wise Attendance</h2>
          <div className="space-y-4">
            {Object.entries(stats.subjectWise).map(([subject, data]) => (
              <div key={subject}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{subject}</span>
                  <span className={`text-sm font-medium ${getStatusColor(data.percentage)}`}>
                    {data.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${
                      data.percentage >= 75 ? 'bg-green-500' :
                      data.percentage >= 65 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {data.attended} of {data.total} classes attended
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Recent Attendance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Subject</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAttendance.map((record, index) => (
                <tr
                  key={index}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-300">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900 dark:text-gray-300">{record.subject}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {record.status === 'present' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span
                        className={`text-sm ${
                          record.status === 'present'
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}