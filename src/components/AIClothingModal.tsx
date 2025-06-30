import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, analyzeClothingImage } from '../lib/supabase';
import { Upload, X, Sparkles, Check, AlertCircle, Camera, Loader, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

interface AIClothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  analysis?: any;
  status: 'pending' | 'analyzing' | 'analyzed' | 'error';
  error?: string;
}

export default function AIClothingModal({ isOpen, onClose, onSuccess }: AIClothingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [error, setError] = useState<string>('');
  const [currentAnalyzing, setCurrentAnalyzing] = useState<string | null>(null);
  const [allAnalyzed, setAllAnalyzed] = useState(false);

  const resetForm = () => {
    setImageFiles([]);
    setError('');
    setCurrentAnalyzing(null);
    setAllAnalyzed(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check total number of images (limit to 15)
    if (imageFiles.length + files.length > 15) {
      setError('You can upload a maximum of 15 images at once');
      return;
    }

    const newImageFiles: ImageFile[] = [];

    files.forEach((file) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError(`File "${file.name}" is not an image file.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageFile: ImageFile = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: e.target?.result as string,
          status: 'pending'
        };
        
        setImageFiles(prev => [...prev, imageFile]);
      };
      reader.readAsDataURL(file);
    });

    setError('');
    // Clear the input so the same files can be selected again if needed
    e.target.value = '';
  };

  const removeImage = (imageId: string) => {
    setImageFiles(prev => prev.filter(img => img.id !== imageId));
    setError('');
  };

  const analyzeAllImages = async () => {
    if (imageFiles.length === 0) return;

    setLoading(true);
    setError('');
    setAllAnalyzed(false);

    try {
      // Process images one by one
      for (const imageFile of imageFiles) {
        if (imageFile.status === 'analyzed') continue; // Skip already analyzed images

        setCurrentAnalyzing(imageFile.id);
        
        // Update status to analyzing
        setImageFiles(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { ...img, status: 'analyzing' as const }
            : img
        ));

        try {
          // Convert image to base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = (e) => {
              const base64Data = (e.target?.result as string).split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageFile.file);
          });

          const base64Data = await base64Promise;
          
          // Call AI analysis
          const result = await analyzeClothingImage(base64Data);
          
          if (result.success) {
            // Update with analysis result
            setImageFiles(prev => prev.map(img => 
              img.id === imageFile.id 
                ? { 
                    ...img, 
                    status: 'analyzed' as const, 
                    analysis: result.analysis 
                  }
                : img
            ));
          } else {
            throw new Error(result.error || 'Analysis failed');
          }
        } catch (error: any) {
          console.error(`Analysis error for image ${imageFile.id}:`, error);
          
          // Update with error
          setImageFiles(prev => prev.map(img => 
            img.id === imageFile.id 
              ? { 
                    ...img, 
                    status: 'error' as const, 
                    error: error.message || 'Analysis failed' 
                  }
                : img
          ));
        }

        // Small delay between analyses to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setCurrentAnalyzing(null);
      setAllAnalyzed(true);
      
    } catch (error: any) {
      console.error('Error during batch analysis:', error);
      setError(error.message || 'Failed to analyze images');
      setCurrentAnalyzing(null);
    } finally {
      setLoading(false);
    }
  };

  const saveAllAnalyzedItems = async () => {
    if (!user) return;

    const analyzedImages = imageFiles.filter(img => img.status === 'analyzed' && img.analysis);
    
    if (analyzedImages.length === 0) {
      setError('No successfully analyzed images to save');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let savedCount = 0;

      for (const imageFile of analyzedImages) {
        try {
          // Upload image to Supabase Storage
          const fileExt = imageFile.file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('clothing-images')
            .upload(fileName, imageFile.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('clothing-images')
            .getPublicUrl(fileName);

          if (!publicUrl) {
            throw new Error('Failed to get image URL');
          }
          
          // Save clothing item to database with comprehensive AI analysis
          const { error: dbError } = await supabase
            .from('clothing_items')
            .insert({
              user_id: user.id,
              image_url: publicUrl,
              category: imageFile.analysis.category,
              color: imageFile.analysis.color,
              warmth_level: imageFile.analysis.warmth_level,
              tags: imageFile.analysis.tags || [],
              
              // Extended properties
              occasion: imageFile.analysis.occasion || [],
              weather_suitability: imageFile.analysis.weather_suitability || [],
              style_aesthetic: imageFile.analysis.style_aesthetic || [],
              material_fabric: imageFile.analysis.material_fabric,
              season: imageFile.analysis.season || [],
              fit_shape: imageFile.analysis.fit_shape,
              pattern_design: imageFile.analysis.pattern_design,
              length: imageFile.analysis.length,
              sleeve_type: imageFile.analysis.sleeve_type,
              neckline: imageFile.analysis.neckline,
              comfort_level: imageFile.analysis.comfort_level,
              care_requirements: imageFile.analysis.care_requirements,
              
              // Enhanced properties
              brand: imageFile.analysis.brand,
              price_range: imageFile.analysis.price_range,
              formality_level: imageFile.analysis.formality_level,
              versatility_score: imageFile.analysis.versatility_score,
              condition_status: imageFile.analysis.condition_status,
              body_fit: imageFile.analysis.body_fit,
              transparency_level: imageFile.analysis.transparency_level,
              texture: imageFile.analysis.texture,
              weight: imageFile.analysis.weight,
              stretch: imageFile.analysis.stretch,
              breathability: imageFile.analysis.breathability,
              water_resistance: imageFile.analysis.water_resistance,
              special_features: imageFile.analysis.special_features || [],
              color_intensity: imageFile.analysis.color_intensity,
              pattern_scale: imageFile.analysis.pattern_scale,
              layering_position: imageFile.analysis.layering_position,
              maintenance_level: imageFile.analysis.maintenance_level,
              sustainability_rating: imageFile.analysis.sustainability_rating,
              emotional_association: imageFile.analysis.emotional_association || [],
              compliment_frequency: imageFile.analysis.compliment_frequency,
              outfit_role: imageFile.analysis.outfit_role,
              weather_protection: imageFile.analysis.weather_protection || [],
              activity_suitability: imageFile.analysis.activity_suitability || [],
              
              // AI tracking
              ai_analyzed: true,
              ai_confidence: imageFile.analysis.ai_confidence || imageFile.analysis.confidence
            });

          if (dbError) {
            console.error('Database error:', dbError);
            // If database insert fails, clean up the uploaded image
            await supabase.storage
              .from('clothing-images')
              .remove([fileName]);
            throw new Error(`Database error: ${dbError.message}`);
          }

          savedCount++;
        } catch (error: any) {
          console.error(`Error saving item from image ${imageFile.id}:`, error);
          // Continue with other images even if one fails
        }
      }

      if (savedCount > 0) {
        // Success - reset form and close modal
        resetForm();
        onSuccess();
      } else {
        throw new Error('Failed to save any items');
      }
      
    } catch (error: any) {
      console.error('Error saving clothing items:', error);
      setError(error.message || 'Failed to save some clothing items');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const getStatusIcon = (status: ImageFile['status']) => {
    switch (status) {
      case 'pending':
        return <ImageIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />;
      case 'analyzing':
        return <Loader className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />;
      case 'analyzed':
        return <Check className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }
  };

  const getStatusColor = (status: ImageFile['status']) => {
    switch (status) {
      case 'pending':
        return 'border-gray-200 dark:border-gray-600';
      case 'analyzing':
        return 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'analyzed':
        return 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20';
    }
  };

  if (!isOpen) return null;

  const analyzedCount = imageFiles.filter(img => img.status === 'analyzed').length;
  const errorCount = imageFiles.filter(img => img.status === 'error').length;
  const pendingCount = imageFiles.filter(img => img.status === 'pending').length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-teal-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Clothing Analysis</h2>
              <p className="text-gray-600 dark:text-gray-400">Upload multiple images and let AI identify your clothing with enhanced properties</p>
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

          {imageFiles.length === 0 ? (
            /* Upload Area */
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 dark:bg-gray-700/50">
              <div className="text-center">
                <div className="flex justify-center space-x-4 mb-6">
                  <Camera className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <label htmlFor="ai-image-upload" className="cursor-pointer">
                  <span className="text-xl font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Upload photos of your clothing
                  </span>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Select multiple images to analyze them all at once (up to 15 images)
                  </p>
                  <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-teal-700 transition-all">
                    <Upload className="h-5 w-5 mr-2" />
                    Choose Images
                  </div>
                </label>
                <input
                  id="ai-image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                  Supports JPG, PNG, GIF up to 10MB each
                </p>
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">✨ Enhanced AI Analysis</h4>
                  <p className="text-blue-700 dark:text-blue-400 text-sm">
                    Our AI now analyzes 40+ properties including formality level, versatility score, 
                    texture, breathability, and emotional associations for superior outfit recommendations!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Images Grid & Analysis */
            <div className="space-y-6">
              {/* Status Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Total: </span>
                      <span className="text-gray-600 dark:text-gray-400">{imageFiles.length}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-green-700 dark:text-green-400">Analyzed: </span>
                      <span className="text-green-600 dark:text-green-400">{analyzedCount}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Pending: </span>
                      <span className="text-gray-600 dark:text-gray-400">{pendingCount}</span>
                    </div>
                    {errorCount > 0 && (
                      <div className="text-sm">
                        <span className="font-medium text-red-700 dark:text-red-400">Errors: </span>
                        <span className="text-red-600 dark:text-red-400">{errorCount}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <label htmlFor="add-more-images" className="cursor-pointer px-3 py-2 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Add More</span>
                      <input
                        id="add-more-images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Images Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {imageFiles.map((imageFile) => (
                  <div
                    key={imageFile.id}
                    className={`relative rounded-lg border-2 overflow-hidden ${getStatusColor(imageFile.status)} ${
                      currentAnalyzing === imageFile.id ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''
                    }`}
                  >
                    {/* Image */}
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700">
                      <img
                        src={imageFile.preview}
                        alt="Clothing item"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Status Overlay */}
                    <div className="absolute top-2 left-2">
                      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-1">
                        {getStatusIcon(imageFile.status)}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeImage(imageFile.id)}
                      disabled={loading}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white hover:bg-red-600 rounded-full transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>

                    {/* Analysis Result Preview */}
                    {imageFile.status === 'analyzed' && imageFile.analysis && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                        <p className="text-xs font-medium truncate">
                          {imageFile.analysis.category} - {imageFile.analysis.color}
                        </p>
                        {imageFile.analysis.formality_level && (
                          <p className="text-xs opacity-75 truncate">
                            {imageFile.analysis.formality_level}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {imageFile.status === 'error' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white p-2">
                        <p className="text-xs truncate">
                          {imageFile.error || 'Analysis failed'}
                        </p>
                      </div>
                    )}

                    {/* Analyzing Indicator */}
                    {imageFile.status === 'analyzing' && (
                      <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3">
                          <Loader className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {loading && currentAnalyzing && (
                    <span>Analyzing images with enhanced AI... Please wait.</span>
                  )}
                  {allAnalyzed && analyzedCount > 0 && (
                    <span>Analysis complete! Ready to save {analyzedCount} items with comprehensive properties.</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="px-6 py-3 text-gray-600 dark:text-gray-400 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  
                  {!allAnalyzed ? (
                    <button
                      onClick={analyzeAllImages}
                      disabled={loading || imageFiles.length === 0}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Analyze All Images</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={saveAllAnalyzedItems}
                      disabled={loading || analyzedCount === 0}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Save {analyzedCount} Items</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}