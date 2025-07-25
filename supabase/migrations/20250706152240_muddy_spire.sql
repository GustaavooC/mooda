/*
  # Fix tenant_users table RLS policies

  1. Security Updates
    - Enable RLS on tenant_users table
    - Add proper policies for tenant user access
*/

-- Enable RLS on tenant_users table if not already enabled
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Tenant users can read own tenant users" ON tenant_users;
DROP POLICY IF EXISTS "Tenant owners can manage tenant users" ON tenant_users;
DROP POLICY IF EXISTS "Admins can manage all tenant users" ON tenant_users;

-- Allow users to read tenant users from their own tenants
CREATE POLICY "Tenant users can read own tenant users"
  ON tenant_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Allow tenant owners to manage tenant users
CREATE POLICY "Tenant owners can manage tenant users"
  ON tenant_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_users.tenant_id
      AND tenants.owner_id = auth.uid()
    )
  );

-- Allow admins to manage all tenant users
CREATE POLICY "Admins can manage all tenant users"
  ON tenant_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );