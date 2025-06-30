import type { ClothingItem } from './supabase';
import type { WeatherData } from './weather';

export interface OutfitSuggestion {
  items: ClothingItem[];
  score: number;
  reasoning: string;
}

export function generateOutfitSuggestions(
  clothingItems: ClothingItem[],
  weather: WeatherData | null,
  preferences?: { preferred_colors?: string[]; preferred_categories?: string[] }
): OutfitSuggestion[] {
  if (clothingItems.length === 0) {
    return [];
  }

  const temperature = weather?.temperature ?? 20;
  const condition = weather?.condition?.toLowerCase() ?? 'clear';
  const isRaining = condition.includes('rain') || condition.includes('drizzle');
  const isSnowing = condition.includes('snow');
  const isCold = temperature < 10;
  const isWarm = temperature > 25;

  // Determine warmth level needed
  let targetWarmth: ClothingItem['warmth_level'];
  if (temperature < 5) targetWarmth = 'heavy';
  else if (temperature < 15) targetWarmth = 'medium';
  else targetWarmth = 'light';

  // Group items by category
  const itemsByCategory = clothingItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ClothingItem[]>);

  // Sort items by enhanced scoring
  Object.keys(itemsByCategory).forEach(category => {
    itemsByCategory[category].sort((a, b) => {
      const aScore = calculateItemScore(a);
      const bScore = calculateItemScore(b);
      return bScore - aScore;
    });
  });

  const suggestions: OutfitSuggestion[] = [];

  // Generate outfit combinations
  const tops = itemsByCategory.top || [];
  const bottoms = itemsByCategory.bottom || [];
  const dresses = itemsByCategory.dress || [];
  const jackets = itemsByCategory.jacket || [];
  const outerwear = itemsByCategory.outerwear || [];
  const shoes = itemsByCategory.shoes || [];

  // Generate dress-based outfits
  for (const dress of dresses.slice(0, 2)) {
    const baseOutfit: ClothingItem[] = [dress];
    let score = 100;
    let reasoning = `Elegant dress-based outfit featuring a ${dress.color} ${dress.category}`;

    // Add shoes
    if (shoes.length > 0) {
      const compatibleShoes = shoes.filter(shoe => 
        isStyleCompatible(dress, shoe) && isFormalityCompatible(dress, shoe)
      );
      if (compatibleShoes.length > 0) {
        baseOutfit.push(compatibleShoes[0]);
        score += 15;
        reasoning += '. Paired with complementary footwear';
      }
    }

    // Add outerwear if needed
    if (isCold || isRaining) {
      const suitableOuterwear = [...jackets, ...outerwear].filter(item => {
        return isWeatherAppropriate(item, weather) && isFormalityCompatible(dress, item);
      });
      
      if (suitableOuterwear.length > 0) {
        baseOutfit.push(suitableOuterwear[0]);
        score += 20;
        reasoning += '. Added weather-appropriate outerwear';
      }
    }

    // Enhanced scoring
    score += calculateOutfitHarmony(baseOutfit);
    score += calculateWeatherScore(baseOutfit, weather);
    score += calculatePreferenceScore(baseOutfit, preferences);

    if (baseOutfit.length >= 2) {
      suggestions.push({
        items: baseOutfit,
        score: Math.max(score, 0),
        reasoning,
      });
    }
  }

  // Generate top + bottom combinations
  for (const top of tops.slice(0, 3)) {
    for (const bottom of bottoms.slice(0, 2)) {
      const baseOutfit: ClothingItem[] = [top, bottom];
      let score = 100;
      let reasoning = `Coordinated outfit with ${top.color} ${top.category} and ${bottom.color} ${bottom.category}`;

      // Check style compatibility
      if (!isStyleCompatible(top, bottom)) {
        score -= 25;
        reasoning += '. Style mixing may require careful coordination';
      }

      // Check formality compatibility
      if (!isFormalityCompatible(top, bottom)) {
        score -= 20;
        reasoning += '. Mixed formality levels';
      }

      // Add shoes
      if (shoes.length > 0) {
        const compatibleShoes = shoes.filter(shoe => 
          isFormalityCompatible(top, shoe) && isFormalityCompatible(bottom, shoe)
        );
        if (compatibleShoes.length > 0) {
          baseOutfit.push(compatibleShoes[0]);
          score += 15;
          reasoning += '. Completed with appropriate footwear';
        }
      }

      // Add outerwear if needed
      if (isCold || isRaining || isSnowing) {
        const suitableOuterwear = [...jackets, ...outerwear].filter(item => {
          return isWeatherAppropriate(item, weather) && 
                 isFormalityCompatible(top, item) && 
                 isLayeringCompatible(item, top);
        });
        
        if (suitableOuterwear.length > 0) {
          baseOutfit.push(suitableOuterwear[0]);
          score += 20;
          reasoning += '. Enhanced with weather protection';
        }
      }

      // Enhanced scoring
      score += calculateOutfitHarmony(baseOutfit);
      score += calculateWeatherScore(baseOutfit, weather);
      score += calculatePreferenceScore(baseOutfit, preferences);
      score += calculateVersatilityBonus(baseOutfit);

      if (baseOutfit.length >= 2) {
        suggestions.push({
          items: baseOutfit,
          score: Math.max(score, 0),
          reasoning,
        });
      }
    }
  }

  // Sort by score and return top suggestions
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// Enhanced helper functions

function calculateItemScore(item: ClothingItem): number {
  let score = 50; // Base score
  
  // Versatility bonus
  if (item.versatility_score) {
    score += item.versatility_score * 5;
  }
  
  // Condition bonus
  switch (item.condition_status) {
    case 'Excellent': score += 15; break;
    case 'Good': score += 10; break;
    case 'Fair': score += 5; break;
    default: break;
  }
  
  // Compliment frequency bonus
  switch (item.compliment_frequency) {
    case 'Always': score += 20; break;
    case 'Often': score += 15; break;
    case 'Sometimes': score += 10; break;
    default: break;
  }
  
  return score;
}

function calculateOutfitHarmony(items: ClothingItem[]): number {
  let harmony = 0;
  
  // Color harmony
  const colors = items.map(item => item.color_intensity || 'Medium');
  const intensities = [...new Set(colors)];
  if (intensities.length <= 2) harmony += 10; // Good color balance
  
  // Texture balance
  const textures = items.map(item => item.texture).filter(Boolean);
  const uniqueTextures = [...new Set(textures)];
  if (uniqueTextures.length >= 2 && uniqueTextures.length <= 3) harmony += 8;
  
  // Pattern coordination
  const patterns = items.map(item => item.pattern_design).filter(Boolean);
  const solidCount = patterns.filter(p => p === 'Solid').length;
  if (solidCount >= items.length - 1) harmony += 12; // Mostly solids with max 1 pattern
  
  return harmony;
}

function calculateWeatherScore(items: ClothingItem[], weather: WeatherData | null): number {
  if (!weather) return 0;
  
  let score = 0;
  const temperature = weather.temperature;
  const condition = weather.condition.toLowerCase();
  
  // Temperature appropriateness
  const avgWarmth = items.reduce((sum, item) => {
    return sum + getWarmthScore(item.warmth_level);
  }, 0) / items.length;
  
  const targetWarmth = temperature < 5 ? 3 : temperature < 15 ? 2 : 1;
  const warmthDiff = Math.abs(avgWarmth - targetWarmth);
  score += Math.max(0, 15 - warmthDiff * 5);
  
  // Weather protection
  if (condition.includes('rain') || condition.includes('snow')) {
    const hasProtection = items.some(item => 
      item.water_resistance && item.water_resistance !== 'None'
    );
    if (hasProtection) score += 15;
  }
  
  // Breathability for hot weather
  if (temperature > 25) {
    const breathableItems = items.filter(item => 
      item.breathability === 'Very Breathable' || item.breathability === 'Breathable'
    );
    score += breathableItems.length * 5;
  }
  
  return score;
}

function calculatePreferenceScore(items: ClothingItem[], preferences?: any): number {
  if (!preferences) return 0;
  
  let score = 0;
  
  // Color preferences
  if (preferences.preferred_colors) {
    const preferredColors = preferences.preferred_colors.map((c: string) => c.toLowerCase());
    const matchingColors = items.filter(item => 
      preferredColors.some(preferred => item.color.toLowerCase().includes(preferred))
    );
    score += matchingColors.length * 8;
  }
  
  // Category preferences
  if (preferences.preferred_categories) {
    const matchingCategories = items.filter(item => 
      preferences.preferred_categories.includes(item.category)
    );
    score += matchingCategories.length * 5;
  }
  
  return score;
}

function calculateVersatilityBonus(items: ClothingItem[]): number {
  const avgVersatility = items.reduce((sum, item) => {
    return sum + (item.versatility_score || 5);
  }, 0) / items.length;
  
  return Math.round((avgVersatility - 5) * 2); // Bonus/penalty based on versatility
}

function isStyleCompatible(item1: ClothingItem, item2: ClothingItem): boolean {
  const style1 = item1.style_aesthetic || [];
  const style2 = item2.style_aesthetic || [];
  
  // If no style info, assume compatible
  if (style1.length === 0 || style2.length === 0) return true;
  
  // Check for overlapping styles
  const overlap = style1.some(style => style2.includes(style));
  if (overlap) return true;
  
  // Check for compatible style combinations
  const compatiblePairs = [
    ['Classic', 'Minimalist'],
    ['Chic', 'Modern'],
    ['Casual', 'Streetwear'],
    ['Elegant', 'Sophisticated'],
    ['Trendy', 'Modern']
  ];
  
  return compatiblePairs.some(([s1, s2]) => 
    (style1.includes(s1) && style2.includes(s2)) ||
    (style1.includes(s2) && style2.includes(s1))
  );
}

function isFormalityCompatible(item1: ClothingItem, item2: ClothingItem): boolean {
  const formality1 = item1.formality_level || 'Casual';
  const formality2 = item2.formality_level || 'Casual';
  
  const formalityLevels = ['Very Casual', 'Casual', 'Smart Casual', 'Business Casual', 'Formal', 'Black Tie'];
  const index1 = formalityLevels.indexOf(formality1);
  const index2 = formalityLevels.indexOf(formality2);
  
  // Allow items within 1 level of each other
  return Math.abs(index1 - index2) <= 1;
}

function isWeatherAppropriate(item: ClothingItem, weather: WeatherData | null): boolean {
  if (!weather) return true;
  
  const temperature = weather.temperature;
  const condition = weather.condition.toLowerCase();
  
  // Check warmth appropriateness
  if (temperature < 5 && item.warmth_level === 'light') return false;
  if (temperature > 25 && item.warmth_level === 'heavy') return false;
  
  // Check weather protection
  if (condition.includes('rain') && item.water_resistance === 'None') {
    return item.category !== 'outerwear' && item.category !== 'jacket';
  }
  
  return true;
}

function isLayeringCompatible(outer: ClothingItem, inner: ClothingItem): boolean {
  const outerPos = outer.layering_position || 'Outer Layer';
  const innerPos = inner.layering_position || 'Mid Layer';
  
  const layerOrder = ['Base Layer', 'Mid Layer', 'Outer Layer', 'Statement Piece'];
  const outerIndex = layerOrder.indexOf(outerPos);
  const innerIndex = layerOrder.indexOf(innerPos);
  
  return outerIndex > innerIndex;
}

function getWarmthScore(warmth: ClothingItem['warmth_level']): number {
  switch (warmth) {
    case 'light': return 1;
    case 'medium': return 2;
    case 'heavy': return 3;
    default: return 1;
  }
}