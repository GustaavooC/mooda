import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Search, Filter, Heart, Star, Eye, Plus, Minus, X, User, LogOut, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { useCustomization } from '../hooks/useCustomization';
import CustomerAuthModal from './CustomerAuthModal';
import PriceDisplay from './PriceDisplay';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings: any;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  category?: {
    name: string;
  };
  variations: ProductVariation[];
}

interface ProductVariation {
  id: string;
  price: number;
  promotional_price?: number;
  stock_quantity: number;
  color: {
    id: string;
    name: string;
    hex_code: string;
  };
  size: {
    id: string;
    name: string;
  };
}

interface CartItem {
  variation: ProductVariation;
  quantity: number;
  product: Product;
}

interface Customer {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipcode: string;
  };
}

const PublicStoreFront: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const { customization } = useCustomization(tenant?.id);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Customer authentication
  const { customer, isAuthenticated, signIn, signUp, signOut } = useCustomerAuth(tenant?.id);
  
  // Store customization
  const { customization: storeCustomization, loadGoogleFont } = useCustomization(tenant?.id);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  
  // Product modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  
  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  
  // Checkout
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutCustomer, setCheckoutCustomer] = useState<Customer>({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: {
      street: '',
      city: '',
      state: '',
      zipcode: ''
    }
  });

  // Apply custom styles when customization changes
  useEffect(() => {
    if (storeCustomization) {
      // Apply custom CSS variables
      const root = document.documentElement;
      root.style.setProperty('--primary-color', storeCustomization.primary_color);
      root.style.setProperty('--background-color', storeCustomization.background_color);
      root.style.setProperty('--text-color', storeCustomization.text_color);
      root.style.setProperty('--accent-color', storeCustomization.accent_color);
      
      // Load Google Font if specified
      if (storeCustomization.font_family && loadGoogleFont) {
        loadGoogleFont(storeCustomization.font_family);
      }
    }
  }, [storeCustomization, loadGoogleFont]);

  const handleAuthSuccess = () => {
    setAuthSuccess(true);
    setTimeout(() => setAuthSuccess(false), 2000);
  };

  useEffect(() => {
    if (slug) {
      fetchTenantData();
    }
  }, [slug]);

  useEffect(() => {
    if (customer) {
      setCheckoutCustomer(prev => ({
        ...prev,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || ''
      }));
    }
  }, [customer]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data for slug:', slug);
      
      // Fetch tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (tenantError) {
        console.error('Tenant error:', tenantError);
        throw tenantError;
      }
      
      console.log('Tenant found:', tenantData);
      setTenant(tenantData);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .order('name');

      if (categoriesError) {
        console.error('Categories error:', categoriesError);
      } else {
        console.log('Categories found:', categoriesData?.length || 0);
        setCategories(categoriesData || []);
      }

      // Fetch products with variations - usando query mais simples primeiro
      console.log('Fetching products for tenant:', tenantData.id);
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          brand,
          is_active,
          category:categories(name),
          variations:product_variations(
            id,
            price,
            promotional_price,
            stock_quantity,
            color:colors(id, name, hex_code),
            size:sizes(id, name)
          )
        `)
        .eq('tenant_id', tenantData.id)
        .eq('is_active', true);

      if (productsError) {
        console.error('Products error:', productsError);
        throw productsError;
      }
      
      console.log('Products found:', productsData?.length || 0);
      console.log('Sample product:', productsData?.[0]);
      
      // Filter products that have variations with stock
      const productsWithStock = (productsData || []).filter(product => 
        product.variations && product.variations.length > 0 && 
        product.variations.some((v: any) => v.stock_quantity > 0)
      );
      
      console.log('Products with stock:', productsWithStock.length);
      setProducts(productsWithStock);
      
    } catch (err) {
      console.error('Error fetching tenant data:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar loja');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category?.name === selectedCategory;
    
    // Only filter by price if user is authenticated
    if (!isAuthenticated) {
      return matchesSearch && matchesCategory;
    }
    
    const productPrices = product.variations?.map(v => v.promotional_price || v.price) || [];
    const minPrice = Math.min(...productPrices);
    const matchesPrice = minPrice >= priceRange[0] && minPrice <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const getProductPrice = (product: Product) => {
    if (!product.variations || product.variations.length === 0) return null;
    
    const availableVariations = product.variations.filter(v => v.stock_quantity > 0);
    if (availableVariations.length === 0) return null;
    
    const prices = availableVariations.map(v => v.promotional_price || v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return { minPrice, maxPrice, hasRange: minPrice !== maxPrice };
  };

  const getAvailableColors = (product: Product) => {
    if (!product.variations) return [];
    
    const availableVariations = product.variations.filter(v => v.stock_quantity > 0);
    const colorIds = [...new Set(availableVariations.map(v => v.color.id))];
    
    return colorIds.map(colorId => {
      const variation = availableVariations.find(v => v.color.id === colorId);
      return variation?.color;
    }).filter(Boolean);
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedColorId('');
    setSelectedSizeId('');
    setQuantity(1);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setSelectedColorId('');
    setSelectedSizeId('');
    setQuantity(1);
  };

  const handleColorSelect = (colorId: string) => {
    setSelectedColorId(colorId);
    setSelectedSizeId('');
    setQuantity(1);
  };

  const getAvailableSizesForColor = () => {
    if (!selectedProduct || !selectedColorId) return [];
    
    return selectedProduct.variations?.filter(v => 
      v.color.id === selectedColorId && v.stock_quantity > 0
    ) || [];
  };

  const getSelectedVariation = () => {
    if (!selectedProduct || !selectedColorId || !selectedSizeId) return null;
    
    return selectedProduct.variations?.find(v => 
      v.color.id === selectedColorId && v.size.id === selectedSizeId
    ) || null;
  };

  const addToCart = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const variation = getSelectedVariation();
    if (!variation || !selectedProduct) return;

    setAddToCartLoading(true);
    
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.variation.id === variation.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.variation.id === variation.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevCart, { product: selectedProduct, variation, quantity }];
    });

    setAddToCartLoading(false);
    closeProductModal();
    
    // Show success feedback
    setAuthSuccess(true);
    setTimeout(() => setAuthSuccess(false), 2000);
  };

  const removeFromCart = (variationId: string) => {
    setCart(prevCart => prevCart.filter(item => item.variation.id !== variationId));
  };

  const updateCartQuantity = (variationId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(variationId);
      return;
    }

    setCart(prevCart => 
      prevCart.map(item =>
        item.variation.id === variationId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.variation.promotional_price || item.variation.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getTotalCartItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !isAuthenticated) return;

    setCheckoutLoading(true);

    try {
      // Update customer data if needed
      if (customer && (
        customer.name !== checkoutCustomer.name ||
        customer.email !== checkoutCustomer.email ||
        customer.phone !== checkoutCustomer.phone
      )) {
        await supabase
          .from('customers')
          .update({
            name: checkoutCustomer.name,
            email: checkoutCustomer.email,
            phone: checkoutCustomer.phone
          })
          .eq('id', customer.id);
      }

      // Create order
      const orderTotal = getCartTotal();
      const shippingAmount = orderTotal > 100 ? 0 : 15.90;
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          tenant_id: tenant?.id,
          customer_id: customer?.id,
          status: 'pending',
          subtotal: orderTotal,
          shipping_amount: shippingAmount,
          total_amount: orderTotal + shippingAmount,
          payment_status: 'pending',
          payment_method: 'pending',
          shipping_address: checkoutCustomer.address,
          billing_address: checkoutCustomer.address
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      for (const item of cart) {
        await supabase
          .from('order_items')
          .insert([{
            order_id: orderData.id,
            product_variation_id: item.variation.id,
            quantity: item.quantity,
            unit_price: item.variation.promotional_price || item.variation.price,
            total_price: (item.variation.promotional_price || item.variation.price) * item.quantity
          }]);
      }

      // Clear cart and close checkout
      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
      
      alert(`Pedido ${orderData.order_number} criado com sucesso! Total: R$ ${(orderTotal + shippingAmount).toFixed(2)}`);
      
    } catch (err) {
      console.error('Erro ao finalizar pedido:', err);
      alert('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  const handleSignOut = () => {
    signOut();
    setCart([]);
    setShowCart(false);
    setShowCheckout(false);
  };

  const handleAuthSubmit = async (authFunction: any, ...args: any[]) => {
    setAuthLoading(true);
    try {
      const result = await authFunction(...args);
      if (!result.error) {
        setAuthSuccess(true);
        setTimeout(() => {
          setAuthSuccess(false);
          setShowAuthModal(false);
        }, 1000);
      }
      return result;
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando loja...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
          <p className="text-gray-600 mb-4">{error || 'Esta loja não existe ou está inativa.'}</p>
          <p className="text-sm text-gray-500">Slug: {slug}</p>
        </div>
      </div>
    );
  }

  // Use customization colors or fallback to tenant settings
  const themeColors = customization ? {
    primary: customization.primary_color,
    secondary: customization.accent_color,
    background: customization.background_color,
    text: customization.text_color
  } : (tenant.settings?.colors || { primary: '#3B82F6', secondary: '#EFF6FF' });

  // Apply custom styles
  const customStyles = customization ? {
    fontFamily: customization.font_family,
    fontSize: `${customization.font_size_base}px`,
    backgroundColor: customization.background_color,
    color: customization.text_color
  } : {};

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: storeCustomization?.background_color || '#FFFFFF',
        color: storeCustomization?.text_color || '#1F2937',
        fontFamily: storeCustomization?.font_family || 'Inter',
        fontSize: `${storeCustomization?.font_size_base || 16}px`
      }}
    >
      {/* Success Notification */}
      {authSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          ✅ Sucesso! Preços liberados
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {storeCustomization?.logo_url ? (
                <img 
                  src={storeCustomization.logo_url} 
                  alt={`${tenant.name} Logo`}
                  className="h-10 w-auto"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: storeCustomization?.primary_color || '#3B82F6' }}
                >
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 
                  className="text-xl font-bold"
                  style={{ color: storeCustomization?.primary_color || '#3B82F6' }}
                >
                  {tenant.name}
                </h1>
                {tenant.description && (
                  <p className="text-sm text-gray-600 hidden sm:block">
                    {tenant.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Olá, {customer?.name?.split(' ')[0]}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Sair"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: storeCustomization?.primary_color || '#3B82F6' }}
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">Entrar / Cadastrar</span>
                  <span className="sm:hidden">Entrar</span>
                </button>
              )}

              {/* Cart */}
              <button 
                onClick={() => isAuthenticated ? setShowCart(true) : setShowAuthModal(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <ShoppingCart className="w-6 h-6" />
                {getTotalCartItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalCartItems()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden bg-white border-b px-4 py-3">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Principal */}
        {storeCustomization?.banner_main_url && (
          <div className="relative">
            <img 
              src={storeCustomization.banner_main_url} 
              alt="Banner Principal"
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-center text-white max-w-2xl px-4">
                <h2 className="text-4xl font-bold mb-4">Bem-vindo à {tenant.name}</h2>
                <p className="text-xl opacity-90 mb-6">
                  {tenant.description || 'Descubra produtos incríveis com a melhor qualidade e preços especiais.'}
                </p>
                {!isAuthenticated && (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Ver Preços Exclusivos
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Banner de Perfil - Seção Sobre */}
        {storeCustomization?.banner_profile_url && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Sobre Nossa Loja
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <img 
                  src={storeCustomization.banner_profile_url} 
                  alt="Sobre nossa loja"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{tenant.name}</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {tenant.description || 'Uma loja comprometida em oferecer os melhores produtos com qualidade excepcional e atendimento personalizado.'}
                  </p>
                  <p className="text-gray-600">
                    Navegue por nosso catálogo e descubra produtos únicos selecionados especialmente para você.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
            <p className="text-sm text-yellow-700">
              Tenant: {tenant.name} (ID: {tenant.id})<br/>
              Produtos carregados: {products.length}<br/>
              Categorias: {categories.length}<br/>
              Produtos filtrados: {filteredProducts.length}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as categorias</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Preço:</span>
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                className="flex-1"
              />
              <span className="text-sm text-gray-600">até R$ {priceRange[1]}</span>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {products.length === 0 ? 'Nenhum produto disponível' : 'Nenhum produto encontrado'}
            </h3>
            <p className="text-gray-600">
              {products.length === 0 
                ? 'Esta loja ainda não possui produtos cadastrados' 
                : 'Tente ajustar sua busca ou filtros'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const availableColors = getAvailableColors(product);
              const priceInfo = getProductPrice(product);
              const isAvailable = product.variations?.some(v => v.stock_quantity > 0);
              
              return (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all duration-300 group">
                  <div className="relative overflow-hidden rounded-t-lg bg-gray-100 aspect-square">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <div className="w-16 h-16 mx-auto mb-2 opacity-50">
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                          </svg>
                        </div>
                        <p className="text-sm">Sem imagem</p>
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openProductModal(product)}
                          className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
                          <Heart className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {!isAvailable && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded">
                        Sem estoque
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                        {product.brand && (
                          <p className="text-sm text-gray-600">{product.brand}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">(0)</span>
                    </div>
                    
                    <div className="mb-3">
                      {priceInfo ? (
                        <PriceDisplay
                          price={priceInfo.hasRange ? undefined : priceInfo.minPrice}
                          isAuthenticated={isAuthenticated}
                          onAuthRequired={handleAuthRequired}
                          className={priceInfo.hasRange ? 'text-lg font-bold text-gray-900' : ''}
                        />
                      ) : (
                        <span className="text-lg text-gray-500">Sem estoque</span>
                      )}
                      {priceInfo?.hasRange && isAuthenticated && (
                        <span className="text-lg font-bold text-gray-900">
                          A partir de R$ {priceInfo.minPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    {availableColors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {availableColors.slice(0, 5).map((color, index) => (
                          <div
                            key={color?.id || index}
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: color?.hex_code }}
                            title={color?.name}
                          />
                        ))}
                        {availableColors.length > 5 && (
                          <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{availableColors.length - 5}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={() => openProductModal(product)}
                      disabled={!isAvailable}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        isAvailable
                          ? 'text-white hover:opacity-90'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      style={{ backgroundColor: isAvailable ? themeColors.primary : undefined }}
                    >
                      {!isAuthenticated ? (
                        <div className="flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4" />
                          Ver Preços
                        </div>
                      ) : isAvailable ? 'Ver Produto' : 'Indisponível'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* About Section with Profile Banner */}
        {customization?.banner_profile_url && (
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sobre Nossa Loja</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <img 
                  src={customization.banner_profile_url} 
                  alt="Sobre a Loja"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{tenant.name}</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {tenant.description || 'Uma loja comprometida em oferecer os melhores produtos com qualidade excepcional e atendimento personalizado.'}
                </p>
                <p className="text-gray-600">
                  Navegue por nosso catálogo e descubra produtos únicos selecionados especialmente para você.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1 bg-gray-100 aspect-square lg:aspect-auto relative">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 opacity-50">
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                    <p className="text-lg">Imagem do produto</p>
                  </div>
                </div>
                
                <button
                  onClick={closeProductModal}
                  className="absolute top-4 right-4 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-[50vh] lg:max-h-[90vh]">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h1>
                  {selectedProduct.brand && (
                    <p className="text-lg text-gray-600 mb-4">{selectedProduct.brand}</p>
                  )}
                  
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                    <span className="text-gray-600 ml-2">(0 avaliações)</span>
                  </div>

                  <div className="mb-6">
                    {(() => {
                      const variation = getSelectedVariation();
                      if (variation) {
                        return (
                          <PriceDisplay
                            price={variation.price}
                            promotionalPrice={variation.promotional_price}
                            isAuthenticated={isAuthenticated}
                            onAuthRequired={handleAuthRequired}
                            size="lg"
                          />
                        );
                      }
                      return (
                        <PriceDisplay
                          isAuthenticated={isAuthenticated}
                          onAuthRequired={handleAuthRequired}
                          size="lg"
                          className="text-gray-600"
                        />
                      );
                    })()}
                  </div>
                </div>

                {/* Color Selection */}
                {getAvailableColors(selectedProduct).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Cor</h3>
                    <div className="flex flex-wrap gap-3">
                      {getAvailableColors(selectedProduct).map((color) => (
                        <button
                          key={color?.id}
                          onClick={() => handleColorSelect(color?.id || '')}
                          className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all ${
                            selectedColorId === color?.id
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded-full border border-gray-300"
                            style={{ backgroundColor: color?.hex_code }}
                          />
                          <span className="font-medium">{color?.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selection */}
                {selectedColorId && getAvailableSizesForColor().length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Tamanho</h3>
                    <div className="flex flex-wrap gap-2">
                      {getAvailableSizesForColor().map((variation) => (
                        <button
                          key={variation.id}
                          onClick={() => setSelectedSizeId(variation.size.id)}
                          className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                            selectedSizeId === variation.size.id
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {variation.size.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selection */}
                {getSelectedVariation() && isAuthenticated && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Quantidade</h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 border border-gray-300 rounded-lg font-medium min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(getSelectedVariation()?.stock_quantity || 1, quantity + 1))}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600 ml-2">
                        ({getSelectedVariation()?.stock_quantity} disponível)
                      </span>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedProduct.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Descrição</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedProduct.description}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-6 border-t">
                  <button
                    onClick={addToCart}
                    disabled={!getSelectedVariation() || !isAuthenticated || addToCartLoading}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-all ${
                      getSelectedVariation() && isAuthenticated && !addToCartLoading
                        ? 'text-white hover:opacity-90'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    style={{ backgroundColor: getSelectedVariation() && isAuthenticated && !addToCartLoading ? themeColors.primary : undefined }}
                  >
                    {addToCartLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <ShoppingCart className="w-5 h-5" />
                    )}
                    {!isAuthenticated ? 'Faça login para comprar' : addToCartLoading ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                  </button>
                  
                  <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>

                {!isAuthenticated && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                      <Lock className="w-5 h-5" />
                      <span className="font-medium">Cadastre-se para ver preços e comprar</span>
                    </div>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Criar conta grátis →
                    </button>
                  </div>
                )}

                {!getSelectedVariation() && selectedColorId && isAuthenticated && (
                  <p className="text-amber-600 text-sm mt-2">
                    Selecione um tamanho para continuar
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Carrinho ({getTotalCartItems()})</h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Seu carrinho está vazio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.variation.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div
                          className="w-8 h-8 rounded-full border"
                          style={{ backgroundColor: item.variation.color.hex_code }}
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-600">
                          {item.variation.color.name} - {item.variation.size.name}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          R$ {(item.variation.promotional_price || item.variation.price).toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.variation.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.variation.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.variation.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-bold">R$ {getCartTotal().toFixed(2)}</span>
                </div>
                <button
                  onClick={() => {
                    setShowCart(false);
                    setShowCheckout(true);
                  }}
                  className="w-full py-3 text-white rounded-lg font-medium hover:opacity-90 transition-colors"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  Finalizar Compra
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Finalizar Compra</h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={checkoutCustomer.name}
                      onChange={(e) => setCheckoutCustomer(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="E-mail"
                      value={checkoutCustomer.email}
                      onChange={(e) => setCheckoutCustomer(prev => ({ ...prev, email: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="tel"
                      placeholder="Telefone"
                      value={checkoutCustomer.phone}
                      onChange={(e) => setCheckoutCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Endereço de Entrega</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Rua e número"
                      value={checkoutCustomer.address.street}
                      onChange={(e) => setCheckoutCustomer(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={checkoutCustomer.address.city}
                      onChange={(e) => setCheckoutCustomer(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Estado"
                      value={checkoutCustomer.address.state}
                      onChange={(e) => setCheckoutCustomer(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="CEP"
                      value={checkoutCustomer.address.zipcode}
                      onChange={(e) => setCheckoutCustomer(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, zipcode: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Resumo do Pedido</h3>
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.variation.id} className="flex justify-between">
                        <span>{item.product.name} ({item.variation.color.name} - {item.variation.size.name}) x{item.quantity}</span>
                        <span>R$ {((item.variation.promotional_price || item.variation.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>R$ {getCartTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frete:</span>
                        <span>R$ {getCartTotal() > 100 ? '0,00' : '15,90'}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>R$ {(getCartTotal() + (getCartTotal() > 100 ? 0 : 15.90)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t p-6">
              <button
                onClick={handleCheckout}
                disabled={!checkoutCustomer.name || !checkoutCustomer.email || !checkoutCustomer.address.street || checkoutLoading}
                className="w-full py-3 text-white rounded-lg font-medium hover:opacity-90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: checkoutCustomer.name && checkoutCustomer.email && checkoutCustomer.address.street && !checkoutLoading ? themeColors.primary : undefined }}
              >
                {checkoutLoading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                )}
                {checkoutLoading ? 'Processando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Auth Modal */}
      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignIn={(email, password) => handleAuthSubmit(signIn, email, password)}
        onSignUp={(data) => handleAuthSubmit(signUp, data)}
        storeName={tenant.name}
      />
    </div>
  );
};

export default PublicStoreFront;