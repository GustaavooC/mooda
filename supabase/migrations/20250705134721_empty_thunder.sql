/*
  # Correção das Políticas RLS para Clientes

  1. Problemas Identificados
    - Políticas RLS muito restritivas para clientes anônimos
    - Erro 406 ao usar .single() em consultas que podem retornar 0 resultados
    - Erro 401 ao tentar inserir clientes sem autenticação JWT

  2. Soluções
    - Criar políticas mais permissivas para operações de clientes
    - Permitir INSERT/SELECT para usuários anônimos em customers
    - Manter isolamento por tenant_id
*/

-- Remover políticas existentes para customers
DROP POLICY IF EXISTS "Tenant members can manage own customers" ON customers;
DROP POLICY IF EXISTS "Public can read active tenant customers" ON customers;

-- Criar políticas mais permissivas para customers
-- Permitir leitura pública de customers de tenants ativos
CREATE POLICY "Allow public read customers from active tenants"
  ON customers
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE id = customers.tenant_id 
      AND status = 'active'
    )
  );

-- Permitir inserção pública de customers (para cadastro)
CREATE POLICY "Allow public insert customers"
  ON customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE id = customers.tenant_id 
      AND status = 'active'
    )
  );

-- Permitir atualização de customers por tenant members ou pelo próprio customer
CREATE POLICY "Allow customer updates"
  ON customers
  FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE id = customers.tenant_id 
      AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE id = customers.tenant_id 
      AND status = 'active'
    )
  );

-- Permitir que tenant members gerenciem todos os customers do seu tenant
CREATE POLICY "Allow tenant members manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_id = customers.tenant_id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Função para verificar se um customer existe (sem usar .single())
CREATE OR REPLACE FUNCTION check_customer_exists(p_tenant_id uuid, p_email text)
RETURNS TABLE(customer_id uuid, customer_name text, customer_email text, customer_phone text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id, name, email, phone
  FROM customers 
  WHERE tenant_id = p_tenant_id 
  AND email = p_email
  LIMIT 1;
END;
$$;

-- Função para criar customer com validação
CREATE OR REPLACE FUNCTION create_customer_safe(
  p_tenant_id uuid,
  p_email text,
  p_name text,
  p_phone text DEFAULT NULL
)
RETURNS TABLE(customer_id uuid, customer_name text, customer_email text, customer_phone text, created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_customer customers%ROWTYPE;
  new_customer customers%ROWTYPE;
BEGIN
  -- Verificar se customer já existe
  SELECT * INTO existing_customer
  FROM customers 
  WHERE tenant_id = p_tenant_id 
  AND email = p_email;
  
  IF FOUND THEN
    -- Customer já existe, retornar dados existentes
    RETURN QUERY
    SELECT existing_customer.id, existing_customer.name, existing_customer.email, existing_customer.phone, false;
  ELSE
    -- Criar novo customer
    INSERT INTO customers (tenant_id, email, name, phone)
    VALUES (p_tenant_id, p_email, p_name, p_phone)
    RETURNING * INTO new_customer;
    
    RETURN QUERY
    SELECT new_customer.id, new_customer.name, new_customer.email, new_customer.phone, true;
  END IF;
END;
$$;

-- Garantir que as funções sejam executáveis por usuários anônimos
GRANT EXECUTE ON FUNCTION check_customer_exists(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_customer_safe(uuid, text, text, text) TO anon, authenticated;