import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, type ClothingItem, type Outfit, type UserPreferences } from '../lib/supabase';
import { getWeatherByCity, getWeatherByCoords, getCurrentLocation, type WeatherData } from '../lib/weather';
import { generateOutfitSuggestions, type OutfitSuggestion } from '../lib/outfitGenerator';
import WeatherCard from '../components/WeatherCard';
import OutfitCard from '../components/OutfitCard';
import OutfitGeneratorModal from '../components/OutfitGeneratorModal';
import { MapPin, Sparkles, Clock, TrendingUp, Plus, Navigation, Camera, Wand2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [outfitSuggestions, setOutfitSuggestions] = useState<OutfitSuggestion[]>([]);
  const [recentOutfits, setRecentOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [city, setCity] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isOutfitGeneratorOpen, setIsOutfitGeneratorOpen] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('🏠 Dashboard: Loading data for user:', user.id);
      loadData();
    }
  }, [user]);

  // Listen for wardrobe updates
  useEffect(() => {
    const handleWardrobeUpdate = () => {
      console.log('🔄 Dashboard: Wardrobe update event received');
      loadData();
    };

    window.addEventListener('wardrobeUpdated', handleWardrobeUpdate);
    return () => window.removeEventListener('wardrobeUpdated', handleWardrobeUpdate);
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      console.log('📊 Dashboard: Loading all data...');
      
      // Load clothing items
      const { data: items, error: itemsError } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error('❌ Dashboard: Error loading clothing items:', itemsError);
      } else {
        console.log(`✅ Dashboard: Loaded ${items?.length || 0} clothing items`);
        setClothingItems(items || []);
      }

      // Load preferences
      const { data: prefs, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefsError) {
        console.error('❌ Dashboard: Error loading preferences:', prefsError);
      } else {
        console.log('✅ Dashboard: Loaded preferences');
        setPreferences(prefs);
        if (prefs?.city) {
          setCity(prefs.city);
          // Load weather for saved city
          loadWeatherForCity(prefs.city);
        } else {
          // Try to get user's current location
          loadCurrentLocationWeather();
        }
      }

      // Load recent outfits
      const { data: outfits, error: outfitsError } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (outfitsError) {
        console.error('❌ Dashboard: Error loading outfits:', outfitsError);
      } else {
        console.log(`✅ Dashboard: Loaded ${outfits?.length || 0} recent outfits`);
        setRecentOutfits(outfits || []);
      }
    } catch (error) {
      console.error('💥 Dashboard: Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentLocationWeather = async () => {
    setWeatherLoading(true);
    setLocationError('');
    
    try {
      console.log('📍 Getting current location...');
      const coords = await getCurrentLocation();
      console.log('✅ Got coordinates:', coords);
      
      // Get weather data directly with coordinates
      const weatherData = await getWeatherByCoords(coords.latitude, coords.longitude, 'Current Location');
      
      if (weatherData) {
        setWeather(weatherData);
        setCity('Current Location');
        console.log('🌤️ Weather loaded for current location');
      } else {
        throw new Error('Failed to get weather data');
      }
    } catch (error: any) {
      console.error('❌ Error getting current location weather:', error);
      setLocationError(error.message || 'Failed to get current location');
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadWeatherForCity = async (cityName: string) => {
    setWeatherLoading(true);
    setLocationError('');
    
    try {
      const weatherData = await getWeatherByCity(cityName);
      if (weatherData) {
        setWeather(weatherData);
        console.log('🌤️ Weather loaded for city:', cityName);
      } else {
        throw new Error('City not found or weather data unavailable');
      }
    } catch (error: any) {
      console.error('❌ Error loading weather for city:', error);
      setLocationError(error.message || 'Failed to get weather data');
    } finally {
      setWeatherLoading(false);
    }
  };

  const updateCityWeather = async () => {
    if (!city.trim()) return;

    await loadWeatherForCity(city.trim());
    
    if (weather && user) {
      // Save city to preferences
      try {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            city: city.trim(),
            preferred_colors: preferences?.preferred_colors || [],
            preferred_categories: preferences?.preferred_categories || [],
            style_preferences: preferences?.style_preferences || {},
          });
        console.log('💾 City saved to preferences');
      } catch (error) {
        console.error('❌ Error saving city to preferences:', error);
      }
    }
  };

  useEffect(() => {
    if (clothingItems.length > 0) {
      const suggestions = generateOutfitSuggestions(clothingItems, weather, preferences);
      setOutfitSuggestions(suggestions);
    }
  }, [clothingItems, weather, preferences]);

  const saveOutfit = async (suggestion: OutfitSuggestion) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('outfits')
        .insert({
          user_id: user.id,
          name: `Outfit for ${weather?.city || 'Today'}`,
          clothing_items: suggestion.items.map(item => item.id),
          weather_condition: weather?.condition,
          temperature: weather?.temperature,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh recent outfits
      loadData();
    } catch (error) {
      console.error('Error saving outfit:', error);
    }
  };

  const handleRateOutfit = async (outfitId: string, rating: number) => {
    try {
      await supabase
        .from('outfits')
        .update({ rating })
        .eq('id', outfitId);

      setRecentOutfits(prev => prev.map(outfit => 
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

      setRecentOutfits(prev => prev.map(outfit => 
        outfit.id === outfitId ? { ...outfit, is_favorite: isFavorite } : outfit
      ));
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Good morning! ✨
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Let's find the perfect outfit for today's weather.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Weather & Location */}
          <div className="space-y-4">
            {!weather && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-medium text-blue-800 dark:text-blue-300">Get Weather Information</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Current Location Button */}
                  <div>
                    <button
                      onClick={loadCurrentLocationWeather}
                      disabled={weatherLoading}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 dark:bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {weatherLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Getting location...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4" />
                          <span>Use Current Location</span>
                        </>
                      )}
                    </button>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 text-center">
                      We'll ask for permission to access your location
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center">
                    <div className="flex-1 border-t border-blue-200 dark:border-blue-700"></div>
                    <span className="px-3 text-sm text-blue-600 dark:text-blue-400">or</span>
                    <div className="flex-1 border-t border-blue-200 dark:border-blue-700"></div>
                  </div>

                  {/* Manual City Input */}
                  <div>
                    <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      Enter your city manually
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g., New York, London, Tokyo"
                        className="flex-1 px-3 py-2 border border-blue-200 dark:border-blue-700 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && updateCityWeather()}
                        disabled={weatherLoading}
                      />
                      <button
                        onClick={updateCityWeather}
                        disabled={weatherLoading || !city.trim()}
                        className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {weatherLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          'Get Weather'
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {locationError && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-sm">⚠️ {locationError}</p>
                  </div>
                )}
              </div>
            )}
            
            {weather && <WeatherCard weather={weather} />}
          </div>

          {/* AI Outfit Generator */}
          {clothingItems.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Wand2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Outfit Generator</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Get personalized outfit suggestions for any occasion using AI
                  </p>
                </div>
                <button
                  onClick={() => setIsOutfitGeneratorOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-teal-700 transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  <Sparkles className="h-4 w-4 mr-2 inline" />
                  Generate Outfits
                </button>
              </div>
            </div>
          )}

          {/* Outfit Suggestions */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Today's Suggestions</h2>
            </div>

            {clothingItems.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-12 text-center">
                <Sparkles className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  No clothing items yet
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  Add some clothes to your wardrobe to get personalized outfit suggestions!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openAIModal'))}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-teal-700 transition-all"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    AI Photo Analysis
                  </button>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openAddModal'))}
                    className="inline-flex items-center px-6 py-3 bg-gray-600 dark:bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Manual Entry
                  </button>
                </div>
              </div>
            ) : outfitSuggestions.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Add more clothing items to get better outfit suggestions!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {outfitSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="aspect-square bg-gray-50 dark:bg-gray-700 relative">
                      <div className="grid grid-cols-2 gap-1 p-2 h-full">
                        {suggestion.items.slice(0, 4).map((item, itemIndex) => (
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
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Score: {suggestion.score}%
                          </span>
                          <div className="flex items-center">
                            {[...Array(Math.ceil(suggestion.score / 20))].map((_, i) => (
                              <div key={i} className="w-1 h-1 bg-purple-600 dark:bg-purple-400 rounded-full mr-1"></div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{suggestion.reasoning}</p>
                      <button
                        onClick={() => saveOutfit(suggestion)}
                        className="w-full py-2 px-4 bg-purple-600 dark:bg-purple-700 text-white font-medium rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
                      >
                        Save Outfit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Your Wardrobe</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Items</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{clothingItems.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">AI Analyzed</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {clothingItems.filter(item => item.ai_analyzed).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Saved Outfits</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{recentOutfits.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Favorites</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {recentOutfits.filter(o => o.is_favorite).length}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Outfits */}
          {recentOutfits.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Recent Outfits</h3>
              </div>
              <div className="space-y-4">
                {recentOutfits.slice(0, 3).map((outfit) => (
                  <OutfitCard
                    key={outfit.id}
                    outfit={outfit}
                    clothingItems={clothingItems}
                    onRate={handleRateOutfit}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Outfit Generator Modal */}
      <OutfitGeneratorModal
        isOpen={isOutfitGeneratorOpen}
        onClose={() => setIsOutfitGeneratorOpen(false)}
        weather={weather}
      />
    </div>
  );
};

export default Dashboard;