/*
  # Sistema Multi-Tenant Completo

  1. Novas Tabelas
    - `tenants` - Lojas/inquilinos do sistema
    - `tenant_users` - Usuários associados aos tenants
    - `tenant_subscriptions` - Planos e assinaturas
    - `tenant_metrics` - Métricas agregadas por tenant
    - `admin_users` - Usuários administradores do sistema
    - `system_metrics` - Métricas globais do sistema

  2. Modificações nas Tabelas Existentes
    - Adicionar `tenant_id` em todas as tabelas de produtos
    - Atualizar políticas RLS para isolamento por tenant

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas específicas para isolamento de dados
    - Autenticação separada para admin e tenants

  4. Funcionalidades
    - Slugs únicos para cada tenant
    - Métricas em tempo real
    - Sistema de assinaturas
    - Dashboard administrativo
*/

-- Criar enum para status do tenant
CREATE TYPE tenant_status AS ENUM ('active', 'inactive', 'suspended', 'trial');

-- Criar enum para tipos de plano
CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'premium', 'enterprise');

-- Tabela de tenants (lojas)
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  logo_url text,
  domain text,
  status tenant_status DEFAULT 'trial',
  owner_id uuid REFERENCES auth.users(id),
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de usuários do tenant
CREATE TABLE IF NOT EXISTS tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  permissions jsonb DEFAULT '{}',
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz,
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  plan subscription_plan DEFAULT 'free',
  status text DEFAULT 'active',
  price_monthly numeric(10,2) DEFAULT 0,
  features jsonb DEFAULT '{}',
  limits jsonb DEFAULT '{}',
  trial_ends_at timestamptz,
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT now() + interval '1 month',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de métricas por tenant
CREATE TABLE IF NOT EXISTS tenant_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  metric_date date DEFAULT CURRENT_DATE,
  total_products integer DEFAULT 0,
  total_variations integer DEFAULT 0,
  total_orders integer DEFAULT 0,
  total_revenue numeric(12,2) DEFAULT 0,
  active_customers integer DEFAULT 0,
  page_views integer DEFAULT 0,
  conversion_rate numeric(5,2) DEFAULT 0,
  avg_order_value numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, metric_date)
);

-- Tabela de usuários admin do sistema
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role text DEFAULT 'admin',
  permissions jsonb DEFAULT '{}',
  is_super_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de métricas globais do sistema
CREATE TABLE IF NOT EXISTS system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date DEFAULT CURRENT_DATE,
  total_tenants integer DEFAULT 0,
  active_tenants integer DEFAULT 0,
  total_users integer DEFAULT 0,
  total_revenue numeric(12,2) DEFAULT 0,
  new_signups integer DEFAULT 0,
  churn_rate numeric(5,2) DEFAULT 0,
  mrr numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(metric_date)
);

-- Adicionar tenant_id às tabelas existentes
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_metrics_tenant_id ON tenant_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_metrics_date ON tenant_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_tenant_id ON product_variations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_images_tenant_id ON product_images(tenant_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tenants
CREATE POLICY "Tenants can read own data"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_id = tenants.id AND user_id = auth.uid() AND is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant owners can update own tenant"
  ON tenants
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can manage all tenants"
  ON tenants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas RLS para tenant_users
CREATE POLICY "Tenant users can read own tenant users"
  ON tenant_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM tenant_users tu 
      WHERE tu.tenant_id = tenant_users.tenant_id 
      AND tu.user_id = auth.uid() 
      AND tu.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas RLS para tenant_subscriptions
CREATE POLICY "Tenant members can read own subscription"
  ON tenant_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_id = tenant_subscriptions.tenant_id 
      AND user_id = auth.uid() 
      AND is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas RLS para tenant_metrics
CREATE POLICY "Tenant members can read own metrics"
  ON tenant_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_id = tenant_metrics.tenant_id 
      AND user_id = auth.uid() 
      AND is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas RLS para admin_users
CREATE POLICY "Admins can read admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas RLS para system_metrics
CREATE POLICY "Admins can read system metrics"
  ON system_metrics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Atualizar políticas das tabelas existentes para incluir tenant_id
DROP POLICY IF EXISTS "Allow authenticated users full access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;

CREATE POLICY "Tenant members can manage own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_id = categories.tenant_id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Public can read active tenant categories"
  ON categories
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE id = categories.tenant_id 
      AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Allow authenticated users full access to products" ON products;
DROP POLICY IF EXISTS "Allow public read access to products" ON products;

CREATE POLICY "Tenant members can manage own products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_id = products.tenant_id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Public can read active tenant products"
  ON products
  FOR SELECT
  TO anon
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE id = products.tenant_id 
      AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Allow authenticated users full access to product_variations" ON product_variations;
DROP POLICY IF EXISTS "Allow public read access to product_variations" ON product_variations;

CREATE POLICY "Tenant members can manage own product variations"
  ON product_variations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_id = product_variations.tenant_id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Public can read active tenant product variations"
  ON product_variations
  FOR SELECT
  TO anon
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE id = product_variations.tenant_id 
      AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Allow authenticated users full access to product_images" ON product_images;
DROP POLICY IF EXISTS "Allow public read access to product_images" ON product_images;

CREATE POLICY "Tenant members can manage own product images"
  ON product_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_id = product_images.tenant_id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Public can read active tenant product images"
  ON product_images
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE id = product_images.tenant_id 
      AND status = 'active'
    )
  );

-- Função para obter o tenant atual do usuário
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT tenant_id 
  FROM tenant_users 
  WHERE user_id = auth.uid() 
  AND is_active = true 
  LIMIT 1;
$$;

-- Função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  );
$$;

-- Função para atualizar métricas do tenant
CREATE OR REPLACE FUNCTION update_tenant_metrics(tenant_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO tenant_metrics (
    tenant_id,
    metric_date,
    total_products,
    total_variations
  )
  VALUES (
    tenant_uuid,
    CURRENT_DATE,
    (SELECT COUNT(*) FROM products WHERE tenant_id = tenant_uuid AND is_active = true),
    (SELECT COUNT(*) FROM product_variations WHERE tenant_id = tenant_uuid AND is_active = true)
  )
  ON CONFLICT (tenant_id, metric_date)
  DO UPDATE SET
    total_products = EXCLUDED.total_products,
    total_variations = EXCLUDED.total_variations,
    updated_at = now();
END;
$$;

-- Função para atualizar métricas do sistema
CREATE OR REPLACE FUNCTION update_system_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO system_metrics (
    metric_date,
    total_tenants,
    active_tenants,
    total_users
  )
  VALUES (
    CURRENT_DATE,
    (SELECT COUNT(*) FROM tenants),
    (SELECT COUNT(*) FROM tenants WHERE status = 'active'),
    (SELECT COUNT(*) FROM auth.users)
  )
  ON CONFLICT (metric_date)
  DO UPDATE SET
    total_tenants = EXCLUDED.total_tenants,
    active_tenants = EXCLUDED.active_tenants,
    total_users = EXCLUDED.total_users,
    updated_at = now();
END;
$$;

-- Triggers para atualizar métricas automaticamente
CREATE OR REPLACE FUNCTION trigger_update_tenant_metrics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM update_tenant_metrics(COALESCE(NEW.tenant_id, OLD.tenant_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION trigger_update_system_metrics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM update_system_metrics();
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar triggers
DROP TRIGGER IF EXISTS update_tenant_metrics_on_product_change ON products;
CREATE TRIGGER update_tenant_metrics_on_product_change
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_tenant_metrics();

DROP TRIGGER IF EXISTS update_tenant_metrics_on_variation_change ON product_variations;
CREATE TRIGGER update_tenant_metrics_on_variation_change
  AFTER INSERT OR UPDATE OR DELETE ON product_variations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_tenant_metrics();

DROP TRIGGER IF EXISTS update_system_metrics_on_tenant_change ON tenants;
CREATE TRIGGER update_system_metrics_on_tenant_change
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_system_metrics();

-- Inserir dados iniciais
INSERT INTO tenants (name, slug, description, status, settings) VALUES
('Loja Demo', 'demo', 'Loja de demonstração do sistema', 'active', '{"theme": "default", "currency": "BRL"}'),
('Fashion Store', 'fashion', 'Loja de moda e acessórios', 'active', '{"theme": "fashion", "currency": "BRL"}'),
('Tech Shop', 'tech', 'Loja de tecnologia e eletrônicos', 'trial', '{"theme": "tech", "currency": "BRL"}')
ON CONFLICT (slug) DO NOTHING;

-- Inserir planos de assinatura
INSERT INTO tenant_subscriptions (tenant_id, plan, status, price_monthly, features, limits)
SELECT 
  t.id,
  'free'::subscription_plan,
  'active',
  0,
  '{"products": true, "variations": true, "basic_analytics": true}',
  '{"max_products": 50, "max_variations": 200, "max_users": 2}'
FROM tenants t
WHERE t.slug IN ('demo', 'fashion', 'tech')
ON CONFLICT DO NOTHING;

-- Atualizar tenant_id nas tabelas existentes (assumindo que pertencem ao tenant demo)
DO $$
DECLARE
  demo_tenant_id uuid;
BEGIN
  SELECT id INTO demo_tenant_id FROM tenants WHERE slug = 'demo' LIMIT 1;
  
  IF demo_tenant_id IS NOT NULL THEN
    UPDATE categories SET tenant_id = demo_tenant_id WHERE tenant_id IS NULL;
    UPDATE products SET tenant_id = demo_tenant_id WHERE tenant_id IS NULL;
    UPDATE product_variations SET tenant_id = demo_tenant_id WHERE tenant_id IS NULL;
    UPDATE product_images SET tenant_id = demo_tenant_id WHERE tenant_id IS NULL;
  END IF;
END $$;

-- Atualizar métricas iniciais
SELECT update_system_metrics();
SELECT update_tenant_metrics(id) FROM tenants;