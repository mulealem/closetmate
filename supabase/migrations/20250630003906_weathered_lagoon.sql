/*
  # Enhanced Clothing Properties for Better Recommendations

  1. New Columns for clothing_items table
    - `brand` (text) - Brand name
    - `price_range` (text) - Budget, Mid-range, Luxury
    - `formality_level` (text) - Very Casual, Casual, Smart Casual, Business Casual, Formal, Black Tie
    - `versatility_score` (integer) - 1-10 rating of how versatile the item is
    - `condition_status` (text) - Excellent, Good, Fair, Needs Repair
    - `purchase_date` (date) - When the item was purchased
    - `last_worn` (date) - Last time the item was worn
    - `wear_frequency` (text) - Daily, Weekly, Monthly, Rarely, Special Occasions
    - `body_fit` (text) - Tight, Snug, Regular, Loose, Oversized
    - `transparency_level` (text) - Opaque, Semi-transparent, Sheer
    - `texture` (text) - Smooth, Rough, Soft, Structured, Flowing
    - `weight` (text) - Very Light, Light, Medium, Heavy, Very Heavy
    - `stretch` (text) - No Stretch, Low Stretch, Medium Stretch, High Stretch
    - `breathability` (text) - Very Breathable, Breathable, Moderate, Low, Not Breathable
    - `water_resistance` (text) - None, Water Repellent, Water Resistant, Waterproof
    - `special_features` (text array) - Pockets, Reversible, Convertible, etc.
    - `color_intensity` (text) - Pastel, Light, Medium, Dark, Vibrant
    - `pattern_scale` (text) - Micro, Small, Medium, Large, Oversized (for patterns)
    - `layering_position` (text) - Base Layer, Mid Layer, Outer Layer, Statement Piece
    - `maintenance_level` (text) - Low, Medium, High
    - `sustainability_rating` (text) - Eco-friendly, Sustainable, Standard, Fast Fashion
    - `emotional_association` (text array) - Confident, Comfortable, Professional, Fun, etc.
    - `compliment_frequency` (text) - Never, Rarely, Sometimes, Often, Always
    - `outfit_role` (text) - Statement Piece, Basic, Accent, Layering
    - `weather_protection` (text array) - Wind, Rain, Snow, Sun, Cold
    - `activity_suitability` (text array) - Office Work, Exercise, Travel, Outdoor, etc.

  2. Security
    - Maintain existing RLS policies
*/

-- Add enhanced properties to clothing_items table
DO $$
BEGIN
  -- Brand
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'brand'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN brand text;
  END IF;

  -- Price Range
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'price_range'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN price_range text;
  END IF;

  -- Formality Level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'formality_level'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN formality_level text;
  END IF;

  -- Versatility Score (1-10)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'versatility_score'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN versatility_score integer CHECK (versatility_score >= 1 AND versatility_score <= 10);
  END IF;

  -- Condition Status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'condition_status'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN condition_status text;
  END IF;

  -- Purchase Date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'purchase_date'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN purchase_date date;
  END IF;

  -- Last Worn
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'last_worn'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN last_worn date;
  END IF;

  -- Wear Frequency
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'wear_frequency'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN wear_frequency text;
  END IF;

  -- Body Fit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'body_fit'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN body_fit text;
  END IF;

  -- Transparency Level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'transparency_level'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN transparency_level text;
  END IF;

  -- Texture
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'texture'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN texture text;
  END IF;

  -- Weight
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'weight'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN weight text;
  END IF;

  -- Stretch
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'stretch'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN stretch text;
  END IF;

  -- Breathability
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'breathability'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN breathability text;
  END IF;

  -- Water Resistance
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'water_resistance'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN water_resistance text;
  END IF;

  -- Special Features
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'special_features'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN special_features text[] DEFAULT '{}';
  END IF;

  -- Color Intensity
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'color_intensity'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN color_intensity text;
  END IF;

  -- Pattern Scale
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'pattern_scale'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN pattern_scale text;
  END IF;

  -- Layering Position
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'layering_position'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN layering_position text;
  END IF;

  -- Maintenance Level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'maintenance_level'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN maintenance_level text;
  END IF;

  -- Sustainability Rating
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'sustainability_rating'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN sustainability_rating text;
  END IF;

  -- Emotional Association
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'emotional_association'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN emotional_association text[] DEFAULT '{}';
  END IF;

  -- Compliment Frequency
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'compliment_frequency'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN compliment_frequency text;
  END IF;

  -- Outfit Role
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'outfit_role'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN outfit_role text;
  END IF;

  -- Weather Protection
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'weather_protection'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN weather_protection text[] DEFAULT '{}';
  END IF;

  -- Activity Suitability
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'activity_suitability'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN activity_suitability text[] DEFAULT '{}';
  END IF;
END $$;