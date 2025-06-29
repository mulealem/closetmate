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

  const suggestions: OutfitSuggestion[] = [];

  // Generate outfit combinations
  const tops = itemsByCategory.top || [];
  const bottoms = itemsByCategory.bottom || [];
  const jackets = itemsByCategory.jacket || [];
  const outerwear = itemsByCategory.outerwear || [];
  const shoes = itemsByCategory.shoes || [];

  // Basic outfit structure: top + bottom + shoes
  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        const baseOutfit: ClothingItem[] = [top, bottom, shoe];
        let score = 100;
        let reasoning = 'Complete outfit with top, bottom, and shoes';

        // Weather appropriateness scoring
        const outfitWarmth = Math.max(
          getWarmthScore(top.warmth_level),
          getWarmthScore(bottom.warmth_level)
        );
        const targetWarmthScore = getWarmthScore(targetWarmth);

        if (Math.abs(outfitWarmth - targetWarmthScore) > 1) {
          score -= 30;
          reasoning += '. May not be suitable for current temperature';
        }

        // Add jacket/outerwear if cold or rainy
        if (isCold || isRaining || isSnowing) {
          const availableOuterwear = [...jackets, ...outerwear];
          const suitableOuterwear = availableOuterwear.filter(item => {
            if (isRaining && item.tags.includes('waterproof')) return true;
            if (isCold && (item.warmth_level === 'heavy' || item.warmth_level === 'medium')) return true;
            return item.warmth_level === targetWarmth;
          });

          if (suitableOuterwear.length > 0) {
            baseOutfit.push(suitableOuterwear[0]);
            score += 20;
            reasoning += '. Added appropriate outerwear for weather';
          } else if (isCold) {
            score -= 20;
            reasoning += '. Could use warmer layers';
          }
        }

        // Color coordination bonus
        if (colorsMatch(top.color, bottom.color)) {
          score += 15;
          reasoning += '. Good color coordination';
        }

        // Preference bonuses
        if (preferences?.preferred_colors) {
          const outfitColors = baseOutfit.map(item => item.color.toLowerCase());
          const preferredColors = preferences.preferred_colors.map(c => c.toLowerCase());
          const colorMatches = outfitColors.filter(color => 
            preferredColors.some(preferred => color.includes(preferred))
          );
          if (colorMatches.length > 0) {
            score += 10 * colorMatches.length;
            reasoning += '. Matches your color preferences';
          }
        }

        // Ensure minimum score
        score = Math.max(score, 0);

        suggestions.push({
          items: baseOutfit,
          score,
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

function getWarmthScore(warmth: ClothingItem['warmth_level']): number {
  switch (warmth) {
    case 'light': return 1;
    case 'medium': return 2;
    case 'heavy': return 3;
    default: return 1;
  }
}

function colorsMatch(color1: string, color2: string): boolean {
  const neutralColors = ['black', 'white', 'gray', 'grey', 'beige', 'brown', 'navy'];
  const c1 = color1.toLowerCase();
  const c2 = color2.toLowerCase();
  
  // Neutrals go with everything
  if (neutralColors.includes(c1) || neutralColors.includes(c2)) return true;
  
  // Same color family
  if (c1 === c2) return true;
  
  // Basic color matching rules
  const colorPairs = [
    ['blue', 'white'], ['blue', 'black'], ['blue', 'gray'],
    ['red', 'black'], ['red', 'white'], ['red', 'gray'],
    ['green', 'brown'], ['green', 'beige'], ['green', 'white'],
    ['yellow', 'blue'], ['yellow', 'brown'], ['yellow', 'white'],
    ['purple', 'black'], ['purple', 'white'], ['purple', 'gray'],
  ];
  
  return colorPairs.some(([color1, color2]) => 
    (c1.includes(color1) && c2.includes(color2)) ||
    (c1.includes(color2) && c2.includes(color1))
  );
}