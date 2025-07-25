/*
  # Create Store Customization and Theme Tables

  1. New Tables
    - `store_customizations`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key to tenants)
      - `logo_url` (text, optional)
      - `banner_main_url` (text, optional)
      - `banner_profile_url` (text, optional)
      - `primary_color` (text, default blue)
      - `background_color` (text, default white)
      - `text_color` (text, default dark gray)
      - `accent_color` (text, default light blue)
      - `font_family` (text, default Inter)
      - `font_size_base` (integer, default 16)
      - `layout_style` (text, default modern)
      - `template_id` (uuid, optional)
      - `custom_css` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `customization_templates`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `category` (text, required)
      - `preview_image_url` (text, optional)
      - `config` (jsonb, template configuration)
      - `is_premium` (boolean, default false)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `font_options`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `family` (text, required)
      - `category` (text, required)
      - `google_font_url` (text, optional)
      - `is_premium` (boolean, default false)
      - `preview_text` (text, required)
      - `created_at` (timestamp)

    - `customization_history`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key to tenants)
      - `user_id` (uuid, optional)
      - `action_type` (text, required)
      - `changes` (jsonb, changes made)
      - `previous_config` (jsonb, optional)
      - `new_config` (jsonb, optional)
      - `template_used` (text, optional)
      - `created_at` (timestamp)

    - `store_themes`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key to tenants)
      - `theme_id` (text, required)
      - `applied_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for tenant access control
    - Add policies for public read access where appropriate

  3. Indexes
    - Add indexes for frequently queried columns
    - Add unique constraints where needed
*/

-- Create store_customizations table
CREATE TABLE IF NOT EXISTS store_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url text,
  banner_main_url text,
  banner_profile_url text,
  primary_color text DEFAULT '#3B82F6',
  background_color text DEFAULT '#FFFFFF',
  text_color text DEFAULT '#1F2937',
  accent_color text DEFAULT '#EFF6FF',
  font_family text DEFAULT 'Inter',
  font_size_base integer DEFAULT 16,
  layout_style text DEFAULT 'modern',
  template_id uuid,
  custom_css text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customization_templates table
CREATE TABLE IF NOT EXISTS customization_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  preview_image_url text,
  config jsonb DEFAULT '{}',
  is_premium boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create font_options table
CREATE TABLE IF NOT EXISTS font_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  family text NOT NULL,
  category text NOT NULL,
  google_font_url text,
  is_premium boolean DEFAULT false,
  preview_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create customization_history table
CREATE TABLE IF NOT EXISTS customization_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  changes jsonb DEFAULT '{}',
  previous_config jsonb,
  new_config jsonb,
  template_used text,
  created_at timestamptz DEFAULT now()
);

-- Create store_themes table
CREATE TABLE IF NOT EXISTS store_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  theme_id text NOT NULL,
  applied_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_store_customizations_tenant_id ON store_customizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customization_templates_category ON customization_templates(category);
CREATE INDEX IF NOT EXISTS idx_customization_templates_active ON customization_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_font_options_category ON font_options(category);
CREATE INDEX IF NOT EXISTS idx_customization_history_tenant_id ON customization_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customization_history_created_at ON customization_history(created_at);
CREATE INDEX IF NOT EXISTS idx_store_themes_tenant_id ON store_themes(tenant_id);

-- Add unique constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'store_customizations_tenant_id_key' 
    AND table_name = 'store_customizations'
  ) THEN
    ALTER TABLE store_customizations ADD CONSTRAINT store_customizations_tenant_id_key UNIQUE (tenant_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'store_themes_tenant_id_key' 
    AND table_name = 'store_themes'
  ) THEN
    ALTER TABLE store_themes ADD CONSTRAINT store_themes_tenant_id_key UNIQUE (tenant_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE store_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE font_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_themes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_customizations
CREATE POLICY "Public can read active tenant customizations"
  ON store_customizations
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = store_customizations.tenant_id
      AND tenants.status = 'active'
    )
  );

CREATE POLICY "Tenant members can manage own customizations"
  ON store_customizations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = store_customizations.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.is_active = true
    )
  );

-- RLS Policies for customization_templates
CREATE POLICY "Public can read active templates"
  ON customization_templates
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON customization_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- RLS Policies for font_options
CREATE POLICY "Public can read font options"
  ON font_options
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage font options"
  ON font_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- RLS Policies for customization_history
CREATE POLICY "Tenant members can read own history"
  ON customization_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = customization_history.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.is_active = true
    )
  );

CREATE POLICY "Tenant members can insert own history"
  ON customization_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = customization_history.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.is_active = true
    )
  );

-- RLS Policies for store_themes
CREATE POLICY "Public can read active tenant themes"
  ON store_themes
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = store_themes.tenant_id
      AND tenants.status = 'active'
    )
  );

CREATE POLICY "Tenant members can manage own themes"
  ON store_themes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = store_themes.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.is_active = true
    )
  );

-- Insert default font options
INSERT INTO font_options (name, family, category, preview_text, is_premium) VALUES
  ('Inter', 'Inter', 'sans-serif', 'The quick brown fox jumps over the lazy dog', false),
  ('Poppins', 'Poppins', 'sans-serif', 'The quick brown fox jumps over the lazy dog', false),
  ('Roboto', 'Roboto', 'sans-serif', 'The quick brown fox jumps over the lazy dog', false),
  ('Open Sans', 'Open Sans', 'sans-serif', 'The quick brown fox jumps over the lazy dog', false),
  ('Montserrat', 'Montserrat', 'sans-serif', 'The quick brown fox jumps over the lazy dog', false),
  ('Playfair Display', 'Playfair Display', 'serif', 'The quick brown fox jumps over the lazy dog', true),
  ('Georgia', 'Georgia', 'serif', 'The quick brown fox jumps over the lazy dog', false),
  ('Helvetica', 'Helvetica', 'sans-serif', 'The quick brown fox jumps over the lazy dog', true)
ON CONFLICT DO NOTHING;

-- Insert sample customization templates
INSERT INTO customization_templates (name, description, category, config, is_premium, is_active) VALUES
  (
    'Moderno Azul',
    'Design limpo e moderno com tons de azul',
    'modern',
    '{"primary_color": "#2563EB", "background_color": "#FFFFFF", "text_color": "#1F2937", "accent_color": "#EFF6FF", "font_family": "Inter", "layout_style": "modern"}',
    false,
    true
  ),
  (
    'Clássico Verde',
    'Estilo tradicional com tons verdes',
    'classic',
    '{"primary_color": "#059669", "background_color": "#F9FAFB", "text_color": "#374151", "accent_color": "#ECFDF5", "font_family": "Georgia", "layout_style": "classic"}',
    false,
    true
  ),
  (
    'Minimalista Premium',
    'Design ultra-limpo e sofisticado',
    'minimal',
    '{"primary_color": "#374151", "background_color": "#FFFFFF", "text_color": "#111827", "accent_color": "#F9FAFB", "font_family": "Helvetica", "layout_style": "minimal"}',
    true,
    true
  )
ON CONFLICT DO NOTHING;