/*
  # Fix admin_users table RLS policies

  1. Security Updates
    - Enable RLS on admin_users table
    - Add proper policies for admin user access
*/

-- Enable RLS on admin_users table if not already enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can read admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

-- Allow admins to read admin users (including themselves)
CREATE POLICY "Admins can read admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM admin_users admin_users_1
      WHERE admin_users_1.user_id = auth.uid()
    )
  );

-- Allow super admins to manage admin users
CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_super_admin = true
    )
  );