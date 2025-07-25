/*
  # Fix validate_user_login function type mismatch

  1. Function Updates
    - Drop and recreate `validate_user_login` function with correct return types
    - Ensure all return column types match the actual data being returned
    - Fix type mismatch between varchar(255) and text in column 2

  2. Changes
    - Update function signature to use consistent text types
    - Maintain existing functionality while fixing type compatibility
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS validate_user_login(text, text);

-- Recreate the function with correct return types
CREATE OR REPLACE FUNCTION validate_user_login(
  p_email text,
  p_password text
)
RETURNS TABLE(
  user_id uuid,
  email text,
  tenant_id uuid,
  tenant_name text,
  tenant_slug text,
  user_role text,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::text as email,
    t.id as tenant_id,
    t.name::text as tenant_name,
    t.slug::text as tenant_slug,
    tu.role::text as user_role,
    tu.is_active as is_active
  FROM auth.users u
  LEFT JOIN tenant_users tu ON tu.user_id = u.id
  LEFT JOIN tenants t ON t.id = tu.tenant_id
  WHERE u.email = p_email
    AND u.encrypted_password = crypt(p_password, u.encrypted_password)
    AND tu.is_active = true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION validate_user_login(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_user_login(text, text) TO anon;