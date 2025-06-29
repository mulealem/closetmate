import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, type ClothingItem, type Outfit } from '../lib/supabase';
import OutfitCard from '../components/OutfitCard';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { Heart, Search } from 'lucide-react';

export default function Favorites() {
  const { user } = useAuth();
  const [favoriteOutfits, setFavoriteOutfits] = useState<Outfit[]>([]);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState<Outfit | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load favorite outfits
      const { data: outfits } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .order('created_at', { ascending: false });

      setFavoriteOutfits(outfits || []);

      // Load clothing items
      const { data: items } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id);

      setClothingItems(items || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRateOutfit = async (outfitId: string, rating: number) => {
    try {
      await supabase
        .from('outfits')
        .update({ rating })
        .eq('id', outfitId);

      setFavoriteOutfits(prev => prev.map(outfit => 
        outfit.id === outfitId ? { ...outfit, rating } : outfit
      ));
    } catch (error) {
      console.error('Error rating outfit:', error);
    }
  };

  const handleToggleFavorite = async (outfitId: string, isFavorite: boolean) => {
    try {
      await supabase
        .from('outfits')
        .update({ is_favorite: isFavorite })
        .eq('id', outfitId);

      if (!isFavorite) {
        setFavoriteOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleDeleteClick = (outfitId: string) => {
    const outfit = favoriteOutfits.find(o => o.id === outfitId);
    if (outfit) {
      setOutfitToDelete(outfit);
      setShowDeleteConfirm(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!outfitToDelete) return;

    setDeleting(true);
    try {
      await supabase
        .from('outfits')
        .delete()
        .eq('id', outfitToDelete.id);

      setFavoriteOutfits(prev => prev.filter(outfit => outfit.id !== outfitToDelete.id));
      setShowDeleteConfirm(false);
      setOutfitToDelete(null);
    } catch (error) {
      console.error('Error deleting outfit:', error);
    } finally {
      setDeleting(false);
    }
  };

  const filteredOutfits = favoriteOutfits.filter(outfit => {
    if (!searchTerm) return true;
    
    const outfitItems = clothingItems.filter(item => 
      outfit.clothing_items.includes(item.id)
    );
    
    return (
      outfit.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outfit.weather_condition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outfitItems.some(item => 
        item.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            <h1 className="text-3xl font-bold text-gray-900">Favorite Outfits</h1>
          </div>
          <p className="text-gray-600">
            Your saved and loved outfit combinations ({filteredOutfits.length} outfits)
          </p>
        </div>

        {/* Search */}
        {favoriteOutfits.length > 0 && (
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search favorites..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* Favorites Grid */}
        {filteredOutfits.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-12 text-center">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            {favoriteOutfits.length === 0 ? (
              <div>
                <h3 className="text-xl font-medium text-gray-600 mb-3">
                  No favorite outfits yet
                </h3>
                <p className="text-gray-500 mb-8">
                  Start by creating some outfits and marking your favorites with the heart icon!
                </p>
                <div className="space-y-3">
                  <a
                    href="/"
                    className="inline-block px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Get Outfit Suggestions
                  </a>
                  <div>
                    <a
                      href="/wardrobe"
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      View Your Wardrobe →
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-medium text-gray-600 mb-3">
                  No favorites match your search
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search terms or clear the search.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredOutfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                clothingItems={clothingItems}
                onRate={handleRateOutfit}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        {favoriteOutfits.length > 0 && (
          <div className="mt-12 bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Favorites Stats</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {favoriteOutfits.length}
                </div>
                <div className="text-sm text-gray-600">Total Favorites</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {favoriteOutfits.filter(o => o.rating && o.rating >= 4).length}
                </div>
                <div className="text-sm text-gray-600">Highly Rated (4+ stars)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {Math.round(favoriteOutfits.reduce((sum, o) => sum + (o.rating || 0), 0) / favoriteOutfits.length * 10) / 10 || 0}
                </div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setOutfitToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Favorite Outfit"
        message="Are you sure you want to delete this outfit from your favorites?"
        itemName={outfitToDelete?.name || 'Unnamed Outfit'}
        loading={deleting}
      />
    </>
  );
}