/*
  # Criar Usuários de Demonstração

  1. Criar usuário admin do sistema
  2. Criar usuários para cada tenant
  3. Associar usuários aos tenants
  4. Definir senhas padrão para demonstração
*/

-- Função para criar usuário com senha (simulação para desenvolvimento)
CREATE OR REPLACE FUNCTION create_demo_user(
  p_email text,
  p_password text,
  p_name text,
  p_is_admin boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Gerar UUID para o usuário
  user_id := gen_random_uuid();
  
  -- Inserir na tabela auth.users (simulação)
  -- Em produção, isso seria feito via Supabase Auth
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES (
    user_id,
    p_email,
    crypt(p_password, gen_salt('bf')), -- Hash da senha
    now(),
    now(),
    now(),
    jsonb_build_object('name', p_name)
  );
  
  -- Se for admin, adicionar à tabela admin_users
  IF p_is_admin THEN
    INSERT INTO admin_users (user_id, role, is_super_admin)
    VALUES (user_id, 'admin', true);
  END IF;
  
  RETURN user_id;
END;
$$;

-- Criar usuário admin do sistema
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  admin_user_id := create_demo_user(
    'admin@mooda.com',
    'admin123',
    'Administrador do Sistema',
    true
  );
  
  RAISE NOTICE 'Admin criado: admin@mooda.com / admin123';
END $$;

-- Criar usuários para cada tenant
DO $$
DECLARE
  tenant_record RECORD;
  user_id uuid;
  tenant_emails text[] := ARRAY[
    'loja@moda-bella.com',
    'admin@tech-store-pro.com', 
    'gerente@casa-decoracao.com',
    'dono@esporte-total.com',
    'admin@beleza-natural.com',
    'livreiro@livraria-saber.com',
    'veterinario@pet-shop-amigo.com',
    'chef@gourmet-express.com',
    'jardineiro@jardim-verde.com',
    'artista@arte-craft.com'
  ];
  tenant_names text[] := ARRAY[
    'Maria Silva - Moda Bella',
    'João Tech - Tech Store Pro',
    'Ana Decoração - Casa & Decoração', 
    'Carlos Esporte - Esporte Total',
    'Fernanda Beleza - Beleza Natural',
    'Pedro Livros - Livraria Saber',
    'Juliana Pet - Pet Shop Amigo',
    'Ricardo Gourmet - Gourmet Express',
    'Camila Verde - Jardim Verde',
    'Lucas Arte - Arte & Craft'
  ];
  i integer := 1;
BEGIN
  FOR tenant_record IN SELECT id, slug, name FROM tenants ORDER BY created_at LOOP
    -- Criar usuário para o tenant
    user_id := create_demo_user(
      tenant_emails[i],
      'loja123',
      tenant_names[i],
      false
    );
    
    -- Associar usuário ao tenant como owner
    UPDATE tenants 
    SET owner_id = user_id 
    WHERE id = tenant_record.id;
    
    -- Adicionar à tabela tenant_users
    INSERT INTO tenant_users (
      tenant_id,
      user_id,
      role,
      permissions,
      is_active
    ) VALUES (
      tenant_record.id,
      user_id,
      'owner',
      '{"manage_products": true, "manage_orders": true, "manage_settings": true}',
      true
    );
    
    RAISE NOTICE 'Usuário criado para %: % / loja123', tenant_record.name, tenant_emails[i];
    
    i := i + 1;
  END LOOP;
END $$;

-- Função para validar login (para desenvolvimento)
CREATE OR REPLACE FUNCTION validate_user_login(p_email text, p_password text)
RETURNS TABLE(
  user_id uuid,
  email text,
  name text,
  is_admin boolean,
  tenant_id uuid,
  tenant_slug text,
  tenant_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record auth.users%ROWTYPE;
  is_admin_user boolean := false;
  user_tenant_id uuid;
  user_tenant_slug text;
  user_tenant_name text;
BEGIN
  -- Buscar usuário
  SELECT * INTO user_record
  FROM auth.users 
  WHERE auth.users.email = p_email
  AND auth.users.encrypted_password = crypt(p_password, auth.users.encrypted_password);
  
  IF NOT FOUND THEN
    RETURN; -- Login inválido
  END IF;
  
  -- Verificar se é admin
  SELECT EXISTS(
    SELECT 1 FROM admin_users WHERE admin_users.user_id = user_record.id
  ) INTO is_admin_user;
  
  -- Se não for admin, buscar tenant
  IF NOT is_admin_user THEN
    SELECT tu.tenant_id, t.slug, t.name
    INTO user_tenant_id, user_tenant_slug, user_tenant_name
    FROM tenant_users tu
    JOIN tenants t ON t.id = tu.tenant_id
    WHERE tu.user_id = user_record.id
    AND tu.is_active = true
    LIMIT 1;
  END IF;
  
  RETURN QUERY
  SELECT 
    user_record.id,
    user_record.email,
    (user_record.raw_user_meta_data->>'name')::text,
    is_admin_user,
    user_tenant_id,
    user_tenant_slug,
    user_tenant_name;
END;
$$;

-- Permitir execução das funções
GRANT EXECUTE ON FUNCTION create_demo_user(text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_user_login(text, text) TO anon, authenticated;