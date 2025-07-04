import React, { useState } from 'react';
import { Heart, Star, Trash2, Eye } from 'lucide-react';
import type { ClothingItem, Outfit } from '../lib/supabase';

interface OutfitCardProps {
  outfit: Outfit;
  clothingItems: ClothingItem[];
  onRate: (outfitId: string, rating: number) => void;
  onToggleFavorite: (outfitId: string, isFavorite: boolean) => void;
  onDelete?: (outfitId: string) => void;
}

export default function OutfitCard({ 
  outfit, 
  clothingItems, 
  onRate, 
  onToggleFavorite, 
  onDelete 
}: OutfitCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const outfitItems = clothingItems.filter(item => 
    outfit.clothing_items.includes(item.id)
  );

  const handleRating = (rating: number) => {
    onRate(outfit.id, rating);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300">
      {/* Outfit Images */}
      <div className="aspect-square bg-gray-50 dark:bg-gray-700 relative">
        <div className="grid grid-cols-2 gap-1 p-2 h-full">
          {outfitItems.slice(0, 4).map((item, index) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-600 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
            >
              <img
                src={item.image_url}
                alt={`${item.category} - ${item.color}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {outfitItems.length > 4 && (
            <div className="bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">+{outfitItems.length - 4}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2 flex flex-col space-y-1">
          <button
            onClick={() => onToggleFavorite(outfit.id, !outfit.is_favorite)}
            className={`p-2 rounded-full transition-colors ${
              outfit.is_favorite 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            <Heart className={`h-4 w-4 ${outfit.is_favorite ? 'fill-current' : ''}`} />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(outfit.id)}
              className="p-2 bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Outfit Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-800 dark:text-gray-200">
            {outfit.name || 'Outfit'}
          </h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>

        {/* Weather Info */}
        {outfit.weather_condition && (
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
              {outfit.weather_condition}
            </span>
            {outfit.temperature && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {outfit.temperature}°C
              </span>
            )}
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRating(star)}
                className={`transition-colors ${
                  (outfit.rating && star <= outfit.rating)
                    ? 'text-yellow-400' 
                    : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                }`}
              >
                <Star className="h-4 w-4 fill-current" />
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {outfitItems.length} items
          </span>
        </div>

        {/* Details */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="space-y-1">
              {outfitItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {item.category}: {item.color}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">
                    {item.warmth_level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}