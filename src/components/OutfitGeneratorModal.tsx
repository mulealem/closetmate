import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Sparkles, X, Wand2, Check, AlertCircle, Loader, MapPin, Calendar, Palette, MessageSquare } from 'lucide-react';
import type { WeatherData } from '../lib/weather';

interface OutfitGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather?: WeatherData | null;
}

interface OutfitSuggestion {
  name: string;
  items: any[];
  item_ids: string[];
  reasoning: string;
  style_notes: string;
  confidence: number;
}

interface GeneratedSuggestions {
  outfits: OutfitSuggestion[];
  general_tips: string;
}

export default function OutfitGeneratorModal({ isOpen, onClose, weather }: OutfitGeneratorModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [suggestions, setSuggestions] = useState<GeneratedSuggestions | null>(null);
  const [formData, setFormData] = useState({
    occasion: 'Daily Commute',
    style_preferences: [] as string[],
    color_preferences: [] as string[],
    comfort_level: 'High',
    additional_notes: ''
  });

  const occasions = [
    'Daily Commute',
    'Work/Office',
    'Casual Outing',
    'Date Night',
    'Formal Event',
    'Party/Social',
    'Athletic/Gym',
    'Travel',
    'Interview',
    'Wedding/Celebration',
    'Beach/Vacation',
    'Business Meeting',
    'Dinner Out',
    'Shopping',
    'Weekend Relaxing'
  ];

  const stylePreferences = [
    'Minimalist',
    'Classic',
    'Trendy',
    'Bohemian',
    'Chic',
    'Casual',
    'Elegant',
    'Edgy',
    'Romantic',
    'Professional',
    'Streetwear',
    'Vintage'
  ];

  const colorPreferences = [
    'Black',
    'White',
    'Gray',
    'Navy',
    'Brown',
    'Beige',
    'Red',
    'Blue',
    'Green',
    'Purple',
    'Pink',
    'Yellow'
  ];

  const comfortLevels = [
    { value: 'High', label: 'High Comfort (Soft, flexible fabrics)' },
    { value: 'Moderate', label: 'Moderate (Balance of style and comfort)' },
    { value: 'Low', label: 'Style First (Prioritize appearance)' }
  ];

  const resetForm = () => {
    setFormData({
      occasion: 'Daily Commute',
      style_preferences: [],
      color_preferences: [],
      comfort_level: 'High',
      additional_notes: ''
    });
    setSuggestions(null);
    setError('');
  };

  const toggleArrayItem = (array: string[], item: string, setter: (value: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const generateOutfits = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const requestBody = {
        occasion: formData.occasion,
        weather: weather ? {
          temperature: weather.temperature,
          condition: weather.condition,
          city: weather.city
        } : undefined,
        preferences: {
          style: formData.style_preferences,
          colors: formData.color_preferences,
          comfort_level: formData.comfort_level
        },
        additional_notes: formData.additional_notes
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-outfit-suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate outfit suggestions');
      }

      const result = await response.json();
      
      if (result.success) {
        setSuggestions(result.suggestions);
      } else {
        throw new Error(result.error || 'Failed to generate suggestions');
      }

    } catch (error: any) {
      console.error('Error generating outfits:', error);
      setError(error.message || 'Failed to generate outfit suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveOutfit = async (outfit: OutfitSuggestion) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('outfits')
        .insert({
          user_id: user.id,
          name: outfit.name,
          clothing_items: outfit.item_ids,
          weather_condition: weather?.condition,
          temperature: weather?.temperature,
        });

      if (error) throw error;

      // Show success feedback
      alert('Outfit saved successfully!');
    } catch (error) {
      console.error('Error saving outfit:', error);
      alert('Failed to save outfit. Please try again.');
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-teal-600 rounded-lg">
              <Wand2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Outfit Generator</h2>
              <p className="text-gray-600 dark:text-gray-400">Get personalized outfit suggestions for any occasion</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!suggestions ? (
            /* Input Form */
            <div className="space-y-6">
              {/* Weather Info */}
              {weather && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-800 dark:text-blue-300">Current Weather</span>
                  </div>
                  <p className="text-blue-700 dark:text-blue-400">
                    {weather.temperature}°C, {weather.description} in {weather.city}
                  </p>
                </div>
              )}

              {/* Occasion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  What's the occasion? *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {occasions.map((occasion) => (
                    <button
                      key={occasion}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, occasion }))}
                      className={`p-3 text-left border rounded-lg transition-colors ${
                        formData.occasion === occasion
                          ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 dark:bg-gray-700/50 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-sm font-medium">{occasion}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Palette className="h-4 w-4 inline mr-2" />
                  Style Preferences (Optional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {stylePreferences.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleArrayItem(
                        formData.style_preferences, 
                        style, 
                        (newArray) => setFormData(prev => ({ ...prev, style_preferences: newArray }))
                      )}
                      className={`p-2 text-center border rounded-lg transition-colors ${
                        formData.style_preferences.includes(style)
                          ? 'border-teal-500 dark:border-teal-400 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 dark:bg-gray-700/50 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-sm">{style}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Color Preferences (Optional)
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {colorPreferences.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleArrayItem(
                        formData.color_preferences, 
                        color, 
                        (newArray) => setFormData(prev => ({ ...prev, color_preferences: newArray }))
                      )}
                      className={`p-2 text-center border rounded-lg transition-colors ${
                        formData.color_preferences.includes(color)
                          ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 dark:bg-gray-700/50 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <div
                          className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-500"
                          style={{ backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' : color.toLowerCase() }}
                        />
                        <span className="text-xs">{color}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comfort Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Comfort Priority
                </label>
                <div className="space-y-2">
                  {comfortLevels.map((level) => (
                    <label key={level.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="comfort_level"
                        value={level.value}
                        checked={formData.comfort_level === level.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, comfort_level: e.target.value }))}
                        className="mr-3 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{level.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <MessageSquare className="h-4 w-4 inline mr-2" />
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.additional_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                  placeholder="Any specific requirements, preferences, or constraints..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300"
                  rows={3}
                />
              </div>

              {/* Generate Button */}
              <div className="text-center pt-4">
                <button
                  onClick={generateOutfits}
                  disabled={loading}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
                >
                  {loading ? (
                    <>
                      <Loader className="h-5 w-5 mr-3 animate-spin" />
                      Generating Outfits...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-3" />
                      Generate AI Outfits
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Generated Suggestions */
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Outfit Suggestions Generated!
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  For {formData.occasion} • {suggestions.outfits.length} suggestions
                </p>
              </div>

              {/* General Tips */}
              {suggestions.general_tips && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Styling Tips</h4>
                  <p className="text-blue-700 dark:text-blue-400 text-sm">{suggestions.general_tips}</p>
                </div>
              )}

              {/* Outfit Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {suggestions.outfits.map((outfit, index) => (
                  <div key={index} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                    {/* Outfit Images */}
                    <div className="aspect-square bg-gray-50 dark:bg-gray-600 relative">
                      <div className="grid grid-cols-2 gap-1 p-2 h-full">
                        {outfit.items.slice(0, 4).map((item, itemIndex) => (
                          <div
                            key={item.id}
                            className="bg-white dark:bg-gray-500 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-500"
                          >
                            <img
                              src={item.image_url}
                              alt={`${item.category} - ${item.color}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {outfit.items.length > 4 && (
                          <div className="bg-gray-200 dark:bg-gray-500 rounded-lg flex items-center justify-center">
                            <span className="text-sm text-gray-600 dark:text-gray-300">+{outfit.items.length - 4}</span>
                          </div>
                        )}
                      </div>

                      {/* Confidence Score */}
                      <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-2 py-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {Math.round(outfit.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Outfit Info */}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{outfit.name}</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Why this works:</p>
                          <p className="text-sm text-gray-800 dark:text-gray-300">{outfit.reasoning}</p>
                        </div>

                        {outfit.style_notes && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Styling tips:</p>
                            <p className="text-sm text-gray-800 dark:text-gray-300">{outfit.style_notes}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-600">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {outfit.items.length} items
                          </span>
                          <button
                            onClick={() => saveOutfit(outfit)}
                            className="px-3 py-1 bg-purple-600 dark:bg-purple-700 text-white text-sm rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
                          >
                            Save Outfit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setSuggestions(null)}
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Generate New Suggestions
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-gray-600 dark:bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}