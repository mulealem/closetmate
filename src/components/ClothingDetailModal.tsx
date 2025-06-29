import React, { useState } from 'react';
import { X, Calendar, Tag, Thermometer, Shirt, Edit3, Trash2, Save, Upload, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import type { ClothingItem } from '../lib/supabase';

interface ClothingDetailModalProps {
  item: ClothingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function ClothingDetailModal({ item, isOpen, onClose, onUpdate }: ClothingDetailModalProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    category: '',
    color: '',
    warmth_level: '',
    tags: [] as string[],
    newTag: ''
  });

  const categories = [
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'dress', label: 'Dress' },
    { value: 'jacket', label: 'Jacket' },
    { value: 'outerwear', label: 'Outerwear' },
    { value: 'shoes', label: 'Shoes' },
    { value: 'accessory', label: 'Accessory' }
  ];

  const warmthLevels = [
    { value: 'light', label: 'Light' },
    { value: 'medium', label: 'Medium' },
    { value: 'heavy', label: 'Heavy' }
  ];

  const commonColors = [
    'Black', 'White', 'Gray', 'Navy', 'Brown', 'Beige',
    'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Pink'
  ];

  const commonTags = [
    'Casual', 'Formal', 'Work', 'Weekend', 'Evening', 'Sport'
  ];

  React.useEffect(() => {
    if (item && isEditing) {
      setEditData({
        category: item.category,
        color: item.color,
        warmth_level: item.warmth_level,
        tags: [...(item.tags || [])],
        newTag: ''
      });
      setImagePreview(null);
      setImageFile(null);
      setError('');
    }
  }, [item, isEditing]);

  if (!isOpen || !item) return null;

  const getWarmthColor = (warmth: string) => {
    switch (warmth) {
      case 'light': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'heavy': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    return <Shirt className="h-5 w-5" />;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setError('');
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !editData.tags.includes(tag.trim())) {
      setEditData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
        newTag: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async () => {
    if (!user || !editData.color.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = item.image_url;

      // Upload new image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('clothing-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('clothing-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;

        // Delete old image if it exists and is different
        if (item.image_url && item.image_url !== publicUrl) {
          try {
            const oldPath = item.image_url.split('/').pop();
            if (oldPath) {
              await supabase.storage
                .from('clothing-images')
                .remove([`${user.id}/${oldPath}`]);
            }
          } catch (deleteError) {
            console.warn('Failed to delete old image:', deleteError);
          }
        }
      }

      // Update item in database
      const { error: updateError } = await supabase
        .from('clothing_items')
        .update({
          image_url: imageUrl,
          category: editData.category,
          color: editData.color.trim(),
          warmth_level: editData.warmth_level,
          tags: editData.tags
        })
        .eq('id', item.id);

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      setIsEditing(false);
      onUpdate?.();
      window.dispatchEvent(new CustomEvent('wardrobeUpdated'));
      
    } catch (error: any) {
      console.error('Error updating item:', error);
      setError(error.message || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setError('');

    try {
      // Delete from database
      const { error: deleteError } = await supabase
        .from('clothing_items')
        .delete()
        .eq('id', item.id);

      if (deleteError) {
        throw new Error(`Delete failed: ${deleteError.message}`);
      }

      // Delete image from storage
      if (item.image_url && user) {
        try {
          const urlParts = item.image_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await supabase.storage
            .from('clothing-images')
            .remove([`${user.id}/${fileName}`]);
        } catch (storageError) {
          console.warn('Failed to delete image from storage:', storageError);
        }
      }

      setShowDeleteConfirm(false);
      onClose();
      onUpdate?.();
      window.dispatchEvent(new CustomEvent('wardrobeUpdated'));
      
    } catch (error: any) {
      console.error('Error deleting item:', error);
      setError(error.message || 'Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImageFile(null);
    setImagePreview(null);
    setError('');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              {getCategoryIcon(item.category)}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {isEditing ? 'Edit Item' : item.category}
                </h2>
                <p className="text-gray-600 capitalize">{item.color}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit item"
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading || deleting}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
              <button
                onClick={isEditing ? handleCancel : onClose}
                disabled={loading || deleting}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="max-h-[calc(90vh-140px)] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
              {/* Image Section */}
              <div className="space-y-4">
                <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden shadow-inner relative">
                  <img
                    src={imagePreview || item.image_url}
                    alt={`${item.category} - ${item.color}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMjAwTDIwMCAyMDBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iNCIvPgo8dGV4dCB4PSIyMDAiIHk9IjIxMCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPgo=';
                    }}
                  />
                  
                  {/* Change Image Button (Edit Mode) */}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label htmlFor="edit-image-upload" className="cursor-pointer bg-white/90 backdrop-blur-sm rounded-full p-4 hover:bg-white transition-colors">
                        <Upload className="h-6 w-6 text-gray-700" />
                        <input
                          id="edit-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
                
                {/* Image Info */}
                {!isEditing && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-medium text-gray-800 mb-2">Image Details</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Added:</strong> {new Date(item.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="space-y-6">
                {isEditing ? (
                  /* Edit Form */
                  <div className="space-y-6">
                    {/* Category & Warmth */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          value={editData.category}
                          onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        >
                          {categories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Warmth Level *
                        </label>
                        <select
                          value={editData.warmth_level}
                          onChange={(e) => setEditData(prev => ({ ...prev, warmth_level: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        >
                          {warmthLevels.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color *
                      </label>
                      <input
                        type="text"
                        value={editData.color}
                        onChange={(e) => setEditData(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="e.g., Navy Blue, Dark Gray"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {commonColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditData(prev => ({ ...prev, color }))}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 transition-colors"
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      
                      {/* Current Tags */}
                      {editData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {editData.tags.map((tag) => (
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

                      {/* Add Tag */}
                      <div className="flex space-x-2 mb-3">
                        <input
                          type="text"
                          value={editData.newTag}
                          onChange={(e) => setEditData(prev => ({ ...prev, newTag: e.target.value }))}
                          placeholder="Add tag"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag(editData.newTag);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => addTag(editData.newTag)}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Common Tags */}
                      <div className="flex flex-wrap gap-2">
                        {commonTags.filter(tag => !editData.tags.includes(tag)).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    {/* Basic Info */}
                    <div className="bg-gradient-to-r from-purple-50 to-teal-50 rounded-xl p-6 border border-purple-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Item Details</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium text-gray-800 capitalize bg-white px-3 py-1 rounded-full">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Color:</span>
                          <span className="font-medium text-gray-800 capitalize bg-white px-3 py-1 rounded-full">
                            {item.color}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center">
                            <Thermometer className="h-4 w-4 mr-1" />
                            Warmth Level:
                          </span>
                          <span className={`font-medium px-3 py-1 rounded-full border ${getWarmthColor(item.warmth_level)}`}>
                            {item.warmth_level.charAt(0).toUpperCase() + item.warmth_level.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Tag className="h-5 w-5 mr-2 text-purple-600" />
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium border border-purple-200 hover:bg-purple-200 transition-colors"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-teal-600" />
                        Timeline
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-gray-600">Added to wardrobe:</span>
                          <span className="font-medium text-gray-800">
                            {new Date(item.created_at).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-gray-600">Time:</span>
                          <span className="font-medium text-gray-800">
                            {new Date(item.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-6 bg-white sticky bottom-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {isEditing ? 'Make your changes and save' : 'Click outside or press ESC to close'}
              </div>
              <div className="flex items-center space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-4 py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading || !editData.color.trim()}
                      className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Clothing Item"
        message="Are you sure you want to delete this clothing item from your wardrobe?"
        itemName={`${item.category} - ${item.color}`}
        loading={deleting}
      />
    </>
  );
}