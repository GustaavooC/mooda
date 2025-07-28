import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from './useAuth';

export interface Color {
  id: string;
  name: string;
  hex_code: string;
}

export interface Size {
  id: string;
  name: string;
  category: string;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  tenant_id: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  brand?: string;
  sku?: string;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  variations?: ProductVariation[];
  images?: ProductImage[];
}

export interface ProductVariation {
  id: string;
  product_id: string;
  color_id: string;
  size_id: string;
  price: number;
  promotional_price?: number;
  stock_quantity: number;
  sku?: string;
  is_active: boolean;
  tenant_id: string;
  color?: Color;
  size?: Size;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variation_id?: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  tenant_id: string;
}

export const useProducts = (tenantId?: string) => {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use tenantId prop if provided, otherwise use currentTenant
  const activeTenantId = tenantId || currentTenant?.id;

  // Generate mock products for demo users
  const generateMockProducts = (tenantSlug: string): Product[] => {
    const productTemplates = {
      'moda-bella': [
        { name: 'Vestido Floral Elegante', brand: 'Bella Fashion', category: 'Vestidos' },
        { name: 'Blusa Básica Cotton', brand: 'Bella Fashion', category: 'Blusas' },
        { name: 'Calça Jeans Skinny', brand: 'Bella Fashion', category: 'Calças' },
        { name: 'Bolsa Couro Premium', brand: 'Bella Fashion', category: 'Acessórios' },
        { name: 'Sapato Scarpin Clássico', brand: 'Bella Fashion', category: 'Sapatos' }
      ],
      'tech-store-pro': [
        { name: 'iPhone 15 Pro Max', brand: 'Apple', category: 'Smartphones' },
        { name: 'MacBook Pro M3', brand: 'Apple', category: 'Notebooks' },
        { name: 'Apple Watch Series 9', brand: 'Apple', category: 'Gadgets' },
        { name: 'PlayStation 5', brand: 'Sony', category: 'Gaming' },
        { name: 'Carregador Wireless', brand: 'TechPro', category: 'Acessórios' }
      ],
      'casa-decoracao': [
        { name: 'Sofá 3 Lugares', brand: 'Casa Móveis', category: 'Móveis' },
        { name: 'Luminária Pendente', brand: 'Casa Móveis', category: 'Iluminação' },
        { name: 'Quadro Decorativo', brand: 'Casa Móveis', category: 'Decoração' },
        { name: 'Cortina Blackout', brand: 'Casa Móveis', category: 'Têxtil' },
        { name: 'Jogo de Panelas', brand: 'Casa Móveis', category: 'Cozinha' }
      ]
    };

    const templates = productTemplates[tenantSlug as keyof typeof productTemplates] || productTemplates['moda-bella'];
    
    return templates.map((template, index) => ({
      id: `product-${tenantSlug}-${index}`,
      name: template.name,
      description: `Produto de alta qualidade da linha ${template.category}. Perfeito para o dia a dia e ocasiões especiais.`,
      category_id: `category-${template.category}`,
      brand: template.brand,
      sku: `${tenantSlug.toUpperCase()}-${String(index + 1).padStart(4, '0')}`,
      is_active: true,
      tenant_id: activeTenantId || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: {
        id: `category-${template.category}`,
        name: template.category,
        tenant_id: activeTenantId || ''
      },
      variations: [
        {
          id: `variation-${tenantSlug}-${index}-1`,
          product_id: `product-${tenantSlug}-${index}`,
          color_id: 'color-1',
          size_id: 'size-1',
          price: Math.floor(Math.random() * 200) + 50,
          stock_quantity: Math.floor(Math.random() * 50) + 10,
          is_active: true,
          tenant_id: activeTenantId || '',
          color: { id: 'color-1', name: 'Preto', hex_code: '#000000' },
          size: { id: 'size-1', name: 'M' }
        },
        {
          id: `variation-${tenantSlug}-${index}-2`,
          product_id: `product-${tenantSlug}-${index}`,
          color_id: 'color-2',
          size_id: 'size-2',
          price: Math.floor(Math.random() * 200) + 50,
          stock_quantity: Math.floor(Math.random() * 50) + 10,
          is_active: true,
          tenant_id: activeTenantId || '',
          color: { id: 'color-2', name: 'Branco', hex_code: '#FFFFFF' },
          size: { id: 'size-2', name: 'G' }
        }
      ]
    }));
  };
  // Fetch colors (global)
  const fetchColors = async () => {
    try {
      // For demo users, return mock colors
      if (user?.tenantSlug || user?.isAdmin) {
        const mockColors = [
          { id: 'color-1', name: 'Preto', hex_code: '#000000' },
          { id: 'color-2', name: 'Branco', hex_code: '#FFFFFF' },
          { id: 'color-3', name: 'Azul', hex_code: '#2563EB' },
          { id: 'color-4', name: 'Vermelho', hex_code: '#DC2626' },
          { id: 'color-5', name: 'Verde', hex_code: '#16A34A' }
        ];
        setColors(mockColors);
        return;
      }

      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setColors(data || []);
    } catch (err) {
      console.error('Error fetching colors:', err);
      setError('Failed to fetch colors');
    }
  };

  // Fetch sizes (global)
  const fetchSizes = async () => {
    try {
      // For demo users, return mock sizes
      if (user?.tenantSlug || user?.isAdmin) {
        const mockSizes = [
          { id: 'size-1', name: 'P', category: 'clothing', sort_order: 1 },
          { id: 'size-2', name: 'M', category: 'clothing', sort_order: 2 },
          { id: 'size-3', name: 'G', category: 'clothing', sort_order: 3 },
          { id: 'size-4', name: 'GG', category: 'clothing', sort_order: 4 }
        ];
        setSizes(mockSizes);
        return;
      }

      const { data, error } = await supabase
        .from('sizes')
        .select('*')
        .order('category, sort_order');
      
      if (error) throw error;
      setSizes(data || []);
    } catch (err) {
      console.error('Error fetching sizes:', err);
      setError('Failed to fetch sizes');
    }
  };

  // Fetch categories (tenant-specific)
  const fetchCategories = async () => {
    if (!activeTenantId) return;
    
    try {
      // For demo users, return mock categories
      if (user?.tenantSlug) {
        const categoryTemplates = {
          'moda-bella': ['Vestidos', 'Blusas', 'Calças', 'Acessórios', 'Sapatos'],
          'tech-store-pro': ['Smartphones', 'Notebooks', 'Gadgets', 'Gaming', 'Acessórios'],
          'casa-decoracao': ['Móveis', 'Iluminação', 'Decoração', 'Têxtil', 'Cozinha']
        };
        
        const tenantCategories = categoryTemplates[user.tenantSlug as keyof typeof categoryTemplates] || categoryTemplates['moda-bella'];
        const mockCategories = tenantCategories.map((name, index) => ({
          id: `category-${name}`,
          name,
          description: `Categoria ${name}`,
          tenant_id: activeTenantId
        }));
        
        setCategories(mockCategories);
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories');
    }
  };

  // Fetch products with related data (tenant-specific)
  const fetchProducts = async () => {
    if (!activeTenantId) {
      setProducts([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching products for tenant:', activeTenantId);
      
      // For demo users, return mock products
      if (user?.tenantSlug) {
        const mockProducts = generateMockProducts(user.tenantSlug);
        console.log('Generated mock products:', mockProducts.length);
        setProducts(mockProducts);
        setLoading(false);
        return;
      }

      // First, try to find products by real tenant ID from database
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          variations:product_variations(*,
            color:colors(*),
            size:sizes(*)
          ),
          images:product_images(*)
        `)
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      console.log('Products fetched:', data?.length || 0);
      
      // If no products found and this is a demo tenant, try to find by slug
      if ((!data || data.length === 0) && activeTenantId.startsWith('demo-tenant-')) {
        console.log('No products found for demo tenant, trying to find real tenant by slug...');
        
        // Extract slug from demo tenant ID
        const slug = activeTenantId.replace('demo-tenant-', '');
        
        // Find real tenant by slug
        const { data: realTenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', slug)
          .single();
        
        if (!tenantError && realTenant) {
          console.log('Found real tenant, fetching products with real tenant ID:', realTenant.id);
          
          // Fetch products with real tenant ID
          const { data: realData, error: realError } = await supabase
            .from('products')
            .select(`
              *,
              category:categories(*),
              variations:product_variations(*,
                color:colors(*),
                size:sizes(*)
              ),
              images:product_images(*)
            `)
            .eq('tenant_id', realTenant.id)
            .order('created_at', { ascending: false });
          
          if (!realError && realData) {
            console.log('Products fetched with real tenant ID:', realData.length);
            setProducts(realData);
            return;
          }
        }
      }
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Create product
  const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!activeTenantId) throw new Error('No tenant selected');
    
    try {
      console.log('Creating product for tenant:', activeTenantId);
      console.log('Product data:', product);
      
      const { data, error } = await supabase
        .from('products')
        .insert([{ 
          ...product, 
          tenant_id: activeTenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating product:', error);
        throw error;
      }
      
      console.log('Product created:', data);
      return data;
    } catch (err) {
      console.error('Error creating product:', err);
      throw new Error('Failed to create product');
    }
  };

  // Create product variation
  const createProductVariation = async (variation: Omit<ProductVariation, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (!activeTenantId) throw new Error('No tenant selected');
    
    try {
      console.log('Creating variation for tenant:', activeTenantId);
      console.log('Variation data:', variation);
      
      const { data, error } = await supabase
        .from('product_variations')
        .insert([{ 
          ...variation, 
          tenant_id: activeTenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating variation:', error);
        throw error;
      }
      
      console.log('Variation created:', data);
      return data;
    } catch (err) {
      console.error('Error creating product variation:', err);
      throw new Error('Failed to create product variation');
    }
  };

  // Update product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      console.log('Updating product:', id, updates);
      
      const { data, error } = await supabase
        .from('products')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('tenant_id', activeTenantId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating product:', error);
        throw error;
      }
      
      console.log('Product updated:', data);
      return data;
    } catch (err) {
      console.error('Error updating product:', err);
      throw new Error('Failed to update product');
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    try {
      console.log('Deleting product:', id);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('tenant_id', activeTenantId);
      
      if (error) {
        console.error('Error deleting product:', error);
        throw error;
      }
      
      console.log('Product deleted successfully');
    } catch (err) {
      console.error('Error deleting product:', err);
      throw new Error('Failed to delete product');
    }
  };

  // Create category
  const createCategory = async (category: Omit<Category, 'id' | 'created_at' | 'tenant_id'>) => {
    if (!activeTenantId) throw new Error('No tenant selected');
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ 
          ...category, 
          tenant_id: activeTenantId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      await fetchCategories(); // Refresh categories
      return data;
    } catch (err) {
      console.error('Error creating category:', err);
      throw new Error('Failed to create category');
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Initializing products data for tenant:', activeTenantId);
        
        // Always fetch global data
        await Promise.all([
          fetchColors(),
          fetchSizes()
        ]);
        
        // Fetch tenant-specific data if tenant is available
        if (activeTenantId) {
          await Promise.all([
            fetchCategories(),
            fetchProducts()
          ]);
        } else {
          setProducts([]);
          setCategories([]);
        }
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [activeTenantId, user]);

  return {
    products,
    colors,
    sizes,
    categories,
    loading,
    error,
    fetchProducts,
    createProduct,
    createProductVariation,
    updateProduct,
    deleteProduct,
    createCategory,
  };
};