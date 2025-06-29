import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ClothingAnalysis {
  category: string;
  color: string;
  warmth_level: string;
  occasion: string[];
  weather_suitability: string[];
  style_aesthetic: string[];
  material_fabric?: string;
  season: string[];
  fit_shape?: string;
  pattern_design?: string;
  length?: string;
  sleeve_type?: string;
  neckline?: string;
  comfort_level?: string;
  care_requirements?: string;
  tags: string[];
  confidence: number;
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
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image data provided');
    }

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Prepare the prompt for Gemini
    const prompt = `
Analyze this clothing image and provide detailed information in JSON format. The image may show a person wearing the clothing or just the clothing item itself.

Please identify and return the following properties:

1. category: One of [top, bottom, dress, jacket, outerwear, shoes, accessory]
2. color: Primary color (e.g., "Navy Blue", "Black", "White")
3. warmth_level: One of [light, medium, heavy]
4. occasion: Array from [Casual, Formal, Semi-Formal, Business Casual, Party, Wedding, Beach, Athletic, Interview, Date Night, Travel, Festival, Black Tie, Cocktail, Work, School, Religious Event]
5. weather_suitability: Array from [Hot, Cold, Mild, Rainy, Snowy, Humid, Windy, Breathable, Insulated, Waterproof, Lightweight, Layerable]
6. style_aesthetic: Array from [Bohemian, Minimalist, Vintage, Modern, Preppy, Grunge, Chic, Streetwear, Classic, Trendy, Edgy, Romantic, Goth, Athleisure]
7. material_fabric: One from [Cotton, Silk, Linen, Wool, Polyester, Denim, Leather, Chiffon, Velvet, Knit, Satin] (if identifiable)
8. season: Array from [Summer, Winter, Spring, Fall, All-Season]
9. fit_shape: One from [Loose, Fitted, Oversized, Tailored, A-Line, Bodycon, Flowy, Straight, Flared] (if applicable)
10. pattern_design: One from [Solid, Floral, Geometric, Animal Print, Abstract, Checkered, Tie-Dye, Striped, Polka Dot, Plaid] (if applicable)
11. length: One from [Mini, Midi, Maxi, Ankle-Length, Cropped, Floor-Length] (if applicable)
12. sleeve_type: One from [Sleeveless, Short Sleeve, Long Sleeve, Three-Quarter Sleeve, Cap Sleeve, Puffy Sleeve] (if applicable)
13. neckline: One from [V-Neck, Crew Neck, Scoop Neck, Off-Shoulder, Halter, Turtleneck] (if applicable)
14. comfort_level: One from [High, Moderate, Low]
15. care_requirements: One from [Machine Washable, Dry Clean Only, Hand Wash, Low Maintenance]
16. tags: Array of descriptive tags (e.g., ["comfortable", "versatile", "professional"])
17. confidence: Number between 0 and 1 indicating analysis confidence

Return ONLY valid JSON without any markdown formatting or additional text.
`;

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
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
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
      throw new Error('No analysis result from Gemini');
    }

    const analysisText = geminiData.candidates[0].content.parts[0].text;
    
    // Parse the JSON response from Gemini
    let analysis: ClothingAnalysis;
    try {
      // Clean the response text (remove any markdown formatting)
      const cleanedText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', analysisText);
      throw new Error('Invalid response format from AI analysis');
    }

    // Validate required fields
    if (!analysis.category || !analysis.color || !analysis.warmth_level) {
      throw new Error('Missing required fields in AI analysis');
    }

    // Return the analysis result
    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          ...analysis,
          ai_analyzed: true,
          ai_confidence: analysis.confidence || 0.8
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in analyze-clothing function:', error);
    
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