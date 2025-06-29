import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, type UserPreferences } from '../lib/supabase';
import { Settings, MapPin, Palette, Shirt, Save } from 'lucide-react';

export default function Preferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    city: '',
    preferred_colors: [] as string[],
    preferred_categories: [] as string[],
    style_preferences: {} as Record<string, any>
  });

  const availableColors = [
    'Black', 'White', 'Gray', 'Navy', 'Brown', 'Beige',
    'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Pink',
    'Orange', 'Teal', 'Burgundy', 'Olive'
  ];

  const availableCategories = [
    { value: 'top', label: 'Tops' },
    { value: 'bottom', label: 'Bottoms' },
    { value: 'dress', label: 'Dresses' },
    { value: 'jacket', label: 'Jackets' },
    { value: 'outerwear', label: 'Outerwear' },
    { value: 'shoes', label: 'Shoes' },
    { value: 'accessory', label: 'Accessories' }
  ];

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setPreferences(data);
        setFormData({
          city: data.city || '',
          preferred_colors: data.preferred_colors || [],
          preferred_categories: data.preferred_categories || [],
          style_preferences: data.style_preferences || {}
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorToggle = (color: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_colors: prev.preferred_colors.includes(color)
        ? prev.preferred_colors.filter(c => c !== color)
        : [...prev.preferred_colors, color]
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_categories: prev.preferred_categories.includes(category)
        ? prev.preferred_categories.filter(c => c !== category)
        : [...prev.preferred_categories, category]
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          city: formData.city,
          preferred_colors: formData.preferred_colors,
          preferred_categories: formData.preferred_categories,
          style_preferences: formData.style_preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Reload preferences
      await loadPreferences();
      
      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Preferences</h1>
        </div>
        <p className="text-gray-600">
          Customize your ClosetMate experience for better outfit suggestions.
        </p>
      </div>

      <div className="space-y-8">
        {/* Location Settings */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <MapPin className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Location</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="e.g., New York, London, Tokyo"
              className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-sm text-gray-500 mt-2">
              We'll use this to get accurate weather data for your outfit suggestions.
            </p>
          </div>
        </div>

        {/* Color Preferences */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <Palette className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-800">Favorite Colors</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            Select colors you prefer to wear. We'll prioritize these in our suggestions.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {availableColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorToggle(color)}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  formData.preferred_colors.includes(color)
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' : color.toLowerCase() }}
                  />
                  <span className="text-sm font-medium">{color}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Category Preferences */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <Shirt className="h-6 w-6 text-teal-600" />
            <h2 className="text-xl font-semibold text-gray-800">Preferred Categories</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            Tell us which types of clothing you prefer to wear more often.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableCategories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategoryToggle(category.value)}
                className={`p-4 text-left border rounded-lg transition-colors ${
                  formData.preferred_categories.includes(category.value)
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-medium">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-12 bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Tips for Better Suggestions</h3>
        <ul className="space-y-2 text-blue-700">
          <li>• Add more clothing items to your wardrobe for diverse outfit options</li>
          <li>• Rate outfits to help us learn what you like</li>
          <li>• Use specific colors (e.g., "Navy Blue" instead of just "Blue")</li>
          <li>• Add tags to your clothes for better categorization</li>
          <li>• Keep your location updated for accurate weather-based suggestions</li>
        </ul>
      </div>
    </div>
  );
}