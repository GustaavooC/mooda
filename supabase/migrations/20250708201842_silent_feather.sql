/*
  # Fix Tenant and User ID Mapping

  1. Updates
    - Handle existing users correctly
    - Use ON CONFLICT for email uniqueness
    - Update tenant IDs to consistent demo values
    - Maintain referential integrity

  2. Process
    - Find or create users with correct emails
    - Update tenant IDs and owner references
    - Update all related tables
    - Restore foreign key constraints
*/

-- Create temporary mapping table
CREATE TEMP TABLE tenant_id_mapping (
  old_id uuid,
  new_id uuid,
  slug text,
  user_id uuid,
  user_email text,
  user_name text
);

-- Generate new UUIDs for each tenant and store mapping
DO $$
DECLARE
  tenant_record RECORD;
  new_tenant_uuid uuid;
  new_user_uuid uuid;
  user_email text;
  user_name text;
  existing_user_id uuid;
BEGIN
  FOR tenant_record IN SELECT id, slug FROM tenants WHERE slug IN (
    'moda-bella', 'tech-store-pro', 'casa-decoracao', 'esporte-total', 
    'beleza-natural', 'livraria-saber', 'pet-shop-amigo', 'gourmet-express', 
    'jardim-verde', 'arte-craft'
  ) LOOP
    -- Generate specific UUIDs for demo consistency
    new_tenant_uuid := CASE tenant_record.slug
      WHEN 'moda-bella' THEN '11111111-1111-1111-1111-111111111111'::uuid
      WHEN 'tech-store-pro' THEN '22222222-2222-2222-2222-222222222222'::uuid
      WHEN 'casa-decoracao' THEN '33333333-3333-3333-3333-333333333333'::uuid
      WHEN 'esporte-total' THEN '44444444-4444-4444-4444-444444444444'::uuid
      WHEN 'beleza-natural' THEN '55555555-5555-5555-5555-555555555555'::uuid
      WHEN 'livraria-saber' THEN '66666666-6666-6666-6666-666666666666'::uuid
      WHEN 'pet-shop-amigo' THEN '77777777-7777-7777-7777-777777777777'::uuid
      WHEN 'gourmet-express' THEN '88888888-8888-8888-8888-888888888888'::uuid
      WHEN 'jardim-verde' THEN '99999999-9999-9999-9999-999999999999'::uuid
      WHEN 'arte-craft' THEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
    END;
    
    user_email := CASE tenant_record.slug
      WHEN 'moda-bella' THEN 'loja@moda-bella.com'
      WHEN 'tech-store-pro' THEN 'admin@tech-store-pro.com'
      WHEN 'casa-decoracao' THEN 'gerente@casa-decoracao.com'
      WHEN 'esporte-total' THEN 'dono@esporte-total.com'
      WHEN 'beleza-natural' THEN 'admin@beleza-natural.com'
      WHEN 'livraria-saber' THEN 'livreiro@livraria-saber.com'
      WHEN 'pet-shop-amigo' THEN 'veterinario@pet-shop-amigo.com'
      WHEN 'gourmet-express' THEN 'chef@gourmet-express.com'
      WHEN 'jardim-verde' THEN 'jardineiro@jardim-verde.com'
      WHEN 'arte-craft' THEN 'artista@arte-craft.com'
    END;
    
    user_name := CASE tenant_record.slug
      WHEN 'moda-bella' THEN 'Maria Silva - Moda Bella'
      WHEN 'tech-store-pro' THEN 'João Tech - Tech Store Pro'
      WHEN 'casa-decoracao' THEN 'Ana Decoração - Casa & Decoração'
      WHEN 'esporte-total' THEN 'Carlos Esporte - Esporte Total'
      WHEN 'beleza-natural' THEN 'Fernanda Beleza - Beleza Natural'
      WHEN 'livraria-saber' THEN 'Pedro Livros - Livraria Saber'
      WHEN 'pet-shop-amigo' THEN 'Juliana Pet - Pet Shop Amigo'
      WHEN 'gourmet-express' THEN 'Ricardo Gourmet - Gourmet Express'
      WHEN 'jardim-verde' THEN 'Camila Verde - Jardim Verde'
      WHEN 'arte-craft' THEN 'Lucas Arte - Arte & Craft'
    END;
    
    -- Check if user with this email already exists
    SELECT id INTO existing_user_id FROM auth.users WHERE email = user_email;
    
    IF existing_user_id IS NOT NULL THEN
      -- Use existing user ID
      new_user_uuid := existing_user_id;
      RAISE NOTICE 'Using existing user % for tenant %', user_email, tenant_record.slug;
    ELSE
      -- Generate new user ID
      new_user_uuid := CASE tenant_record.slug
        WHEN 'moda-bella' THEN 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
        WHEN 'tech-store-pro' THEN 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
        WHEN 'casa-decoracao' THEN 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid
        WHEN 'esporte-total' THEN 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid
        WHEN 'beleza-natural' THEN 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid
        WHEN 'livraria-saber' THEN '10101010-1010-1010-1010-101010101010'::uuid
        WHEN 'pet-shop-amigo' THEN '20202020-2020-2020-2020-202020202020'::uuid
        WHEN 'gourmet-express' THEN '30303030-3030-3030-3030-303030303030'::uuid
        WHEN 'jardim-verde' THEN '40404040-4040-4040-4040-404040404040'::uuid
        WHEN 'arte-craft' THEN '50505050-5050-5050-5050-505050505050'::uuid
      END;
    END IF;
    
    INSERT INTO tenant_id_mapping (old_id, new_id, slug, user_id, user_email, user_name) 
    VALUES (tenant_record.id, new_tenant_uuid, tenant_record.slug, new_user_uuid, user_email, user_name);
    
    RAISE NOTICE 'Mapping tenant % from % to % with user %', tenant_record.slug, tenant_record.id, new_tenant_uuid, new_user_uuid;
  END LOOP;
END $$;

-- Create or update users
DO $$
DECLARE
  mapping_record RECORD;
  existing_user_id uuid;
BEGIN
  FOR mapping_record IN SELECT * FROM tenant_id_mapping LOOP
    -- Check if user already exists by email
    SELECT id INTO existing_user_id FROM auth.users WHERE email = mapping_record.user_email;
    
    IF existing_user_id IS NULL THEN
      -- Create new user in auth.users
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
        mapping_record.user_id,
        '00000000-0000-0000-0000-000000000000',
        mapping_record.user_email,
        crypt('loja123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('name', mapping_record.user_name),
        false,
        'authenticated'
      );
      
      RAISE NOTICE 'Created new user % for tenant %', mapping_record.user_email, mapping_record.slug;
    ELSE
      -- Update existing user metadata
      UPDATE auth.users SET 
        raw_user_meta_data = jsonb_build_object('name', mapping_record.user_name),
        updated_at = now()
      WHERE id = existing_user_id;
      
      -- Update mapping to use existing user ID
      UPDATE tenant_id_mapping SET user_id = existing_user_id WHERE slug = mapping_record.slug;
      
      RAISE NOTICE 'Updated existing user % for tenant %', mapping_record.user_email, mapping_record.slug;
    END IF;
    
    -- Create or update user in public.users
    INSERT INTO users (
      id,
      email,
      name,
      created_at,
      updated_at
    ) VALUES (
      COALESCE(existing_user_id, mapping_record.user_id),
      mapping_record.user_email,
      mapping_record.user_name,
      now(),
      now()
    ) ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      updated_at = EXCLUDED.updated_at;
  END LOOP;
END $$;

-- Disable foreign key constraints temporarily
ALTER TABLE tenant_users DROP CONSTRAINT IF EXISTS tenant_users_tenant_id_fkey;
ALTER TABLE tenant_users DROP CONSTRAINT IF EXISTS tenant_users_user_id_fkey;
ALTER TABLE tenant_subscriptions DROP CONSTRAINT IF EXISTS tenant_subscriptions_tenant_id_fkey;
ALTER TABLE tenant_metrics DROP CONSTRAINT IF EXISTS tenant_metrics_tenant_id_fkey;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_tenant_id_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_tenant_id_fkey;
ALTER TABLE product_variations DROP CONSTRAINT IF EXISTS product_variations_tenant_id_fkey;
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_tenant_id_fkey;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_tenant_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_tenant_id_fkey;
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_owner_id_fkey;

-- Update all related tables using the mapping
UPDATE tenant_users 
SET tenant_id = m.new_id, user_id = m.user_id
FROM tenant_id_mapping m 
WHERE tenant_users.tenant_id = m.old_id;

UPDATE tenant_subscriptions 
SET tenant_id = m.new_id 
FROM tenant_id_mapping m 
WHERE tenant_subscriptions.tenant_id = m.old_id;

UPDATE tenant_metrics 
SET tenant_id = m.new_id 
FROM tenant_id_mapping m 
WHERE tenant_metrics.tenant_id = m.old_id;

UPDATE categories 
SET tenant_id = m.new_id 
FROM tenant_id_mapping m 
WHERE categories.tenant_id = m.old_id;

UPDATE products 
SET tenant_id = m.new_id 
FROM tenant_id_mapping m 
WHERE products.tenant_id = m.old_id;

UPDATE product_variations 
SET tenant_id = m.new_id 
FROM tenant_id_mapping m 
WHERE product_variations.tenant_id = m.old_id;

UPDATE product_images 
SET tenant_id = m.new_id 
FROM tenant_id_mapping m 
WHERE product_images.tenant_id = m.old_id;

UPDATE customers 
SET tenant_id = m.new_id 
FROM tenant_id_mapping m 
WHERE customers.tenant_id = m.old_id;

UPDATE orders 
SET tenant_id = m.new_id 
FROM tenant_id_mapping m 
WHERE orders.tenant_id = m.old_id;

-- Update the tenants table itself (ID and owner_id)
UPDATE tenants 
SET id = m.new_id, owner_id = m.user_id
FROM tenant_id_mapping m 
WHERE tenants.id = m.old_id;

-- Re-enable foreign key constraints
ALTER TABLE tenants ADD CONSTRAINT tenants_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES auth.users(id);

ALTER TABLE tenant_users ADD CONSTRAINT tenant_users_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant_users ADD CONSTRAINT tenant_users_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE tenant_subscriptions ADD CONSTRAINT tenant_subscriptions_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE tenant_metrics ADD CONSTRAINT tenant_metrics_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE categories ADD CONSTRAINT categories_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE products ADD CONSTRAINT products_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE product_variations ADD CONSTRAINT product_variations_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE product_images ADD CONSTRAINT product_images_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE customers ADD CONSTRAINT customers_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE orders ADD CONSTRAINT orders_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Refresh metrics for all tenants
DO $$
DECLARE
  tenant_id uuid;
BEGIN
  FOR tenant_id IN SELECT id FROM tenants LOOP
    PERFORM update_tenant_metrics(tenant_id);
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating metrics: %', SQLERRM;
END $$;

-- Update system metrics
SELECT update_system_metrics();

-- Log the final mapping for reference
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  RAISE NOTICE 'Final tenant ID mapping:';
  FOR tenant_record IN SELECT id, slug, owner_id FROM tenants WHERE slug IN (
    'moda-bella', 'tech-store-pro', 'casa-decoracao', 'esporte-total', 
    'beleza-natural', 'livraria-saber', 'pet-shop-amigo', 'gourmet-express', 
    'jardim-verde', 'arte-craft'
  ) ORDER BY slug LOOP
    RAISE NOTICE '% -> tenant: %, owner: %', tenant_record.slug, tenant_record.id, tenant_record.owner_id;
  END LOOP;
END $$;