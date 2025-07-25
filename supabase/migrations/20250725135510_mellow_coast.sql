/*
  # Criar usuário admin padrão

  1. Função para criar usuário admin
    - Cria usuário no auth.users
    - Cria perfil na tabela users
    - Adiciona à tabela admin_users
  2. Executa a criação do admin padrão
*/

-- Função para criar usuário admin
CREATE OR REPLACE FUNCTION create_admin_user(
  p_email text,
  p_password text,
  p_name text
) RETURNS json AS $$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  -- Verificar se o usuário já existe
  SELECT id INTO new_user_id 
  FROM auth.users 
  WHERE email = p_email;
  
  IF new_user_id IS NOT NULL THEN
    -- Usuário já existe, apenas tornar admin
    INSERT INTO admin_users (user_id, role, is_super_admin)
    VALUES (new_user_id, 'admin', true)
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'admin',
      is_super_admin = true,
      updated_at = now();
    
    result := json_build_object(
      'success', true,
      'message', 'Usuário existente promovido a admin',
      'user_id', new_user_id
    );
  ELSE
    -- Criar novo usuário
    new_user_id := gen_random_uuid();
    
    -- Inserir no auth.users (simulado - em produção seria via Supabase Auth)
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data
    ) VALUES (
      new_user_id,
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      json_build_object('name', p_name)
    );
    
    -- Criar perfil
    INSERT INTO users (id, email, name)
    VALUES (new_user_id, p_email, p_name);
    
    -- Tornar admin
    INSERT INTO admin_users (user_id, role, is_super_admin)
    VALUES (new_user_id, 'admin', true);
    
    result := json_build_object(
      'success', true,
      'message', 'Admin criado com sucesso',
      'user_id', new_user_id
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar usuário admin padrão
SELECT create_admin_user(
  'admin@mooda.com',
  'admin123',
  'Administrador Sistema'
);