/*
  # Create Tenant with User Function

  1. Function to create a complete tenant setup
    - Creates user in auth.users and public.users
    - Creates tenant record
    - Creates tenant_users relationship
    - Creates default subscription
    - Returns structured response

  2. Security
    - SECURITY DEFINER for elevated permissions
    - Input validation
    - Atomic transaction with rollback on error
    - Proper error handling
*/

CREATE OR REPLACE FUNCTION create_tenant_with_user(
  p_tenant_name text,
  p_tenant_slug text,
  p_tenant_description text,
  p_tenant_settings jsonb,
  p_admin_email text,
  p_admin_name text,
  p_admin_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
  v_subscription_id uuid;
  v_result jsonb;
BEGIN
  -- Validate inputs
  IF p_tenant_name IS NULL OR trim(p_tenant_name) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Nome da loja é obrigatório'
    );
  END IF;

  IF p_tenant_slug IS NULL OR trim(p_tenant_slug) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Slug é obrigatório'
    );
  END IF;

  IF p_admin_email IS NULL OR trim(p_admin_email) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Email do administrador é obrigatório'
    );
  END IF;

  IF p_admin_name IS NULL OR trim(p_admin_name) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Nome do administrador é obrigatório'
    );
  END IF;

  IF p_admin_password IS NULL OR length(p_admin_password) < 6 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Senha deve ter pelo menos 6 caracteres'
    );
  END IF;

  -- Check if slug already exists
  IF EXISTS (SELECT 1 FROM tenants WHERE slug = p_tenant_slug) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Este slug já está em uso. Escolha outro.'
    );
  END IF;

  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_admin_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Este email já está em uso. Escolha outro.'
    );
  END IF;

  BEGIN
    -- Generate user ID
    v_user_id := gen_random_uuid();

    -- Create user in auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      p_admin_email,
      crypt(p_admin_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('name', p_admin_name),
      false,
      'authenticated'
    );

    -- Create user in public.users
    INSERT INTO users (
      id,
      email,
      name,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      p_admin_email,
      p_admin_name,
      now(),
      now()
    );

    -- Generate tenant ID
    v_tenant_id := gen_random_uuid();

    -- Create tenant
    INSERT INTO tenants (
      id,
      name,
      slug,
      description,
      status,
      owner_id,
      settings,
      created_at,
      updated_at
    ) VALUES (
      v_tenant_id,
      p_tenant_name,
      p_tenant_slug,
      COALESCE(p_tenant_description, ''),
      'active',
      v_user_id,
      COALESCE(p_tenant_settings, '{}'),
      now(),
      now()
    );

    -- Create tenant_users relationship
    INSERT INTO tenant_users (
      id,
      tenant_id,
      user_id,
      role,
      permissions,
      is_active,
      joined_at,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_tenant_id,
      v_user_id,
      'owner',
      '{"all": true}',
      true,
      now(),
      now()
    );

    -- Generate subscription ID
    v_subscription_id := gen_random_uuid();

    -- Create default subscription
    INSERT INTO tenant_subscriptions (
      id,
      tenant_id,
      plan,
      status,
      price_monthly,
      features,
      limits,
      current_period_start,
      current_period_end,
      created_at,
      updated_at
    ) VALUES (
      v_subscription_id,
      v_tenant_id,
      'free',
      'active',
      0,
      '{"products": true, "orders": true, "customers": true}',
      '{"products": 100, "orders": 1000, "storage": "1GB"}',
      now(),
      now() + interval '1 month',
      now(),
      now()
    );

    -- Return success
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Loja criada com sucesso',
      'data', jsonb_build_object(
        'tenant_id', v_tenant_id,
        'user_id', v_user_id,
        'subscription_id', v_subscription_id
      )
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- Return error
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Erro interno: ' || SQLERRM
      );
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_tenant_with_user TO authenticated;

-- Grant execute permission to anon users (for public registration)
GRANT EXECUTE ON FUNCTION create_tenant_with_user TO anon;