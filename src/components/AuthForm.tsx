import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, Shirt, Sparkles, Camera, Wand2 } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-teal-600 dark:from-gray-900 dark:via-purple-900 dark:to-gray-800 transition-colors duration-300 overflow-hidden">
      {/* Dark Mode Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <DarkModeToggle className="bg-white/10 dark:bg-gray-800/50 text-white hover:bg-white/20 dark:hover:bg-gray-700/50" />
      </div>

      <div className="h-full flex">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8">
          <div className="max-w-md w-full">
            {/* Mobile Logo (Visible only on mobile) */}
            <div className="lg:hidden text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl mb-3">
                <Shirt className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">ClosetMate</h1>
            </div>

            {/* Auth Form */}
            <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-2xl">
              <div className="text-center mb-5">
                <h2 className="text-xl font-semibold text-white mb-1">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-sm text-purple-100 dark:text-gray-300">
                  {isSignUp 
                    ? 'Start organizing your wardrobe today' 
                    : 'Sign in to access your closet'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300 dark:text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-white/10 dark:bg-gray-700/50 border border-white/20 dark:border-gray-600 rounded-lg text-white placeholder-purple-200 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 dark:focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300 dark:text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-9 pr-10 py-2.5 bg-white/10 dark:bg-gray-700/50 border border-white/20 dark:border-gray-600 rounded-lg text-white placeholder-purple-200 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 dark:focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-100 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      <span>Please wait...</span>
                    </div>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </button>
              </form>

              {/* Toggle Auth Mode */}
              <div className="mt-5 text-center">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-sm text-purple-100 dark:text-gray-300 hover:text-white dark:hover:text-gray-100 transition-colors font-medium"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - App Showcase (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-teal-600/90 dark:from-gray-900/90 dark:to-purple-900/90"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 py-8 text-white">
            {/* Logo & Branding */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
                <Shirt className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-3 leading-tight">
                ClosetMate
              </h1>
              <div className="w-20 h-1 bg-gradient-to-r from-white to-teal-300 rounded-full"></div>
            </div>

            {/* Main Value Proposition */}
            <div className="mb-8">
              <h2 className="text-2xl font-light leading-relaxed text-white/95 dark:text-gray-200 mb-3">
                Transform your wardrobe with intelligent style recommendations
              </h2>
              <p className="text-base text-purple-200 dark:text-gray-400">
                Upload photos, get AI analysis, and discover perfect outfit combinations for any occasion.
              </p>
            </div>

            {/* Key Features */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">AI Photo Analysis</h3>
                  <p className="text-sm text-purple-100 dark:text-gray-300">
                    Automatically categorize clothing with 40+ detailed properties
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                  <Wand2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Smart Recommendations</h3>
                  <p className="text-sm text-purple-100 dark:text-gray-300">
                    Get personalized outfits based on weather and occasion
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Style Evolution</h3>
                  <p className="text-sm text-purple-100 dark:text-gray-300">
                    Track preferences and optimize your wardrobe over time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}