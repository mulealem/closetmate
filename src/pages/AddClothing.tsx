import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus, Check } from 'lucide-react';

export default function AddClothing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: 'top',
    color: '',
    warmth_level: 'medium',
    tags: [] as string[],
    newTag: ''
  });

  const categories = [
    { value: 'top', label: 'Top (T-shirt, Blouse, Sweater)' },
    { value: 'bottom', label: 'Bottom (Pants, Jeans, Skirt)' },
    { value: 'dress', label: 'Dress (Casual, Formal, Summer)' },
    { value: 'jacket', label: 'Jacket (Light jacket, Blazer)' },
    { value: 'outerwear', label: 'Outerwear (Coat, Heavy jacket)' },
    { value: 'shoes', label: 'Shoes (Sneakers, Boots, Heels)' },
    { value: 'accessory', label: 'Accessory (Hat, Scarf, Bag)' }
  ];

  const warmthLevels = [
    { value: 'light', label: 'Light (Summer, Warm weather)' },
    { value: 'medium', label: 'Medium (Spring/Fall, Mild weather)' },
    { value: 'heavy', label: 'Heavy (Winter, Cold weather)' }
  ];

  const commonColors = [
    'Black', 'White', 'Gray', 'Navy', 'Brown', 'Beige',
    'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Pink',
    'Orange', 'Teal', 'Burgundy', 'Olive'
  ];

  const commonTags = [
    'Casual', 'Formal', 'Work', 'Weekend', 'Evening', 'Sport',
    'Comfortable', 'Elegant', 'Vintage', 'Modern', 'Trendy'
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
        newTag: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imageFile || !formData.color.trim()) return;

    setLoading(true);
    try {
      // Upload image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clothing-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('clothing-images')
        .getPublicUrl(fileName);

      // Save clothing item to database
      const { error: dbError } = await supabase
        .from('clothing_items')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          category: formData.category,
          color: formData.color.trim(),
          warmth_level: formData.warmth_level,
          tags: formData.tags
        });

      if (dbError) throw dbError;

      navigate('/wardrobe');
    } catch (error) {
      console.error('Error saving clothing item:', error);
      alert('Failed to save clothing item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Clothing Item</h1>
        <p className="text-gray-600">
          Upload a photo and add details about your clothing item.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Image Upload */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Photo *
          </label>
          
          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12">
              <div className="text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-700">
                    Click to upload photo
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-2xl"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Category *
          </label>
          <div className="grid grid-cols-1 gap-2">
            {categories.map((category) => (
              <label key={category.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category.value}
                  checked={formData.category === category.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-700">{category.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Color *
          </label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            placeholder="e.g., Navy Blue, Dark Gray, Bright Red"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <div className="mt-3">
            <p className="text-sm text-gray-500 mb-2">Quick select:</p>
            <div className="flex flex-wrap gap-2">
              {commonColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 transition-colors"
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Warmth Level */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Warmth Level *
          </label>
          <div className="space-y-2">
            {warmthLevels.map((level) => (
              <label key={level.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="warmth_level"
                  value={level.value}
                  checked={formData.warmth_level === level.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, warmth_level: e.target.value }))}
                  className="mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-700">{level.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tags (Optional)
          </label>
          
          {/* Current Tags */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-purple-500 hover:text-purple-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add Custom Tag */}
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={formData.newTag}
              onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
              placeholder="Add custom tag"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(formData.newTag);
                }
              }}
            />
            <button
              type="button"
              onClick={() => addTag(formData.newTag)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Common Tags */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Suggested tags:</p>
            <div className="flex flex-wrap gap-2">
              {commonTags.filter(tag => !formData.tags.includes(tag)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/wardrobe')}
            className="px-6 py-3 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !imageFile || !formData.color.trim()}
            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Add to Wardrobe</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}