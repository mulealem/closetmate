import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, analyzeClothingImage } from '../lib/supabase';
import { Upload, X, Sparkles, Check, AlertCircle, Camera, Loader } from 'lucide-react';

interface AIClothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AIClothingModal({ isOpen, onClose, onSuccess }: AIClothingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setError('');
    setAnalysisResult(null);
    setEditMode(false);
    setAnalyzing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      // Check file type
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

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError('');
  };

  const analyzeImage = async () => {
    if (!imageFile) return;

    setAnalyzing(true);
    setError('');

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = (e.target?.result as string).split(',')[1];
          
          // Call AI analysis
          const result = await analyzeClothingImage(base64Data);
          
          if (result.success) {
            setAnalysisResult(result.analysis);
            setEditMode(true);
          } else {
            throw new Error(result.error || 'Analysis failed');
          }
        } catch (error: any) {
          console.error('Analysis error:', error);
          setError(error.message || 'Failed to analyze image. Please try again.');
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (error: any) {
      console.error('Error preparing image for analysis:', error);
      setError('Failed to process image');
      setAnalyzing(false);
    }
  };

  const saveClothingItem = async () => {
    if (!user || !imageFile || !analysisResult) return;

    setLoading(true);
    setError('');

    try {
      // Upload image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clothing-images')
        .upload(fileName, imageFile, {
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
      
      // Save clothing item to database with AI analysis
      const { error: dbError } = await supabase
        .from('clothing_items')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          category: analysisResult.category,
          color: analysisResult.color,
          warmth_level: analysisResult.warmth_level,
          tags: analysisResult.tags || [],
          occasion: analysisResult.occasion || [],
          weather_suitability: analysisResult.weather_suitability || [],
          style_aesthetic: analysisResult.style_aesthetic || [],
          material_fabric: analysisResult.material_fabric,
          season: analysisResult.season || [],
          fit_shape: analysisResult.fit_shape,
          pattern_design: analysisResult.pattern_design,
          length: analysisResult.length,
          sleeve_type: analysisResult.sleeve_type,
          neckline: analysisResult.neckline,
          comfort_level: analysisResult.comfort_level,
          care_requirements: analysisResult.care_requirements,
          ai_analyzed: true,
          ai_confidence: analysisResult.ai_confidence
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // If database insert fails, clean up the uploaded image
        await supabase.storage
          .from('clothing-images')
          .remove([fileName]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Success - reset form and close modal
      resetForm();
      onSuccess();
      
    } catch (error: any) {
      console.error('Error saving clothing item:', error);
      setError(error.message || 'Failed to save clothing item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !analyzing) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-teal-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Clothing Analysis</h2>
              <p className="text-gray-600">Upload an image and let AI identify your clothing</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading || analyzing}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {!analysisResult ? (
            /* Image Upload Section */
            <div className="space-y-6">
              {/* Upload Area */}
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12">
                  <div className="text-center">
                    <div className="flex justify-center space-x-4 mb-6">
                      <Camera className="h-12 w-12 text-gray-400" />
                      <Upload className="h-12 w-12 text-gray-400" />
                    </div>
                    <label htmlFor="ai-image-upload" className="cursor-pointer">
                      <span className="text-xl font-medium text-gray-700 block mb-2">
                        Upload a photo of your clothing
                      </span>
                      <p className="text-gray-500 mb-4">
                        Take a photo wearing the item or just the clothing by itself
                      </p>
                      <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-teal-700 transition-all">
                        <Upload className="h-5 w-5 mr-2" />
                        Choose Image
                      </div>
                    </label>
                    <input
                      id="ai-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-400 mt-4">
                      Supports JPG, PNG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              ) : (
                /* Image Preview & Analysis */
                <div className="space-y-6">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-96 object-contain rounded-2xl bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={analyzing}
                      className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Analysis Button */}
                  <div className="text-center">
                    <button
                      onClick={analyzeImage}
                      disabled={analyzing}
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
                    >
                      {analyzing ? (
                        <>
                          <Loader className="h-5 w-5 mr-3 animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-3" />
                          Analyze with AI
                        </>
                      )}
                    </button>
                    <p className="text-sm text-gray-500 mt-3">
                      Our AI will identify the clothing type, color, style, and more
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Analysis Results */
            <div className="space-y-6">
              {/* Confidence Score */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Analysis Complete! Confidence: {Math.round((analysisResult.ai_confidence || 0.8) * 100)}%
                  </span>
                </div>
              </div>

              {/* Analysis Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Properties */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Basic Properties</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <div className="px-3 py-2 bg-gray-50 rounded-lg capitalize font-medium">
                        {analysisResult.category}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <div className="px-3 py-2 bg-gray-50 rounded-lg font-medium">
                        {analysisResult.color}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warmth Level</label>
                      <div className="px-3 py-2 bg-gray-50 rounded-lg capitalize font-medium">
                        {analysisResult.warmth_level}
                      </div>
                    </div>

                    {analysisResult.material_fabric && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                        <div className="px-3 py-2 bg-gray-50 rounded-lg font-medium">
                          {analysisResult.material_fabric}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Extended Properties */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Style & Details</h3>
                  
                  <div className="space-y-3">
                    {analysisResult.occasion && analysisResult.occasion.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Occasions</label>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.occasion.map((item: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.style_aesthetic && analysisResult.style_aesthetic.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.style_aesthetic.map((item: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.season && analysisResult.season.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Seasons</label>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.season.map((item: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.tags && analysisResult.tags.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.tags.map((tag: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    setAnalysisResult(null);
                    setEditMode(false);
                  }}
                  disabled={loading}
                  className="px-6 py-3 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Analyze Different Image
                </button>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="px-6 py-3 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveClothingItem}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}