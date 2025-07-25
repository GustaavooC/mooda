/*
  # Fix tenants table RLS policies

  1. Security Updates
    - Enable RLS on tenants table
    - Add proper policies for tenant access
    - Allow public read access to active tenants
    - Allow tenant owners and members to manage their tenants
*/

-- Enable RLS on tenants table if not already enabled
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public can read active tenants" ON tenants;
DROP POLICY IF EXISTS "Tenant owners can manage own tenant" ON tenants;
DROP POLICY IF EXISTS "Tenant members can read own tenant" ON tenants;
DROP POLICY IF EXISTS "Admins can manage all tenants" ON tenants;

-- Allow public read access to active tenants
CREATE POLICY "Public can read active tenants"
  ON tenants
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Allow tenant owners to manage their own tenant
CREATE POLICY "Tenant owners can manage own tenant"
  ON tenants
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Allow tenant members to read their tenant
CREATE POLICY "Tenant members can read own tenant"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenants.id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.is_active = true
    )
  );

-- Allow admins to manage all tenants
CREATE POLICY "Admins can manage all tenants"
  ON tenants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );