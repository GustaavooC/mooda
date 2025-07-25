/*
  # Populate Initial Data

  1. Colors
    - Insert 20 common colors with hex codes
  2. Sizes  
    - Insert clothing sizes (PP to XXG)
    - Insert shoe sizes (33 to 45)
    - Insert accessory sizes
  3. Categories
    - Insert basic product categories
*/

-- Insert colors
INSERT INTO colors (name, hex_code) VALUES
  ('Branco', '#FFFFFF'),
  ('Preto', '#000000'),
  ('Vermelho', '#DC2626'),
  ('Azul', '#2563EB'),
  ('Verde', '#16A34A'),
  ('Amarelo', '#EAB308'),
  ('Rosa', '#EC4899'),
  ('Roxo', '#9333EA'),
  ('Laranja', '#EA580C'),
  ('Marrom', '#A16207'),
  ('Cinza', '#6B7280'),
  ('Azul Marinho', '#1E3A8A'),
  ('Verde Militar', '#365314'),
  ('Vinho', '#7C2D12'),
  ('Nude', '#F3E8D5'),
  ('Coral', '#FB7185'),
  ('Turquesa', '#06B6D4'),
  ('Dourado', '#D97706'),
  ('Prata', '#9CA3AF'),
  ('Bege', '#D6D3D1');

-- Insert clothing sizes
INSERT INTO sizes (name, category, sort_order) VALUES
  ('PP', 'clothing', 1),
  ('P', 'clothing', 2),
  ('M', 'clothing', 3),
  ('G', 'clothing', 4),
  ('GG', 'clothing', 5),
  ('XG', 'clothing', 6),
  ('XXG', 'clothing', 7);

-- Insert shoe sizes
INSERT INTO sizes (name, category, sort_order) VALUES
  ('33', 'shoes', 33),
  ('34', 'shoes', 34),
  ('35', 'shoes', 35),
  ('36', 'shoes', 36),
  ('37', 'shoes', 37),
  ('38', 'shoes', 38),
  ('39', 'shoes', 39),
  ('40', 'shoes', 40),
  ('41', 'shoes', 41),
  ('42', 'shoes', 42),
  ('43', 'shoes', 43),
  ('44', 'shoes', 44),
  ('45', 'shoes', 45);

-- Insert accessory sizes
INSERT INTO sizes (name, category, sort_order) VALUES
  ('Único', 'accessories', 1),
  ('Pequeno', 'accessories', 2),
  ('Médio', 'accessories', 3),
  ('Grande', 'accessories', 4);

-- Insert categories
INSERT INTO categories (name, description) VALUES
  ('Roupas', 'Vestuário em geral'),
  ('Calçados', 'Sapatos, tênis e sandálias'),
  ('Acessórios', 'Bolsas, joias e complementos'),
  ('Camisetas', 'Camisetas e regatas'),
  ('Calças', 'Calças e shorts'),
  ('Vestidos', 'Vestidos e saias'),
  ('Casacos', 'Casacos e jaquetas'),
  ('Tênis', 'Tênis esportivos e casuais'),
  ('Sapatos', 'Sapatos sociais e casuais'),
  ('Sandálias', 'Sandálias e chinelos'),
  ('Bolsas', 'Bolsas e carteiras'),
  ('Joias', 'Joias e bijuterias');

-- Update subcategories with parent references
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = 'Roupas' LIMIT 1) 
WHERE name IN ('Camisetas', 'Calças', 'Vestidos', 'Casacos');

UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = 'Calçados' LIMIT 1) 
WHERE name IN ('Tênis', 'Sapatos', 'Sandálias');

UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = 'Acessórios' LIMIT 1) 
WHERE name IN ('Bolsas', 'Joias');