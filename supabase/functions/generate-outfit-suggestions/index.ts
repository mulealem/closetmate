import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface OutfitRequest {
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
}

interface ClothingItem {
  id: string;
  category: string;
  color: string;
  warmth_level: string;
  tags: string[];
  occasion?: string[];
  weather_suitability?: string[];
  style_aesthetic?: string[];
  material_fabric?: string;
  season?: string[];
  fit_shape?: string;
  pattern_design?: string;
  comfort_level?: string;
  image_url: string;
  
  // Enhanced properties
  brand?: string;
  price_range?: string;
  formality_level?: string;
  versatility_score?: number;
  condition_status?: string;
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
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse the request body
    const outfitRequest: OutfitRequest = await req.json();
    
    if (!outfitRequest.occasion) {
      throw new Error('Occasion is required');
    }

    // Get user's clothing items
    const { data: clothingItems, error: itemsError } = await supabaseClient
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id);

    if (itemsError) {
      throw new Error(`Failed to fetch clothing items: ${itemsError.message}`);
    }

    if (!clothingItems || clothingItems.length === 0) {
      throw new Error('No clothing items found in wardrobe');
    }

    console.log(`Found ${clothingItems.length} clothing items for user ${user.id}`);

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Create a comprehensive item list for the AI
    const itemDescriptions = clothingItems.map((item: ClothingItem, index: number) => {
      return `ITEM_${index + 1}:
- ID: ${item.id}
- Category: ${item.category}
- Color: ${item.color} (Intensity: ${item.color_intensity || 'Medium'})
- Warmth: ${item.warmth_level}
- Material: ${item.material_fabric || 'Not specified'}
- Formality: ${item.formality_level || 'Casual'}
- Body Fit: ${item.body_fit || 'Regular'}
- Versatility Score: ${item.versatility_score || 5}/10
- Condition: ${item.condition_status || 'Good'}
- Occasions: ${item.occasion?.join(', ') || 'General use'}
- Style: ${item.style_aesthetic?.join(', ') || 'Versatile'}
- Weather: ${item.weather_suitability?.join(', ') || 'General weather'}
- Season: ${item.season?.join(', ') || 'All seasons'}
- Comfort: ${item.comfort_level || 'Moderate'}
- Transparency: ${item.transparency_level || 'Opaque'}
- Texture: ${item.texture || 'Smooth'}
- Weight: ${item.weight || 'Medium'}
- Stretch: ${item.stretch || 'Low Stretch'}
- Breathability: ${item.breathability || 'Moderate'}
- Water Resistance: ${item.water_resistance || 'None'}
- Special Features: ${item.special_features?.join(', ') || 'None'}
- Pattern Scale: ${item.pattern_scale || 'N/A'}
- Layering Position: ${item.layering_position || 'Mid Layer'}
- Maintenance: ${item.maintenance_level || 'Medium'}
- Outfit Role: ${item.outfit_role || 'Basic'}
- Weather Protection: ${item.weather_protection?.join(', ') || 'None'}
- Activity Suitability: ${item.activity_suitability?.join(', ') || 'General'}
- Emotional Association: ${item.emotional_association?.join(', ') || 'Comfortable'}
- Compliment Frequency: ${item.compliment_frequency || 'Sometimes'}
- Tags: ${item.tags?.join(', ') || 'None'}`;
    }).join('\n\n');

    // Prepare the enhanced prompt for Gemini
    const prompt = `You are a professional fashion stylist AI with expertise in color theory, style coordination, and outfit composition. Create sophisticated outfit combinations using ONLY the clothing items provided below.

USER REQUEST:
- Occasion: ${outfitRequest.occasion}
- Weather: ${outfitRequest.weather ? `${outfitRequest.weather.temperature}°C, ${outfitRequest.weather.condition} in ${outfitRequest.weather.city}` : 'Not specified'}
- Style Preferences: ${outfitRequest.preferences?.style?.join(', ') || 'None specified'}
- Color Preferences: ${outfitRequest.preferences?.colors?.join(', ') || 'None specified'}
- Comfort Level: ${outfitRequest.preferences?.comfort_level || 'Not specified'}
- Additional Notes: ${outfitRequest.additional_notes || 'None'}

AVAILABLE CLOTHING ITEMS:
${itemDescriptions}

STYLING GUIDELINES:
1. **Color Coordination**: Consider color intensity, undertones, and complementary/analogous color schemes
2. **Formality Matching**: Ensure all pieces match the required formality level for the occasion
3. **Layering Logic**: Use layering_position to create proper layering (base → mid → outer)
4. **Texture Balance**: Mix textures thoughtfully (smooth with textured, structured with flowing)
5. **Proportion & Fit**: Balance fitted and loose pieces for flattering silhouettes
6. **Weather Appropriateness**: Consider warmth_level, breathability, and weather_protection
7. **Versatility Priority**: Favor items with higher versatility_scores when possible
8. **Comfort Consideration**: Match comfort_level with occasion requirements
9. **Pattern Mixing**: If mixing patterns, ensure different scales and complementary styles
10. **Transparency Layering**: Use transparency_level to ensure appropriate coverage

OUTFIT CREATION RULES:
- Each outfit should include 3-6 items minimum
- Must include at least: top/dress + bottom (unless dress) + shoes
- Add outerwear if weather requires (temp < 15°C or rain/snow)
- Consider accessories if available and appropriate
- Ensure color harmony and style cohesion
- Match formality levels across all pieces
- Consider the emotional_association for occasion appropriateness

IMPORTANT INSTRUCTIONS:
1. You MUST use the exact item IDs provided above
2. Create 3-5 complete, sophisticated outfit combinations
3. Prioritize items with better condition_status and higher versatility_score
4. Consider compliment_frequency for special occasions
5. Only suggest items that actually exist in the wardrobe above

RESPONSE FORMAT:
{
  "outfits": [
    {
      "name": "Descriptive outfit name",
      "item_ids": ["actual-uuid-1", "actual-uuid-2", "actual-uuid-3"],
      "reasoning": "Detailed explanation of why this combination works (color theory, style harmony, occasion appropriateness)",
      "style_notes": "Specific styling tips and how to wear/accessorize",
      "confidence": 0.9
    }
  ],
  "general_tips": "Overall styling advice for this occasion and weather"
}

Return ONLY valid JSON without markdown formatting. Use the exact UUIDs from the item IDs above. Focus on creating outfits that are both stylish and practical for the specific occasion and weather conditions.`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3, // Lower temperature for more consistent ID matching
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || !geminiData.candidates[0]) {
      throw new Error('No suggestions generated');
    }

    const suggestionsText = geminiData.candidates[0].content.parts[0].text;
    console.log('Raw Gemini response:', suggestionsText);
    
    // Parse the JSON response from Gemini
    let suggestions;
    try {
      // Clean the response text (remove any markdown formatting)
      const cleanedText = suggestionsText.replace(/```json\n?|\n?```/g, '').trim();
      suggestions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', suggestionsText);
      
      // Fallback: Create basic outfit suggestions using available items
      const fallbackOutfits = createFallbackOutfits(clothingItems, outfitRequest);
      suggestions = {
        outfits: fallbackOutfits,
        general_tips: `For ${outfitRequest.occasion}, focus on comfort and appropriateness for the weather.`
      };
    }

    // Validate and enrich the suggestions with actual item data
    const enrichedOutfits = suggestions.outfits.map((outfit: any) => {
      console.log('Processing outfit:', outfit.name, 'with item_ids:', outfit.item_ids);
      
      const outfitItems = outfit.item_ids.map((itemId: string) => {
        const foundItem = clothingItems.find((item: ClothingItem) => item.id === itemId);
        if (!foundItem) {
          console.warn(`Item with ID ${itemId} not found in wardrobe`);
        }
        return foundItem;
      }).filter(Boolean);

      console.log(`Found ${outfitItems.length} items for outfit: ${outfit.name}`);

      return {
        ...outfit,
        items: outfitItems,
        item_count: outfitItems.length
      };
    }).filter(outfit => outfit.items.length > 0); // Only return outfits with actual items

    // If no valid outfits were created, create fallback outfits
    if (enrichedOutfits.length === 0) {
      console.log('No valid outfits from AI, creating fallback outfits');
      const fallbackOutfits = createFallbackOutfits(clothingItems, outfitRequest);
      return new Response(
        JSON.stringify({
          success: true,
          suggestions: {
            outfits: fallbackOutfits,
            general_tips: `Here are some outfit suggestions based on your ${outfitRequest.occasion} occasion.`
          },
          fallback_used: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Return the suggestions
    return new Response(
      JSON.stringify({
        success: true,
        suggestions: {
          ...suggestions,
          outfits: enrichedOutfits
        },
        request_info: {
          occasion: outfitRequest.occasion,
          weather: outfitRequest.weather,
          preferences: outfitRequest.preferences,
          total_items_available: clothingItems.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-outfit-suggestions function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Enhanced fallback function to create better outfit suggestions
function createFallbackOutfits(clothingItems: ClothingItem[], request: OutfitRequest) {
  const outfits = [];
  
  // Group items by category and properties
  const itemsByCategory = clothingItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ClothingItem[]>);

  // Sort items by versatility and condition
  Object.keys(itemsByCategory).forEach(category => {
    itemsByCategory[category].sort((a, b) => {
      const aScore = (a.versatility_score || 5) + (a.condition_status === 'Excellent' ? 2 : a.condition_status === 'Good' ? 1 : 0);
      const bScore = (b.versatility_score || 5) + (b.condition_status === 'Excellent' ? 2 : b.condition_status === 'Good' ? 1 : 0);
      return bScore - aScore;
    });
  });

  const tops = itemsByCategory.top || [];
  const bottoms = itemsByCategory.bottom || [];
  const dresses = itemsByCategory.dress || [];
  const shoes = itemsByCategory.shoes || [];
  const jackets = itemsByCategory.jacket || [];
  const outerwear = itemsByCategory.outerwear || [];

  let outfitCount = 0;
  
  // Create dress-based outfits first
  for (let i = 0; i < Math.min(dresses.length, 2) && outfitCount < 3; i++) {
    const outfit = [];
    const dress = dresses[i];
    outfit.push(dress);

    // Add shoes if available
    if (shoes.length > 0) {
      const shoe = shoes[i % shoes.length];
      outfit.push(shoe);
    }

    // Add outerwear if weather is cold
    if (request.weather && request.weather.temperature < 15) {
      const outerLayer = [...jackets, ...outerwear];
      if (outerLayer.length > 0) {
        outfit.push(outerLayer[i % outerLayer.length]);
      }
    }

    if (outfit.length >= 2) {
      outfits.push({
        name: `${request.occasion} Dress Look ${outfitCount + 1}`,
        items: outfit,
        item_ids: outfit.map(item => item.id),
        reasoning: `A sophisticated dress-based outfit perfect for ${request.occasion.toLowerCase()}. The dress serves as the statement piece with complementary accessories.`,
        style_notes: "Complete the look with minimal jewelry and a structured bag for a polished appearance.",
        confidence: 0.8,
        item_count: outfit.length
      });
      outfitCount++;
    }
  }

  // Create top + bottom combinations
  for (let i = 0; i < Math.min(tops.length, 3) && outfitCount < 5; i++) {
    const outfit = [];
    const top = tops[i];
    outfit.push(top);

    // Add bottom if available
    if (bottoms.length > 0) {
      const bottom = bottoms[i % bottoms.length];
      outfit.push(bottom);
    }

    // Add shoes if available
    if (shoes.length > 0) {
      const shoe = shoes[i % shoes.length];
      outfit.push(shoe);
    }

    // Add jacket/outerwear if weather is cold or for layering
    if ((request.weather && request.weather.temperature < 15) || request.occasion.toLowerCase().includes('formal')) {
      const outerLayer = [...jackets, ...outerwear];
      if (outerLayer.length > 0) {
        outfit.push(outerLayer[i % outerLayer.length]);
      }
    }

    if (outfit.length >= 2) {
      const formalityLevel = top.formality_level || 'Casual';
      outfits.push({
        name: `${formalityLevel} ${request.occasion} Look ${outfitCount + 1}`,
        items: outfit,
        item_ids: outfit.map(item => item.id),
        reasoning: `A well-coordinated ${formalityLevel.toLowerCase()} outfit suitable for ${request.occasion.toLowerCase()}. The color combination and style elements work harmoniously together.`,
        style_notes: "Layer thoughtfully and ensure all pieces complement each other in both color and formality level.",
        confidence: 0.7,
        item_count: outfit.length
      });
      outfitCount++;
    }
  }

  return outfits;
}