/*
  # Sistema de Pedidos e Clientes

  1. Novas Tabelas
    - `customers` - Clientes das lojas
    - `orders` - Pedidos realizados
    - `order_items` - Itens dos pedidos
    - `users` - Tabela de usuários (se não existir)

  2. Relacionamentos
    - Customers pertencem a tenants
    - Orders pertencem a customers e tenants
    - Order items conectam orders com product_variations

  3. Segurança
    - RLS habilitado
    - Políticas para isolamento por tenant
*/

-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  phone text,
  address jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  status text DEFAULT 'pending',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  shipping_amount numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_status text DEFAULT 'pending',
  payment_method text,
  shipping_address jsonb DEFAULT '{}',
  billing_address jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, order_number)
);

-- Criar tabela de itens do pedido
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_variation_id uuid NOT NULL REFERENCES product_variations(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_variation_id ON order_items(product_variation_id);

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para customers
CREATE POLICY "Tenant members can manage own customers"
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

CREATE POLICY "Public can read active tenant customers"
  ON customers
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE id = customers.tenant_id 
      AND status = 'active'
    )
  );

-- Políticas RLS para orders
CREATE POLICY "Tenant members can manage own orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_id = orders.tenant_id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Public can read active tenant orders"
  ON orders
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE id = orders.tenant_id 
      AND status = 'active'
    )
  );

-- Políticas RLS para order_items
CREATE POLICY "Users can manage order items through orders"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN tenant_users tu ON tu.tenant_id = o.tenant_id
      WHERE o.id = order_items.order_id
      AND tu.user_id = auth.uid()
      AND tu.is_active = true
    )
  );

CREATE POLICY "Public can read order items through orders"
  ON order_items
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN tenants t ON t.id = o.tenant_id
      WHERE o.id = order_items.order_id
      AND t.status = 'active'
    )
  );

-- Função para gerar número de pedido
CREATE OR REPLACE FUNCTION generate_order_number(tenant_uuid uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  order_count integer;
  tenant_slug text;
BEGIN
  -- Buscar slug do tenant
  SELECT slug INTO tenant_slug FROM tenants WHERE id = tenant_uuid;
  
  -- Contar pedidos existentes
  SELECT COUNT(*) INTO order_count FROM orders WHERE tenant_id = tenant_uuid;
  
  -- Retornar número formatado
  RETURN UPPER(tenant_slug) || '-' || LPAD((order_count + 1)::text, 6, '0');
END;
$$;

-- Trigger para gerar número do pedido automaticamente
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Atualizar função de métricas do tenant para incluir pedidos
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
    total_variations,
    total_orders,
    total_revenue,
    active_customers
  )
  VALUES (
    tenant_uuid,
    CURRENT_DATE,
    (SELECT COUNT(*) FROM products WHERE tenant_id = tenant_uuid AND is_active = true),
    (SELECT COUNT(*) FROM product_variations WHERE tenant_id = tenant_uuid AND is_active = true),
    (SELECT COUNT(*) FROM orders WHERE tenant_id = tenant_uuid),
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE tenant_id = tenant_uuid AND payment_status = 'paid'),
    (SELECT COUNT(DISTINCT customer_id) FROM orders WHERE tenant_id = tenant_uuid AND created_at >= CURRENT_DATE - INTERVAL '30 days')
  )
  ON CONFLICT (tenant_id, metric_date)
  DO UPDATE SET
    total_products = EXCLUDED.total_products,
    total_variations = EXCLUDED.total_variations,
    total_orders = EXCLUDED.total_orders,
    total_revenue = EXCLUDED.total_revenue,
    active_customers = EXCLUDED.active_customers,
    updated_at = now();
END;
$$;