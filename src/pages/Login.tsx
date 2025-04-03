import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { LogIn, User, Key, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const signIn = useAuthStore((state) => state.signIn);
  const setRememberMeStore = useAuthStore((state) => state.setRememberMe);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signIn(email, password, rememberMe);
      setRememberMeStore(rememberMe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMTIxMjEiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJsLTIgMnYtNGwyIDJzMi0yIDItNGMwLTItMi00LTItNHMtMiAyLTQgMmwtMi0ydjRsMi0yczIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi00LTJsLTIgMnYtNGwyIDJzMi0yIDItNGMwLTItMi00LTItNHMtMiAyLTQgMmwtMi0ydjRsMi0yczIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi00LTJsLTIgMnYtNGwyIDJzMi0yIDItNGMwLTItMi00LTItNHMtMiAyLTQgMmwtMi0ydjRsMi0yczIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi00LTJsLTIgMnYtNGwyIDJzMi0yIDItNGMwLTItMi00LTItNHMtMiAyLTQgMmwtMi0ydjRsMi0yczIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi00LTJsLTIgMnYtNGwyIDJzMi0yIDItNGMwLTItMi00LTItNHMtMiAyLTQgMmwtMi0ydjRsMi0yczIgMiAyIDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-5"></div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-md w-full"
      >
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8 space-y-8 relative overflow-hidden">
          {/* Animated gradient orb */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-primary-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-blue-500/30 to-primary-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <motion.div variants={itemVariants} className="flex flex-col items-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-2xl shadow-lg transform -rotate-12 absolute"></div>
              <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg flex items-center justify-center relative">
                <img 
                  src="/logo.svg" 
                  alt="BenNet Logo" 
                  className="h-12 w-12 transform transition-transform duration-200 hover:scale-110"
                />
              </div>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-white">Welcome Back</h2>
            <p className="mt-2 text-gray-400">Sign in to your account</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center text-red-200"
            >
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 text-white"
                    placeholder="Enter your email"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>

              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 text-white"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-700 rounded bg-gray-900/50"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                    Remember me
                  </label>
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="relative w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <LogIn className="h-5 w-5 mr-2" />
                )}
                {isLoading ? 'Signing in...' : 'Sign in'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </motion.button>

            <motion.div variants={itemVariants} className="text-sm text-center space-y-1">
              <p className="text-gray-500">Demo Accounts:</p>
              <p className="text-primary-400">Admin: admin@campus.edu / admin123</p>
              <p className="text-primary-400">Teacher: teacher@campus.edu / teacher123</p>
              <p className="text-primary-400">Student: student@campus.edu / student123</p>
            </motion.div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}