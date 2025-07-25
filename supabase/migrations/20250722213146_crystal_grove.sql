/*
  # Fix customization RLS policies and query issues

  1. Security Fixes
    - Update RLS policies for store_customizations table
    - Allow authenticated users to create/read/update their tenant customizations
    - Fix policy conditions for proper access control

  2. Query Fixes
    - Handle single() query errors gracefully
    - Ensure proper tenant access validation
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read active tenant customizations" ON store_customizations;
DROP POLICY IF EXISTS "Tenant members can manage own customizations" ON store_customizations;

-- Create updated RLS policies for store_customizations
CREATE POLICY "Allow authenticated users to read customizations"
  ON store_customizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = store_customizations.tenant_id 
      AND tenants.status = 'active'
    )
  );

CREATE POLICY "Allow public read for active tenant customizations"
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

CREATE POLICY "Allow tenant members to manage customizations"
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_users.tenant_id = store_customizations.tenant_id 
      AND tenant_users.user_id = auth.uid() 
      AND tenant_users.is_active = true
    )
  );

-- Allow tenant owners to manage customizations
CREATE POLICY "Allow tenant owners to manage customizations"
  ON store_customizations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = store_customizations.tenant_id 
      AND tenants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = store_customizations.tenant_id 
      AND tenants.owner_id = auth.uid()
    )
  );

-- Allow admins to manage all customizations
CREATE POLICY "Allow admins to manage all customizations"
  ON store_customizations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Update store_themes policies as well
DROP POLICY IF EXISTS "Public can read active tenant themes" ON store_themes;
DROP POLICY IF EXISTS "Tenant members can manage own themes" ON store_themes;

CREATE POLICY "Allow public read for active tenant themes"
  ON store_themes
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = store_themes.tenant_id 
      AND tenants.status = 'active'
    )
  );

CREATE POLICY "Allow tenant members to manage themes"
  ON store_themes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_users.tenant_id = store_themes.tenant_id 
      AND tenant_users.user_id = auth.uid() 
      AND tenant_users.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = store_themes.tenant_id 
      AND tenants.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_users.tenant_id = store_themes.tenant_id 
      AND tenant_users.user_id = auth.uid() 
      AND tenant_users.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = store_themes.tenant_id 
      AND tenants.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );