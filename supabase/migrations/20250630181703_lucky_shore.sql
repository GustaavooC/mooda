/*
  # Initial Product Management Schema

  1. New Tables
    - `colors`
      - `id` (uuid, primary key)
      - `name` (text)
      - `hex_code` (text)
      - `created_at` (timestamp)
    - `sizes`
      - `id` (uuid, primary key)
      - `name` (text)
      - `category` (text) - clothing, shoes, accessories
      - `sort_order` (integer)
      - `created_at` (timestamp)
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `parent_id` (uuid, nullable, foreign key)
      - `created_at` (timestamp)
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `category_id` (uuid, nullable, foreign key)
      - `brand` (text, nullable)
      - `sku` (text, nullable, unique)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `product_variations`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `color_id` (uuid, foreign key)
      - `size_id` (uuid, foreign key)
      - `price` (decimal)
      - `promotional_price` (decimal, nullable)
      - `stock_quantity` (integer)
      - `sku` (text, nullable)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `product_images`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `variation_id` (uuid, nullable, foreign key)
      - `image_url` (text)
      - `alt_text` (text, nullable)
      - `sort_order` (integer)
      - `is_primary` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Create colors table
CREATE TABLE IF NOT EXISTS colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hex_code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sizes table
CREATE TABLE IF NOT EXISTS sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'clothing',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id),
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id),
  brand text,
  sku text UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_variations table
CREATE TABLE IF NOT EXISTS product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_id uuid NOT NULL REFERENCES colors(id),
  size_id uuid NOT NULL REFERENCES sizes(id),
  price decimal(10,2) NOT NULL,
  promotional_price decimal(10,2),
  stock_quantity integer NOT NULL DEFAULT 0,
  sku text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, color_id, size_id)
);

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variation_id uuid REFERENCES product_variations(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is a store)
CREATE POLICY "Allow public read access to colors" ON colors FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to sizes" ON sizes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to products" ON products FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Allow public read access to product_variations" ON product_variations FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Allow public read access to product_images" ON product_images FOR SELECT TO anon USING (true);

-- Create policies for authenticated users (admin access)
CREATE POLICY "Allow authenticated users full access to colors" ON colors FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to sizes" ON sizes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to categories" ON categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to products" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to product_variations" ON product_variations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to product_images" ON product_images FOR ALL TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_is_active ON product_variations(is_active);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_variation_id ON product_images(variation_id);