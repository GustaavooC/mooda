/*
  # Seed de Dados Mock Realistas

  1. Criar 10 lojas com dados realistas
  2. Criar usuários demo para cada loja
  3. Criar produtos variados para cada loja
  4. Criar clientes para cada loja
  5. Criar pedidos com relacionamentos corretos
  6. Atualizar métricas
*/

-- Limpar dados existentes (exceto cores e tamanhos globais)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM customers;
DELETE FROM product_images;
DELETE FROM product_variations;
DELETE FROM products;
DELETE FROM categories WHERE tenant_id IS NOT NULL;
DELETE FROM tenant_subscriptions;
DELETE FROM tenant_users;
DELETE FROM tenant_metrics;
DELETE FROM system_metrics;
DELETE FROM tenants;

-- Inserir 10 lojas realistas
INSERT INTO tenants (name, slug, description, status, settings) VALUES
('Moda Bella', 'moda-bella', 'Roupas femininas elegantes e modernas', 'active', '{"theme": "fashion", "currency": "BRL", "colors": {"primary": "#E91E63", "secondary": "#F8BBD9"}}'),
('Tech Store Pro', 'tech-store-pro', 'Eletrônicos e gadgets de última geração', 'active', '{"theme": "tech", "currency": "BRL", "colors": {"primary": "#2196F3", "secondary": "#BBDEFB"}}'),
('Casa & Decoração', 'casa-decoracao', 'Móveis e objetos decorativos para sua casa', 'active', '{"theme": "home", "currency": "BRL", "colors": {"primary": "#4CAF50", "secondary": "#C8E6C9"}}'),
('Esporte Total', 'esporte-total', 'Artigos esportivos e fitness', 'active', '{"theme": "sports", "currency": "BRL", "colors": {"primary": "#FF5722", "secondary": "#FFCCBC"}}'),
('Beleza Natural', 'beleza-natural', 'Cosméticos e produtos de beleza', 'active', '{"theme": "beauty", "currency": "BRL", "colors": {"primary": "#9C27B0", "secondary": "#E1BEE7"}}'),
('Livraria Saber', 'livraria-saber', 'Livros, revistas e material educativo', 'active', '{"theme": "books", "currency": "BRL", "colors": {"primary": "#795548", "secondary": "#D7CCC8"}}'),
('Pet Shop Amigo', 'pet-shop-amigo', 'Produtos para pets e animais de estimação', 'active', '{"theme": "pets", "currency": "BRL", "colors": {"primary": "#FF9800", "secondary": "#FFE0B2"}}'),
('Gourmet Express', 'gourmet-express', 'Alimentos gourmet e bebidas especiais', 'active', '{"theme": "food", "currency": "BRL", "colors": {"primary": "#F44336", "secondary": "#FFCDD2"}}'),
('Jardim Verde', 'jardim-verde', 'Plantas, sementes e equipamentos de jardinagem', 'active', '{"theme": "garden", "currency": "BRL", "colors": {"primary": "#8BC34A", "secondary": "#DCEDC8"}}'),
('Arte & Craft', 'arte-craft', 'Materiais artísticos e artesanato', 'trial', '{"theme": "art", "currency": "BRL", "colors": {"primary": "#673AB7", "secondary": "#D1C4E9"}}');

-- Criar assinaturas para cada loja
INSERT INTO tenant_subscriptions (tenant_id, plan, status, price_monthly, features, limits)
SELECT 
  t.id,
  CASE 
    WHEN t.slug IN ('moda-bella', 'tech-store-pro', 'casa-decoracao') THEN 'premium'::subscription_plan
    WHEN t.slug IN ('esporte-total', 'beleza-natural', 'livraria-saber') THEN 'basic'::subscription_plan
    ELSE 'free'::subscription_plan
  END,
  CASE WHEN t.status = 'trial' THEN 'trial' ELSE 'active' END,
  CASE 
    WHEN t.slug IN ('moda-bella', 'tech-store-pro', 'casa-decoracao') THEN 99.90
    WHEN t.slug IN ('esporte-total', 'beleza-natural', 'livraria-saber') THEN 49.90
    ELSE 0
  END,
  CASE 
    WHEN t.slug IN ('moda-bella', 'tech-store-pro', 'casa-decoracao') THEN '{"products": true, "variations": true, "advanced_analytics": true, "custom_domain": true, "priority_support": true}'
    WHEN t.slug IN ('esporte-total', 'beleza-natural', 'livraria-saber') THEN '{"products": true, "variations": true, "basic_analytics": true, "email_support": true}'
    ELSE '{"products": true, "variations": true, "basic_analytics": true}'
  END::jsonb,
  CASE 
    WHEN t.slug IN ('moda-bella', 'tech-store-pro', 'casa-decoracao') THEN '{"max_products": 1000, "max_variations": 5000, "max_users": 10}'
    WHEN t.slug IN ('esporte-total', 'beleza-natural', 'livraria-saber') THEN '{"max_products": 200, "max_variations": 1000, "max_users": 5}'
    ELSE '{"max_products": 50, "max_variations": 200, "max_users": 2}'
  END::jsonb
FROM tenants t;

-- Criar categorias para cada loja
DO $$
DECLARE
  tenant_record RECORD;
  category_id uuid;
BEGIN
  FOR tenant_record IN SELECT id, slug FROM tenants LOOP
    CASE tenant_record.slug
      WHEN 'moda-bella' THEN
        INSERT INTO categories (name, description, tenant_id) VALUES
        ('Vestidos', 'Vestidos para todas as ocasiões', tenant_record.id),
        ('Blusas', 'Blusas e camisetas femininas', tenant_record.id),
        ('Calças', 'Calças e leggings', tenant_record.id),
        ('Acessórios', 'Bolsas, joias e acessórios', tenant_record.id),
        ('Sapatos', 'Calçados femininos', tenant_record.id);
        
      WHEN 'tech-store-pro' THEN
        INSERT INTO categories (name, description, tenant_id) VALUES
        ('Smartphones', 'Celulares e acessórios', tenant_record.id),
        ('Notebooks', 'Laptops e computadores', tenant_record.id),
        ('Gadgets', 'Eletrônicos e gadgets', tenant_record.id),
        ('Gaming', 'Produtos para gamers', tenant_record.id),
        ('Acessórios', 'Cabos, carregadores e mais', tenant_record.id);
        
      WHEN 'casa-decoracao' THEN
        INSERT INTO categories (name, description, tenant_id) VALUES
        ('Móveis', 'Móveis para todos os ambientes', tenant_record.id),
        ('Decoração', 'Objetos decorativos', tenant_record.id),
        ('Iluminação', 'Luminárias e lâmpadas', tenant_record.id),
        ('Têxtil', 'Cortinas, almofadas e tapetes', tenant_record.id),
        ('Cozinha', 'Utensílios e decoração para cozinha', tenant_record.id);
        
      WHEN 'esporte-total' THEN
        INSERT INTO categories (name, description, tenant_id) VALUES
        ('Fitness', 'Equipamentos de academia', tenant_record.id),
        ('Futebol', 'Produtos para futebol', tenant_record.id),
        ('Corrida', 'Tênis e acessórios para corrida', tenant_record.id),
        ('Natação', 'Produtos para natação', tenant_record.id),
        ('Suplementos', 'Suplementos alimentares', tenant_record.id);
        
      WHEN 'beleza-natural' THEN
        INSERT INTO categories (name, description, tenant_id) VALUES
        ('Maquiagem', 'Produtos de maquiagem', tenant_record.id),
        ('Skincare', 'Cuidados com a pele', tenant_record.id),
        ('Cabelos', 'Produtos para cabelos', tenant_record.id),
        ('Perfumes', 'Perfumes e fragrâncias', tenant_record.id),
        ('Unhas', 'Esmaltes e cuidados com unhas', tenant_record.id);
        
      ELSE
        INSERT INTO categories (name, description, tenant_id) VALUES
        ('Categoria 1', 'Primeira categoria', tenant_record.id),
        ('Categoria 2', 'Segunda categoria', tenant_record.id),
        ('Categoria 3', 'Terceira categoria', tenant_record.id);
    END CASE;
  END LOOP;
END $$;

-- Criar produtos para cada loja
DO $$
DECLARE
  tenant_record RECORD;
  category_record RECORD;
  product_id uuid;
  color_record RECORD;
  size_record RECORD;
  i integer;
  j integer;
BEGIN
  FOR tenant_record IN SELECT id, slug FROM tenants LOOP
    i := 1;
    FOR category_record IN SELECT id, name FROM categories WHERE tenant_id = tenant_record.id LOOP
      FOR j IN 1..4 LOOP -- 4 produtos por categoria
        CASE tenant_record.slug
          WHEN 'moda-bella' THEN
            INSERT INTO products (name, description, category_id, brand, sku, tenant_id) VALUES
            (
              CASE category_record.name
                WHEN 'Vestidos' THEN 'Vestido ' || CASE j WHEN 1 THEN 'Floral Elegante' WHEN 2 THEN 'Social Preto' WHEN 3 THEN 'Casual Listrado' ELSE 'Festa Dourado' END
                WHEN 'Blusas' THEN 'Blusa ' || CASE j WHEN 1 THEN 'Básica Cotton' WHEN 2 THEN 'Social Seda' WHEN 3 THEN 'Estampada Floral' ELSE 'Cropped Moderna' END
                WHEN 'Calças' THEN 'Calça ' || CASE j WHEN 1 THEN 'Jeans Skinny' WHEN 2 THEN 'Social Alfaiataria' WHEN 3 THEN 'Legging Fitness' ELSE 'Pantalona Fluida' END
                WHEN 'Acessórios' THEN CASE j WHEN 1 THEN 'Bolsa Couro Premium' WHEN 2 THEN 'Colar Dourado' WHEN 3 THEN 'Óculos de Sol' ELSE 'Carteira Feminina' END
                ELSE 'Sapato ' || CASE j WHEN 1 THEN 'Scarpin Clássico' WHEN 2 THEN 'Tênis Casual' WHEN 3 THEN 'Sandália Salto' ELSE 'Bota Cano Longo' END
              END,
              'Produto de alta qualidade da linha ' || category_record.name || '. Perfeito para o dia a dia e ocasiões especiais.',
              category_record.id,
              'Bella Fashion',
              'MB-' || LPAD(i::text, 4, '0'),
              tenant_record.id
            ) RETURNING id INTO product_id;
            
          WHEN 'tech-store-pro' THEN
            INSERT INTO products (name, description, category_id, brand, sku, tenant_id) VALUES
            (
              CASE category_record.name
                WHEN 'Smartphones' THEN CASE j WHEN 1 THEN 'iPhone 15 Pro Max' WHEN 2 THEN 'Samsung Galaxy S24' WHEN 3 THEN 'Xiaomi 14 Ultra' ELSE 'Google Pixel 8' END
                WHEN 'Notebooks' THEN CASE j WHEN 1 THEN 'MacBook Pro M3' WHEN 2 THEN 'Dell XPS 13' WHEN 3 THEN 'Lenovo ThinkPad' ELSE 'ASUS ROG Gaming' END
                WHEN 'Gadgets' THEN CASE j WHEN 1 THEN 'Apple Watch Series 9' WHEN 2 THEN 'AirPods Pro 2' WHEN 3 THEN 'iPad Air M2' ELSE 'Smart TV 55"' END
                WHEN 'Gaming' THEN CASE j WHEN 1 THEN 'PlayStation 5' WHEN 2 THEN 'Xbox Series X' WHEN 3 THEN 'Nintendo Switch' ELSE 'Headset Gamer RGB' END
                ELSE CASE j WHEN 1 THEN 'Carregador Wireless' WHEN 2 THEN 'Cabo USB-C Premium' WHEN 3 THEN 'Power Bank 20000mAh' ELSE 'Suporte Notebook' END
              END,
              'Tecnologia de ponta com garantia e suporte técnico especializado.',
              category_record.id,
              CASE j WHEN 1 THEN 'Apple' WHEN 2 THEN 'Samsung' WHEN 3 THEN 'Xiaomi' ELSE 'TechPro' END,
              'TP-' || LPAD(i::text, 4, '0'),
              tenant_record.id
            ) RETURNING id INTO product_id;
            
          ELSE
            INSERT INTO products (name, description, category_id, brand, sku, tenant_id) VALUES
            (
              'Produto ' || i || ' - ' || category_record.name,
              'Descrição detalhada do produto ' || i || ' da categoria ' || category_record.name,
              category_record.id,
              'Marca Exemplo',
              tenant_record.slug || '-' || LPAD(i::text, 4, '0'),
              tenant_record.id
            ) RETURNING id INTO product_id;
        END CASE;
        
        -- Criar variações para cada produto
        FOR color_record IN SELECT id, name FROM colors ORDER BY random() LIMIT 3 LOOP
          FOR size_record IN SELECT id, name FROM sizes WHERE category = 'clothing' ORDER BY random() LIMIT 2 LOOP
            INSERT INTO product_variations (
              product_id, 
              color_id, 
              size_id, 
              price, 
              promotional_price,
              stock_quantity, 
              sku, 
              tenant_id
            ) VALUES (
              product_id,
              color_record.id,
              size_record.id,
              CASE tenant_record.slug
                WHEN 'moda-bella' THEN (random() * 200 + 50)::numeric(10,2)
                WHEN 'tech-store-pro' THEN (random() * 3000 + 500)::numeric(10,2)
                WHEN 'casa-decoracao' THEN (random() * 800 + 100)::numeric(10,2)
                WHEN 'esporte-total' THEN (random() * 300 + 80)::numeric(10,2)
                WHEN 'beleza-natural' THEN (random() * 150 + 30)::numeric(10,2)
                ELSE (random() * 100 + 20)::numeric(10,2)
              END,
              CASE WHEN random() > 0.7 THEN 
                CASE tenant_record.slug
                  WHEN 'moda-bella' THEN (random() * 150 + 30)::numeric(10,2)
                  WHEN 'tech-store-pro' THEN (random() * 2500 + 400)::numeric(10,2)
                  ELSE (random() * 80 + 15)::numeric(10,2)
                END
              ELSE NULL END,
              (random() * 50 + 5)::integer,
              tenant_record.slug || '-' || LPAD(i::text, 4, '0') || '-' || color_record.name || '-' || size_record.name,
              tenant_record.id
            );
          END LOOP;
        END LOOP;
        
        i := i + 1;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- Criar clientes para cada loja
DO $$
DECLARE
  tenant_record RECORD;
  customer_names text[] := ARRAY[
    'Ana Silva', 'Carlos Santos', 'Maria Oliveira', 'João Pereira', 'Fernanda Costa',
    'Ricardo Lima', 'Juliana Alves', 'Pedro Rodrigues', 'Camila Ferreira', 'Lucas Martins',
    'Beatriz Souza', 'Rafael Barbosa', 'Larissa Gomes', 'Thiago Ribeiro', 'Gabriela Dias'
  ];
  customer_emails text[] := ARRAY[
    'ana.silva@email.com', 'carlos.santos@email.com', 'maria.oliveira@email.com', 
    'joao.pereira@email.com', 'fernanda.costa@email.com', 'ricardo.lima@email.com',
    'juliana.alves@email.com', 'pedro.rodrigues@email.com', 'camila.ferreira@email.com',
    'lucas.martins@email.com', 'beatriz.souza@email.com', 'rafael.barbosa@email.com',
    'larissa.gomes@email.com', 'thiago.ribeiro@email.com', 'gabriela.dias@email.com'
  ];
  i integer;
BEGIN
  FOR tenant_record IN SELECT id, slug FROM tenants LOOP
    FOR i IN 1..5 LOOP
      INSERT INTO customers (tenant_id, email, name, phone, address) VALUES
      (
        tenant_record.id,
        REPLACE(customer_emails[i], '@email.com', '+' || tenant_record.slug || '@email.com'),
        customer_names[i],
        '(11) 9' || LPAD((random() * 99999999)::integer::text, 8, '0'),
        jsonb_build_object(
          'street', 'Rua das Flores, ' || (random() * 999 + 1)::integer,
          'city', 'São Paulo',
          'state', 'SP',
          'zipcode', LPAD((random() * 99999)::integer::text, 5, '0') || '-' || LPAD((random() * 999)::integer::text, 3, '0'),
          'country', 'Brasil'
        )
      );
    END LOOP;
  END LOOP;
END $$;

-- Criar pedidos para cada loja
DO $$
DECLARE
  tenant_record RECORD;
  customer_record RECORD;
  variation_record RECORD;
  order_id uuid;
  order_total numeric(12,2);
  i integer;
  j integer;
BEGIN
  FOR tenant_record IN SELECT id, slug FROM tenants LOOP
    i := 1;
    FOR customer_record IN SELECT id FROM customers WHERE tenant_id = tenant_record.id LOOP
      FOR j IN 1..2 LOOP -- 2 pedidos por cliente
        order_total := 0;
        
        INSERT INTO orders (
          tenant_id, 
          customer_id, 
          status, 
          payment_status,
          payment_method,
          shipping_address,
          billing_address,
          created_at
        ) VALUES (
          tenant_record.id,
          customer_record.id,
          CASE (random() * 4)::integer 
            WHEN 0 THEN 'pending'
            WHEN 1 THEN 'processing'
            WHEN 2 THEN 'shipped'
            ELSE 'delivered'
          END,
          CASE (random() * 3)::integer
            WHEN 0 THEN 'pending'
            WHEN 1 THEN 'paid'
            ELSE 'failed'
          END,
          CASE (random() * 3)::integer
            WHEN 0 THEN 'credit_card'
            WHEN 1 THEN 'pix'
            ELSE 'boleto'
          END,
          jsonb_build_object(
            'street', 'Rua das Entregas, ' || (random() * 999 + 1)::integer,
            'city', 'São Paulo',
            'state', 'SP',
            'zipcode', LPAD((random() * 99999)::integer::text, 5, '0') || '-' || LPAD((random() * 999)::integer::text, 3, '0')
          ),
          jsonb_build_object(
            'street', 'Rua das Cobranças, ' || (random() * 999 + 1)::integer,
            'city', 'São Paulo',
            'state', 'SP',
            'zipcode', LPAD((random() * 99999)::integer::text, 5, '0') || '-' || LPAD((random() * 999)::integer::text, 3, '0')
          ),
          now() - (random() * interval '30 days')
        ) RETURNING id INTO order_id;
        
        -- Adicionar itens ao pedido
        FOR variation_record IN 
          SELECT id, price FROM product_variations 
          WHERE tenant_id = tenant_record.id 
          ORDER BY random() 
          LIMIT (random() * 3 + 1)::integer 
        LOOP
          INSERT INTO order_items (
            order_id,
            product_variation_id,
            quantity,
            unit_price,
            total_price
          ) VALUES (
            order_id,
            variation_record.id,
            (random() * 3 + 1)::integer,
            variation_record.price,
            variation_record.price * (random() * 3 + 1)::integer
          );
          
          order_total := order_total + (variation_record.price * (random() * 3 + 1)::integer);
        END LOOP;
        
        -- Atualizar total do pedido
        UPDATE orders SET 
          subtotal = order_total,
          shipping_amount = CASE WHEN order_total > 100 THEN 0 ELSE 15.90 END,
          total_amount = order_total + CASE WHEN order_total > 100 THEN 0 ELSE 15.90 END
        WHERE id = order_id;
        
        i := i + 1;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- Atualizar métricas para todas as lojas
SELECT update_tenant_metrics(id) FROM tenants;
SELECT update_system_metrics();

-- Inserir métricas históricas (últimos 30 dias)
DO $$
DECLARE
  tenant_record RECORD;
  date_record date;
  base_products integer;
  base_orders integer;
  base_revenue numeric;
BEGIN
  FOR tenant_record IN SELECT id FROM tenants LOOP
    -- Obter métricas base
    SELECT total_products, total_orders, total_revenue 
    INTO base_products, base_orders, base_revenue
    FROM tenant_metrics 
    WHERE tenant_id = tenant_record.id 
    AND metric_date = CURRENT_DATE;
    
    -- Inserir métricas dos últimos 30 dias
    FOR i IN 1..29 LOOP
      date_record := CURRENT_DATE - i;
      
      INSERT INTO tenant_metrics (
        tenant_id,
        metric_date,
        total_products,
        total_variations,
        total_orders,
        total_revenue,
        active_customers,
        page_views,
        conversion_rate
      ) VALUES (
        tenant_record.id,
        date_record,
        GREATEST(1, base_products - (random() * 5)::integer),
        GREATEST(1, (base_products - (random() * 5)::integer) * 3),
        GREATEST(0, base_orders - (random() * 3)::integer),
        GREATEST(0, base_revenue - (random() * 1000)),
        (random() * 20 + 5)::integer,
        (random() * 500 + 100)::integer,
        (random() * 5 + 1)::numeric(5,2)
      );
    END LOOP;
  END LOOP;
END $$;

-- Inserir métricas do sistema dos últimos 30 dias
DO $$
DECLARE
  date_record date;
  base_tenants integer;
  base_users integer;
BEGIN
  SELECT total_tenants, total_users 
  INTO base_tenants, base_users
  FROM system_metrics 
  WHERE metric_date = CURRENT_DATE;
  
  FOR i IN 1..29 LOOP
    date_record := CURRENT_DATE - i;
    
    INSERT INTO system_metrics (
      metric_date,
      total_tenants,
      active_tenants,
      total_users,
      total_revenue,
      new_signups,
      churn_rate,
      mrr
    ) VALUES (
      date_record,
      GREATEST(1, base_tenants - (random() * 2)::integer),
      GREATEST(1, (base_tenants - (random() * 2)::integer) - 1),
      GREATEST(1, base_users - (random() * 10)::integer),
      (random() * 50000 + 10000)::numeric(12,2),
      (random() * 5 + 1)::integer,
      (random() * 3)::numeric(5,2),
      (random() * 10000 + 5000)::numeric(12,2)
    );
  END LOOP;
END $$;