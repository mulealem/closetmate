import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shirt, Home, Heart, Settings, LogOut, Plus, Sparkles } from 'lucide-react';
import AddClothingModal from './AddClothingModal';
import AIClothingModal from './AIClothingModal';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  const handleAddItemSuccess = () => {
    // Close modal and trigger wardrobe update
    setIsAddModalOpen(false);
    setIsAIModalOpen(false);
    window.dispatchEvent(new CustomEvent('wardrobeUpdated'));
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-purple-600 to-teal-600 p-2 rounded-lg">
                <Shirt className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
                ClosetMate
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              {user && (
                <>
                  {/* AI Analysis Button */}
                  <button
                    onClick={() => setIsAIModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-teal-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:block">AI Analysis</span>
                  </button>

                  {/* Regular Add Item Button */}
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:block">Manual Add</span>
                  </button>

                  <span className="text-sm text-gray-600 hidden sm:block">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:block">Sign Out</span>
                  </button>
                </>
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
                to="/add-clothing"
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 whitespace-nowrap transition-colors ${
                  isActive('/add-clothing') 
                    ? 'border-purple-500 text-purple-600' 
                    : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
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