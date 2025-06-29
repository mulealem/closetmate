/*
  # Complete ClosetMate Database Setup

  1. New Tables
    - `clothing_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `image_url` (text)
      - `category` (text) - top, bottom, jacket, shoes, etc.
      - `color` (text)
      - `warmth_level` (text) - light, medium, heavy
      - `tags` (text array) - optional tags like formal, casual
      - `created_at` (timestamp)
    - `outfits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `clothing_items` (jsonb) - array of clothing item IDs
      - `weather_condition` (text)
      - `temperature` (integer)
      - `rating` (integer) - 1-5 stars
      - `is_favorite` (boolean)
      - `created_at` (timestamp)
    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `preferred_colors` (text array)
      - `preferred_categories` (text array)
      - `style_preferences` (jsonb)
      - `city` (text)
      - `updated_at` (timestamp)

  2. Storage
    - Create `clothing-images` bucket
    - Set up RLS policies for user-specific access

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create tables if they don't exist

-- Clothing Items Table
CREATE TABLE IF NOT EXISTS clothing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  category text NOT NULL CHECK (category IN ('top', 'bottom', 'jacket', 'shoes', 'accessory', 'dress', 'outerwear')),
  color text NOT NULL,
  warmth_level text NOT NULL CHECK (warmth_level IN ('light', 'medium', 'heavy')),
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Outfits Table
CREATE TABLE IF NOT EXISTS outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text,
  clothing_items jsonb NOT NULL DEFAULT '[]',
  weather_condition text,
  temperature integer,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preferred_colors text[] DEFAULT '{}',
  preferred_categories text[] DEFAULT '{}',
  style_preferences jsonb DEFAULT '{}',
  city text,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
  -- Clothing items policies
  DROP POLICY IF EXISTS "Users can view own clothing items" ON clothing_items;
  DROP POLICY IF EXISTS "Users can insert own clothing items" ON clothing_items;
  DROP POLICY IF EXISTS "Users can update own clothing items" ON clothing_items;
  DROP POLICY IF EXISTS "Users can delete own clothing items" ON clothing_items;
  
  -- Outfits policies
  DROP POLICY IF EXISTS "Users can view own outfits" ON outfits;
  DROP POLICY IF EXISTS "Users can insert own outfits" ON outfits;
  DROP POLICY IF EXISTS "Users can update own outfits" ON outfits;
  DROP POLICY IF EXISTS "Users can delete own outfits" ON outfits;
  
  -- User preferences policies
  DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
  DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
  DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
  DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Policies for clothing_items
CREATE POLICY "Users can view own clothing items"
  ON clothing_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clothing items"
  ON clothing_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clothing items"
  ON clothing_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clothing items"
  ON clothing_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for outfits
CREATE POLICY "Users can view own outfits"
  ON outfits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfits"
  ON outfits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outfits"
  ON outfits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfits"
  ON outfits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for clothing images
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
  VALUES (
    'clothing-images',
    'clothing-images', 
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'],
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'],
    updated_at = now();
EXCEPTION
  WHEN others THEN
    -- Bucket creation might fail in some environments, continue with policies
    NULL;
END $$;

-- Storage policies for clothing images
DO $$
BEGIN
  -- Drop existing storage policies if they exist
  DROP POLICY IF EXISTS "Users can upload clothing images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view clothing images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update clothing images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete clothing images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create storage policies
DO $$
BEGIN
  -- Policy for uploading images (users can upload to their own folder)
  CREATE POLICY "Users can upload clothing images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'clothing-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Policy for viewing images (users can view their own images)
  CREATE POLICY "Users can view clothing images" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'clothing-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Policy for updating images (users can update their own images)
  CREATE POLICY "Users can update clothing images" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'clothing-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Policy for deleting images (users can delete their own images)
  CREATE POLICY "Users can delete clothing images" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'clothing-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION
  WHEN others THEN
    -- Storage policies might fail in some environments
    NULL;
END $$;