import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, Shirt, Sparkles, Camera, Wand2, Heart, Star, TrendingUp } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-teal-600 dark:from-gray-900 dark:via-purple-900 dark:to-gray-800 transition-colors duration-300">
      {/* Dark Mode Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <DarkModeToggle className="bg-white/10 dark:bg-gray-800/50 text-white hover:bg-white/20 dark:hover:bg-gray-700/50" />
      </div>

      <div className="min-h-screen flex">
        {/* Left Side - App Showcase (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-teal-600/90 dark:from-gray-900/90 dark:to-purple-900/90"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
            {/* Logo */}
            <div className="mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl mb-6">
                <Shirt className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold mb-4 leading-tight">
                ClosetMate
              </h1>
              <p className="text-2xl font-light text-purple-100 dark:text-gray-300 mb-8">
                Your AI-Powered Style Companion
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-white to-teal-300 rounded-full"></div>
            </div>

            {/* Motto */}
            <div className="mb-12">
              <blockquote className="text-3xl font-light italic leading-relaxed text-white/90 dark:text-gray-200">
                "Style is a way to say who you are without having to speak."
              </blockquote>
              <p className="text-lg text-purple-200 dark:text-gray-400 mt-4">
                — Rachel Zoe
              </p>
            </div>

            {/* Features */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">AI Photo Analysis</h3>
                  <p className="text-purple-100 dark:text-gray-300 leading-relaxed">
                    Upload photos of your clothes and let our AI automatically categorize, tag, and analyze them with 40+ detailed properties.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Wand2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Smart Outfit Suggestions</h3>
                  <p className="text-purple-100 dark:text-gray-300 leading-relaxed">
                    Get personalized outfit recommendations based on weather, occasion, and your style preferences using advanced AI.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Style Analytics</h3>
                  <p className="text-purple-100 dark:text-gray-300 leading-relaxed">
                    Track your style evolution, discover patterns, and optimize your wardrobe with detailed insights and analytics.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">40+</div>
                <div className="text-sm text-purple-200 dark:text-gray-400">AI Properties</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">∞</div>
                <div className="text-sm text-purple-200 dark:text-gray-400">Outfit Combos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">24/7</div>
                <div className="text-sm text-purple-200 dark:text-gray-400">Style Assistant</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8">
          <div className="max-w-md w-full">
            {/* Mobile Logo (Visible only on mobile) */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
                <Shirt className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">ClosetMate</h1>
              <p className="text-purple-100 dark:text-gray-300">Your AI-powered wardrobe assistant</p>
            </div>

            {/* Auth Form */}
            <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/50 shadow-2xl">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-white mb-2">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-purple-100 dark:text-gray-300">
                  {isSignUp 
                    ? 'Start organizing your wardrobe today' 
                    : 'Sign in to access your closet'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300 dark:text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/10 dark:bg-gray-700/50 border border-white/20 dark:border-gray-600 rounded-lg text-white placeholder-purple-200 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 dark:focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300 dark:text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-12 py-3 bg-white/10 dark:bg-gray-700/50 border border-white/20 dark:border-gray-600 rounded-lg text-white placeholder-purple-200 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 dark:focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                  className="w-full py-3 px-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
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
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-purple-100 dark:text-gray-300 hover:text-white dark:hover:text-gray-100 transition-colors font-medium"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>

              {/* Features Preview (Mobile only) */}
              <div className="lg:hidden mt-8 pt-6 border-t border-white/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs text-purple-100 dark:text-gray-300">AI Analysis</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs text-purple-100 dark:text-gray-300">Smart Outfits</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs text-purple-100 dark:text-gray-300">Style Insights</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}