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

    // Create a detailed item list for the AI
    const itemDescriptions = clothingItems.map((item: ClothingItem, index: number) => {
      return `ITEM_${index + 1}:
- ID: ${item.id}
- Category: ${item.category}
- Color: ${item.color}
- Warmth: ${item.warmth_level}
- Material: ${item.material_fabric || 'Not specified'}
- Occasions: ${item.occasion?.join(', ') || 'General use'}
- Style: ${item.style_aesthetic?.join(', ') || 'Versatile'}
- Weather: ${item.weather_suitability?.join(', ') || 'General weather'}
- Season: ${item.season?.join(', ') || 'All seasons'}
- Comfort: ${item.comfort_level || 'Moderate'}
- Tags: ${item.tags?.join(', ') || 'None'}`;
    }).join('\n\n');

    // Prepare the prompt for Gemini
    const prompt = `You are a professional fashion stylist AI. Create outfit combinations using ONLY the clothing items provided below.

USER REQUEST:
- Occasion: ${outfitRequest.occasion}
- Weather: ${outfitRequest.weather ? `${outfitRequest.weather.temperature}°C, ${outfitRequest.weather.condition} in ${outfitRequest.weather.city}` : 'Not specified'}
- Style Preferences: ${outfitRequest.preferences?.style?.join(', ') || 'None specified'}
- Color Preferences: ${outfitRequest.preferences?.colors?.join(', ') || 'None specified'}
- Comfort Level: ${outfitRequest.preferences?.comfort_level || 'Not specified'}
- Additional Notes: ${outfitRequest.additional_notes || 'None'}

AVAILABLE CLOTHING ITEMS:
${itemDescriptions}

IMPORTANT INSTRUCTIONS:
1. You MUST use the exact item IDs provided above (like the ID field for each item)
2. Create 3-5 complete outfit combinations
3. Each outfit should include items from different categories when possible (top, bottom, shoes, etc.)
4. Consider color coordination, style harmony, and appropriateness for the occasion
5. Ensure weather appropriateness based on warmth levels
6. Only suggest items that actually exist in the wardrobe above

EXAMPLE RESPONSE FORMAT:
{
  "outfits": [
    {
      "name": "Professional Day Look",
      "item_ids": ["actual-uuid-1", "actual-uuid-2", "actual-uuid-3"],
      "reasoning": "This combination works because...",
      "style_notes": "Style this by...",
      "confidence": 0.9
    }
  ],
  "general_tips": "For this occasion, consider..."
}

Return ONLY valid JSON without markdown formatting. Use the exact UUIDs from the item IDs above.`;

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
            maxOutputTokens: 2048,
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

// Fallback function to create basic outfit suggestions
function createFallbackOutfits(clothingItems: ClothingItem[], request: OutfitRequest) {
  const outfits = [];
  
  // Group items by category
  const itemsByCategory = clothingItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ClothingItem[]>);

  // Create up to 3 basic outfit combinations
  const tops = itemsByCategory.top || [];
  const bottoms = itemsByCategory.bottom || [];
  const shoes = itemsByCategory.shoes || [];
  const jackets = itemsByCategory.jacket || [];
  const outerwear = itemsByCategory.outerwear || [];

  let outfitCount = 0;
  
  for (let i = 0; i < Math.min(tops.length, 3) && outfitCount < 3; i++) {
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

    // Add jacket/outerwear if weather is cold
    if (request.weather && request.weather.temperature < 15) {
      const outerLayer = [...jackets, ...outerwear];
      if (outerLayer.length > 0) {
        outfit.push(outerLayer[i % outerLayer.length]);
      }
    }

    if (outfit.length >= 2) { // At least 2 items for a valid outfit
      outfits.push({
        name: `Outfit ${outfitCount + 1} for ${request.occasion}`,
        items: outfit,
        item_ids: outfit.map(item => item.id),
        reasoning: `A ${request.occasion.toLowerCase()} appropriate combination using your available items.`,
        style_notes: "Mix and match with accessories to personalize your look.",
        confidence: 0.7,
        item_count: outfit.length
      });
      outfitCount++;
    }
  }

  return outfits;
}