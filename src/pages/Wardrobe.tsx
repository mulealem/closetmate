import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, type ClothingItem } from '../lib/supabase';
import { Search, Filter, Grid, List, Trash2, Plus, RefreshCw, Eye, Camera, Sparkles } from 'lucide-react';
import ClothingDetailModal from '../components/ClothingDetailModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

export default function Wardrobe() {
  const { user } = useAuth();
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedWarmth, setSelectedWarmth] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [error, setError] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null);

  const categories = ['all', 'top', 'bottom', 'dress', 'jacket', 'outerwear', 'shoes', 'accessory'];
  const warmthLevels = ['all', 'light', 'medium', 'heavy'];

  useEffect(() => {
    if (user) {
      loadClothingItems();
    }
  }, [user]);

  // Listen for wardrobe updates
  useEffect(() => {
    const handleWardrobeUpdate = () => {
      console.log('Wardrobe update event received');
      loadClothingItems();
    };

    window.addEventListener('wardrobeUpdated', handleWardrobeUpdate);
    return () => window.removeEventListener('wardrobeUpdated', handleWardrobeUpdate);
  }, []);

  useEffect(() => {
    filterItems();
  }, [clothingItems, searchTerm, selectedCategory, selectedColor, selectedWarmth]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDetailModalOpen) {
        setIsDetailModalOpen(false);
        setSelectedItem(null);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isDetailModalOpen]);

  const loadClothingItems = async () => {
    if (!user) {
      console.log('No user found, skipping load');
      return;
    }

    try {
      setError('');
      console.log('🔄 Loading clothing items for user:', user.id);
      
      const { data, error, count } = await supabase
        .from('clothing_items')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('📊 Supabase response:', { data, error, count });

      if (error) {
        console.error('❌ Supabase error:', error);
        setError(`Database error: ${error.message}`);
        throw error;
      }
      
      const items = data || [];
      console.log(`✅ Successfully loaded ${items.length} clothing items`);
      console.log('📋 Items details:', items.map(item => ({ 
        id: item.id, 
        category: item.category, 
        color: item.color,
        created_at: item.created_at
      })));
      
      setClothingItems(items);
    } catch (error: any) {
      console.error('💥 Error loading clothing items:', error);
      setError(error.message || 'Failed to load clothing items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterItems = () => {
    let filtered = [...clothingItems];

    console.log('🔍 Filtering items:', { 
      total: clothingItems.length, 
      searchTerm, 
      selectedCategory, 
      selectedColor, 
      selectedWarmth 
    });

    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedColor !== 'all') {
      filtered = filtered.filter(item => item.color.toLowerCase().includes(selectedColor.toLowerCase()));
    }

    if (selectedWarmth !== 'all') {
      filtered = filtered.filter(item => item.warmth_level === selectedWarmth);
    }

    console.log(`📝 Filtered to ${filtered.length} items`);
    setFilteredItems(filtered);
  };

  const handleDeleteClick = (item: ClothingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('clothing_items')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      setClothingItems(prev => prev.filter(item => item.id !== itemToDelete.id));
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      console.log('🗑️ Item deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      setError('Failed to delete item. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleItemClick = (item: ClothingItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
  };

  const handleItemUpdate = () => {
    // Refresh the items list when an item is updated
    loadClothingItems();
  };

  const getUniqueColors = () => {
    const colors = clothingItems.map(item => item.color.toLowerCase());
    return ['all', ...Array.from(new Set(colors))];
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'all': 'All Categories',
      'top': 'Tops',
      'bottom': 'Bottoms',
      'dress': 'Dresses',
      'jacket': 'Jackets',
      'outerwear': 'Outerwear',
      'shoes': 'Shoes',
      'accessory': 'Accessories'
    };
    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClothingItems();
  };

  // Functions to trigger modals
  const handleOpenAIModal = () => {
    window.dispatchEvent(new CustomEvent('openAIModal'));
  };

  const handleOpenAddModal = () => {
    window.dispatchEvent(new CustomEvent('openAddModal'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your wardrobe...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your Wardrobe</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your clothing collection ({filteredItems.length} of {clothingItems.length} items)
            </p>
            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">⚠️ {error}</p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            {/* AI Analysis Button */}
            <button
              onClick={handleOpenAIModal}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-teal-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              <span className="hidden sm:block">AI Analysis</span>
              <span className="sm:hidden">AI</span>
            </button>

            {/* Manual Add Button */}
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:block">Manual Add</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 mb-8 transition-colors duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by color, category, or tags..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>

            {/* Color Filter */}
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300"
            >
              {getUniqueColors().map(color => (
                <option key={color} value={color}>
                  {color === 'all' ? 'All Colors' : color.charAt(0).toUpperCase() + color.slice(1)}
                </option>
              ))}
            </select>

            {/* Warmth Filter */}
            <select
              value={selectedWarmth}
              onChange={(e) => setSelectedWarmth(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300"
            >
              {warmthLevels.map(warmth => (
                <option key={warmth} value={warmth}>
                  {warmth === 'all' ? 'All Warmth' : warmth.charAt(0).toUpperCase() + warmth.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredItems.length} of {clothingItems.length} items
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Items Grid/List */}
        {filteredItems.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-12 text-center transition-colors duration-300">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              {clothingItems.length === 0 ? (
                <div>
                  <Plus className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Your wardrobe is empty
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 mb-6">
                    Start building your digital closet by adding your first clothing item!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleOpenAIModal}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-teal-700 transition-all"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      AI Photo Analysis
                    </button>
                    <button
                      onClick={handleOpenAddModal}
                      className="inline-flex items-center px-6 py-3 bg-gray-600 dark:bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Manual Entry
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <Search className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                    No items match your filters
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 mb-4">
                    Try adjusting your search criteria or clear the filters.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setSelectedColor('all');
                      setSelectedWarmth('all');
                    }}
                    className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
                onClick={() => handleItemClick(item)}
              >
                {/* Image */}
                <div className={`${viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'aspect-square'} bg-gray-50 dark:bg-gray-700 relative group`}>
                  <img
                    src={item.image_url}
                    alt={`${item.category} - ${item.color}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      console.error('❌ Image failed to load:', item.image_url);
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEwMCAxMDBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                    }}
                  />
                  
                  {/* Hover overlay with view icon */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                      <Eye className="h-6 w-6 text-gray-700" />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeleteClick(item, e)}
                      className="p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-full transition-colors shadow-lg"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
                        {item.category}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{item.color}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      item.warmth_level === 'light' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                      item.warmth_level === 'medium' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {item.warmth_level}
                    </span>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center justify-between">
                    <span>Added {new Date(item.created_at).toLocaleDateString()}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">Click to view</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clothing Detail Modal */}
        <ClothingDetailModal
          item={selectedItem}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          onUpdate={handleItemUpdate}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Clothing Item"
        message="Are you sure you want to delete this clothing item from your wardrobe?"
        itemName={itemToDelete ? `${itemToDelete.category} - ${itemToDelete.color}` : ''}
        loading={deleting}
      />
    </>
  );
}