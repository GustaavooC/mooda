/*
  # Fix tenant_subscriptions table RLS policies

  1. Security Updates
    - Enable RLS on tenant_subscriptions table
    - Add proper policies for subscription access
*/

-- Enable RLS on tenant_subscriptions table if not already enabled
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Tenant members can read own subscription" ON tenant_subscriptions;
DROP POLICY IF EXISTS "Tenant owners can manage own subscription" ON tenant_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON tenant_subscriptions;

-- Allow tenant members to read their subscription
CREATE POLICY "Tenant members can read own subscription"
  ON tenant_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_subscriptions.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Allow tenant owners to manage their subscription
CREATE POLICY "Tenant owners can manage own subscription"
  ON tenant_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_subscriptions.tenant_id
      AND tenants.owner_id = auth.uid()
    )
  );

-- Allow admins to manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
  ON tenant_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );