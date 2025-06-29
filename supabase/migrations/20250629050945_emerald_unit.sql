/*
  # Extended Clothing Properties Schema Update

  1. New Columns for clothing_items table
    - `occasion` (text array) - Casual, Formal, Business, etc.
    - `weather_suitability` (text array) - Hot, Cold, Rainy, etc.
    - `style_aesthetic` (text array) - Bohemian, Minimalist, etc.
    - `material_fabric` (text) - Cotton, Silk, Wool, etc.
    - `season` (text array) - Summer, Winter, Spring, Fall
    - `fit_shape` (text) - Loose, Fitted, Oversized, etc.
    - `pattern_design` (text) - Solid, Floral, Geometric, etc.
    - `length` (text) - Mini, Midi, Maxi, etc.
    - `sleeve_type` (text) - Sleeveless, Short, Long, etc.
    - `neckline` (text) - V-Neck, Crew, Scoop, etc.
    - `comfort_level` (text) - High, Moderate, Low
    - `care_requirements` (text) - Machine Wash, Dry Clean, etc.
    - `ai_analyzed` (boolean) - Whether item was analyzed by AI
    - `ai_confidence` (numeric) - AI analysis confidence score

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to clothing_items table
DO $$
BEGIN
  -- Occasion (multiple values possible)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'occasion'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN occasion text[] DEFAULT '{}';
  END IF;

  -- Weather suitability (multiple values possible)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'weather_suitability'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN weather_suitability text[] DEFAULT '{}';
  END IF;

  -- Style/Aesthetic (multiple values possible)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'style_aesthetic'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN style_aesthetic text[] DEFAULT '{}';
  END IF;

  -- Material/Fabric
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'material_fabric'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN material_fabric text;
  END IF;

  -- Season (multiple values possible)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'season'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN season text[] DEFAULT '{}';
  END IF;

  -- Fit/Shape
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'fit_shape'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN fit_shape text;
  END IF;

  -- Pattern/Design
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'pattern_design'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN pattern_design text;
  END IF;

  -- Length
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'length'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN length text;
  END IF;

  -- Sleeve Type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'sleeve_type'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN sleeve_type text;
  END IF;

  -- Neckline
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'neckline'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN neckline text;
  END IF;

  -- Comfort Level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'comfort_level'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN comfort_level text;
  END IF;

  -- Care Requirements
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'care_requirements'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN care_requirements text;
  END IF;

  -- AI Analysis tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'ai_analyzed'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN ai_analyzed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'ai_confidence'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN ai_confidence numeric(3,2);
  END IF;
END $$;