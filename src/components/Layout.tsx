import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shirt, Home, Heart, Settings, LogOut, Plus, Sparkles, User, ChevronDown, ExternalLink } from 'lucide-react';
import AddClothingModal from './AddClothingModal';
import AIClothingModal from './AIClothingModal';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsUserDropdownOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAddItemSuccess = () => {
    setIsAddModalOpen(false);
    setIsAIModalOpen(false);
    window.dispatchEvent(new CustomEvent('wardrobeUpdated'));
  };

  // Get user initials for avatar
  const getUserInitials = (email: string | undefined) => {
    if (!email || typeof email !== 'string') return 'U';
    try {
      const name = email.split('@')[0];
      if (!name) return 'U';
      
      const parts = name.split(/[._-]/);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    } catch (error) {
      console.error('Error getting user initials:', error);
      return 'U';
    }
  };

  // Get username from email
  const getUsername = (email: string | undefined) => {
    if (!email || typeof email !== 'string') return 'User';
    try {
      const username = email.split('@')[0];
      return username || 'User';
    } catch (error) {
      console.error('Error getting username:', error);
      return 'User';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserDropdownOpen]);

  // Listen for the custom event to open the modal
  useEffect(() => {
    const handleOpenAddModal = () => {
      setIsAddModalOpen(true);
    };

    const handleOpenAIModal = () => {
      setIsAIModalOpen(true);
    };

    window.addEventListener('openAddModal', handleOpenAddModal);
    window.addEventListener('openAIModal', handleOpenAIModal);
    return () => {
      window.removeEventListener('openAddModal', handleOpenAddModal);
      window.removeEventListener('openAIModal', handleOpenAIModal);
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('Layout component rendered with user:', user);
    console.log('User email:', user?.email);
    console.log('User initials:', getUserInitials(user?.email));
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-purple-600 to-teal-600 p-2 rounded-lg">
                <Shirt className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
                ClosetMate
              </span>
            </Link>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* AI Analysis Button */}
                  <button
                    onClick={() => setIsAIModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-teal-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:block">AI Analysis</span>
                  </button>

                  {/* Manual Add Item Button */}
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:block">Manual Add</span>
                  </button>

                  {/* User Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => {
                        console.log('User dropdown clicked, current state:', isUserDropdownOpen);
                        setIsUserDropdownOpen(!isUserDropdownOpen);
                      }}
                      className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                      {/* User Avatar */}
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {getUserInitials(user.email)}
                      </div>
                      
                      {/* Username and Chevron (hidden on mobile) */}
                      <div className="hidden sm:flex items-center space-x-1">
                        <span className="text-sm font-medium text-gray-700 max-w-32 truncate">
                          {getUsername(user.email)}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                          isUserDropdownOpen ? 'rotate-180' : ''
                        }`} />
                      </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                              {getUserInitials(user.email)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {getUsername(user.email)}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email || 'No email'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            to="/preferences"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="h-4 w-4 mr-3 text-gray-500" />
                            Account Settings
                          </Link>
                          
                          <Link
                            to="/favorites"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Heart className="h-4 w-4 mr-3 text-gray-500" />
                            My Favorites
                          </Link>

                          <Link
                            to="/wardrobe"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Shirt className="h-4 w-4 mr-3 text-gray-500" />
                            My Wardrobe
                          </Link>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 my-1"></div>

                        {/* Sign Out */}
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-600">
                  Loading...
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      {user && (
        <nav className="bg-white/60 backdrop-blur-sm border-b border-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto">
              <Link
                to="/"
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 whitespace-nowrap transition-colors ${
                  isActive('/') 
                    ? 'border-purple-500 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/wardrobe"
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 whitespace-nowrap transition-colors ${
                  isActive('/wardrobe') 
                    ? 'border-purple-500 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300'
                }`}
              >
                <Shirt className="h-4 w-4" />
                <span>Wardrobe</span>
              </Link>
              <Link
                to="/favorites"
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 whitespace-nowrap transition-colors ${
                  isActive('/favorites') 
                    ? 'border-purple-500 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300'
                }`}
              >
                <Heart className="h-4 w-4" />
                <span>Favorites</span>
              </Link>
              <Link
                to="/preferences"
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 whitespace-nowrap transition-colors ${
                  isActive('/preferences') 
                    ? 'border-purple-500 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Preferences</span>
              </Link>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Built with Bolt.new Badge */}
      <div className="fixed bottom-4 right-4 z-40">
        <a
          href="https://bolt.new"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center space-x-2 px-3 py-2 bg-black/80 backdrop-blur-sm text-white text-xs font-medium rounded-full hover:bg-black/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <span>Built with Bolt.new</span>
          <ExternalLink className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>

      {/* Add Clothing Modal */}
      <AddClothingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddItemSuccess}
      />

      {/* AI Clothing Analysis Modal */}
      <AIClothingModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={handleAddItemSuccess}
      />
    </div>
  );
}