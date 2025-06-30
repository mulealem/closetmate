import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type ClothingItem = {
  id: string;
  user_id: string;
  image_url: string;
  category: 'top' | 'bottom' | 'jacket' | 'shoes' | 'accessory' | 'dress' | 'outerwear';
  color: string;
  warmth_level: 'light' | 'medium' | 'heavy';
  tags: string[];
  created_at: string;
  
  // Extended properties
  occasion?: string[];
  weather_suitability?: string[];
  style_aesthetic?: string[];
  material_fabric?: string;
  season?: string[];
  fit_shape?: string;
  pattern_design?: string;
  length?: string;
  sleeve_type?: string;
  neckline?: string;
  comfort_level?: string;
  care_requirements?: string;
  ai_analyzed?: boolean;
  ai_confidence?: number;

  // Enhanced properties for better recommendations
  brand?: string;
  price_range?: string;
  formality_level?: string;
  versatility_score?: number;
  condition_status?: string;
  purchase_date?: string;
  last_worn?: string;
  wear_frequency?: string;
  body_fit?: string;
  transparency_level?: string;
  texture?: string;
  weight?: string;
  stretch?: string;
  breathability?: string;
  water_resistance?: string;
  special_features?: string[];
  color_intensity?: string;
  pattern_scale?: string;
  layering_position?: string;
  maintenance_level?: string;
  sustainability_rating?: string;
  emotional_association?: string[];
  compliment_frequency?: string;
  outfit_role?: string;
  weather_protection?: string[];
  activity_suitability?: string[];
};

export type Outfit = {
  id: string;
  user_id: string;
  name?: string;
  clothing_items: string[];
  weather_condition?: string;
  temperature?: number;
  rating?: number;
  is_favorite: boolean;
  created_at: string;
};

export type UserPreferences = {
  id: string;
  user_id: string;
  preferred_colors: string[];
  preferred_categories: string[];
  style_preferences: Record<string, any>;
  city?: string;
  updated_at: string;
};

// AI Analysis function
export async function analyzeClothingImage(imageBase64: string): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-clothing`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64 }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to analyze image');
  }

  return await response.json();
}

// AI Outfit Generation function
export async function generateAIOutfitSuggestions(request: {
  occasion: string;
  weather?: {
    temperature: number;
    condition: string;
    city: string;
  };
  preferences?: {
    style?: string[];
    colors?: string[];
    comfort_level?: string;
  };
  additional_notes?: string;
}): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-outfit-suggestions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate outfit suggestions');
  }

  return await response.json();
}