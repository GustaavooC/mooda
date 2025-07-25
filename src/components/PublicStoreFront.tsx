import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Search, Filter, Heart, Star, Eye, Plus, Minus, X, User, LogOut, Lock, Menu } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { useCustomization } from '../hooks/useCustomization';
import { useThemes } from '../hooks/useThemes';
import CustomerAuthModal from './CustomerAuthModal';
import PriceDisplay from './PriceDisplay';
import ProductModal from './ProductModal';

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
  const { currentTheme } = useThemes();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
    const activeCustomization = currentTheme?.theme || storeCustomization;
    
    if (activeCustomization) {
      // Apply custom CSS variables
      const root = document.documentElement;
      
      if (currentTheme?.theme) {
        // Apply theme colors
        root.style.setProperty('--primary-color', currentTheme.theme.colors.primary);
        root.style.setProperty('--background-color', currentTheme.theme.colors.background);
        root.style.setProperty('--text-color', currentTheme.theme.colors.text);
        root.style.setProperty('--accent-color', currentTheme.theme.colors.secondary);
        
        // Load theme font
        if (loadGoogleFont) {
          loadGoogleFont(currentTheme.theme.typography.headingFont);
        }
      } else if (storeCustomization) {
        // Apply custom colors
        root.style.setProperty('--primary-color', storeCustomization.primary_color);
        root.style.setProperty('--background-color', storeCustomization.background_color);
        root.style.setProperty('--text-color', storeCustomization.text_color);
        root.style.setProperty('--accent-color', storeCustomization.accent_color);
        
        // Load custom font
        if (loadGoogleFont) {
          loadGoogleFont(storeCustomization.font_family);
        }
      }
    }
  }, [storeCustomization, currentTheme, loadGoogleFont]);

  // Get active theme configuration
  const getActiveThemeConfig = () => {
    if (currentTheme?.theme) {
      return {
        colors: currentTheme.theme.colors,
        typography: currentTheme.theme.typography,
        layout: currentTheme.theme.layout
      };
    }
    
    if (storeCustomization) {
      return {
        colors: {
          primary: storeCustomization.primary_color,
          background: storeCustomization.background_color,
          text: storeCustomization.text_color,
          accent: storeCustomization.accent_color
        },
        typography: {
          headingFont: storeCustomization.font_family,
          bodyFont: storeCustomization.font_family,
          fontSize: storeCustomization.font_size_base
        },
        layout: {
          style: storeCustomization.layout_style,
          headerType: 'simple' as const,
          productGrid: 'grid-3' as const,
          cardStyle: 'shadow' as const
        }
      };
    }
    
    // Default theme
    return {
      colors: {
        primary: '#2563EB',
        background: '#FFFFFF',
        text: '#1F2937',
        accent: '#EFF6FF'
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        fontSize: 16
      },
      layout: {
        style: 'modern',
        headerType: 'simple' as const,
        productGrid: 'grid-3' as const,
        cardStyle: 'shadow' as const
      }
    };
  };

  const themeConfig = getActiveThemeConfig();
  const gridClass = themeConfig.layout.productGrid === 'grid-2' ? 'grid-cols-2' 
    : themeConfig.layout.productGrid === 'grid-4' ? 'grid-cols-4' 
    : 'grid-cols-3';
  
  const cardClass = themeConfig.layout.cardStyle === 'minimal' ? 'border-0 shadow-none'
    : themeConfig.layout.cardStyle === 'border' ? 'border-2 shadow-none'
    : themeConfig.layout.cardStyle === 'rounded' ? 'rounded-xl shadow-md'
    : 'shadow-md';

  // Apply theme-specific styles
  const containerStyle = {
    backgroundColor: themeConfig.colors.background,
    color: themeConfig.colors.text,
    fontFamily: themeConfig.typography.headingFont,
    fontSize: `${themeConfig.typography.fontSize}px`
  };

  const headerStyle = {
    backgroundColor: themeConfig.colors.primary,
    ...(themeConfig.layout.headerType === 'centered' && {
      textAlign: 'center' as const
    })
  };

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

  const handleProductClick = (product: Product) => {
    openProductModal(product);
  };

  const handleAddToCart = (product: Product, variation: ProductVariation, quantity: number) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Add to cart logic
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.variation.id === variation.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.variation.id === variation.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevCart, { product, variation, quantity }];
    });

    // Show success feedback
    setAuthSuccess(true);
    setTimeout(() => setAuthSuccess(false), 2000);
  };

  const handleSignIn = async (email: string, password: string) => {
    return await handleAuthSubmit(signIn, email, password);
  };

  const handleSignUp = async (data: any) => {
    return await handleAuthSubmit(signUp, data);
  };

  const cartItems = cart;

  if (loading || !tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Carregando loja...' : 'Loja não encontrada'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={containerStyle}>
      {/* Header */}
      <header className="shadow-sm border-b" style={headerStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className={`flex items-center ${
            themeConfig.layout.headerType === 'centered' ? 'justify-center' :
            themeConfig.layout.headerType === 'split' ? 'justify-between' :
            'justify-between'
          }`}>
            <div className="flex items-center gap-3 flex-1">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden p-2 text-white hover:text-opacity-80"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {storeCustomization?.logo_url ? (
                <img 
                  src={storeCustomization.logo_url} 
                  alt={tenant.name}
                  className="h-10 w-auto"
                />
              ) : (
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {tenant.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-white">{tenant.name}</h1>
                {tenant.description && (
                  <p className="text-white text-opacity-90 text-sm">{tenant.description}</p>
                )}
              </div>
            </div>
            
            {themeConfig.layout.headerType !== 'centered' && (
              <div className="flex items-center gap-4">
                {/* User Menu */}
                {isAuthenticated ? (
                  <div className="hidden sm:flex items-center gap-3">
                    <span className="text-white text-sm">Olá, {customer?.name}</span>
                    <button
                      onClick={handleSignOut}
                      className="text-white hover:text-opacity-80 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="hidden sm:block text-white hover:text-opacity-80 transition-colors"
                  >
                    Entrar
                  </button>
                )}
                
                {/* Cart */}
                <button
                  onClick={() => setShowCart(true)}
                  className="flex items-center gap-2 text-white hover:text-opacity-80 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="hidden sm:inline">Carrinho</span>
                  {getTotalCartItems() > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getTotalCartItems()}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {isAuthenticated ? (
                <div className="pb-4 border-b">
                  <p className="font-medium text-gray-900">{customer?.name}</p>
                  <p className="text-sm text-gray-600">{customer?.email}</p>
                  <button
                    onClick={handleSignOut}
                    className="mt-2 text-red-600 text-sm"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full text-left py-2 text-blue-600 font-medium"
                >
                  Entrar / Criar Conta
                </button>
              )}
              
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowCart(true);
                }}
                className="flex items-center gap-2 w-full text-left py-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Carrinho ({getTotalCartItems()})
              </button>
              
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.name);
                    setShowMobileMenu(false);
                  }}
                  className="block w-full text-left py-2 text-gray-700"
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {authSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          ✅ Produto adicionado ao carrinho!
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Carrinho ({getTotalCartItems()})
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Seu carrinho está vazio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.variation.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.product.name}</h4>
                        <p className="text-xs text-gray-600">
                          {item.variation.color.name} - {item.variation.size.name}
                        </p>
                        <p className="text-sm font-semibold text-green-600">
                          R$ {(item.variation.promotional_price || item.variation.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.variation.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.variation.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Plus className="w-3 h-3" />
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
              <div className="border-t p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="text-lg font-bold text-green-600">
                    R$ {getCartTotal().toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      setShowCart(false);
                      setShowAuthModal(true);
                    } else {
                      setShowCheckout(true);
                    }
                  }}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {isAuthenticated ? 'Finalizar Compra' : 'Entrar para Comprar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Finalizar Compra</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                      <input
                        type="text"
                        value={checkoutCustomer.name}
                        onChange={(e) => setCheckoutCustomer(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={checkoutCustomer.email}
                        onChange={(e) => setCheckoutCustomer(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                      <input
                        type="tel"
                        value={checkoutCustomer.phone}
                        onChange={(e) => setCheckoutCustomer(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço de Entrega</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rua</label>
                      <input
                        type="text"
                        value={checkoutCustomer.address.street}
                        onChange={(e) => setCheckoutCustomer(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, street: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                      <input
                        type="text"
                        value={checkoutCustomer.address.city}
                        onChange={(e) => setCheckoutCustomer(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, city: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                      <input
                        type="text"
                        value={checkoutCustomer.address.state}
                        onChange={(e) => setCheckoutCustomer(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, state: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                      <input
                        type="text"
                        value={checkoutCustomer.address.zipcode}
                        onChange={(e) => setCheckoutCustomer(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, zipcode: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo do Pedido</h3>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.variation.id} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.variation.color.name} - {item.variation.size.name} (x{item.quantity})
                          </p>
                        </div>
                        <p className="font-semibold">
                          R$ {((item.variation.promotional_price || item.variation.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-2 font-semibold text-lg">
                      <span>Total:</span>
                      <span>R$ {getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {checkoutLoading ? 'Processando...' : 'Confirmar Pedido'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner Principal */}
      {storeCustomization?.banner_main_url && (
        <div className="relative">
          <img 
            src={storeCustomization.banner_main_url} 
            alt="Banner Principal"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Bem-vindo à {tenant.name}</h2>
              <p className="text-lg opacity-90">Descubra nossos produtos incríveis</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ 
                  focusRingColor: themeConfig.colors.primary,
                  borderColor: searchTerm ? themeConfig.colors.primary : undefined
                }}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ 
                focusRingColor: themeConfig.colors.primary
              }}
            >
              <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: themeConfig.colors.text }}>
              {searchTerm || selectedCategory ? 'Nenhum produto encontrado' : 'Em breve, novos produtos!'}
            </h3>
            <p style={{ color: themeConfig.colors.text, opacity: 0.7 }}>
              {searchTerm || selectedCategory 
                ? 'Tente ajustar os filtros de busca' 
                : 'Estamos preparando produtos incríveis para você'
              }
            </p>
          </div>
        ) : (
          <div className={`grid ${gridClass} gap-6`}>
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className={`bg-white rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 cursor-pointer ${cardClass}`}
                onClick={() => handleProductClick(product)}
                style={{ 
                  backgroundColor: themeConfig.colors.background,
                  borderColor: themeConfig.layout.cardStyle === 'border' ? themeConfig.colors.primary : undefined
                }}
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <div className="w-16 h-16 mx-auto mb-2 opacity-50">
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                    <p className="text-sm">Imagem do produto</p>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold mb-2" style={{ 
                    color: themeConfig.colors.text,
                    fontFamily: themeConfig.typography.headingFont
                  }}>
                    {product.name}
                  </h3>
                  
                  {product.brand && (
                    <p className="text-sm mb-2" style={{ 
                      color: themeConfig.colors.text, 
                      opacity: 0.7 
                    }}>
                      {product.brand}
                    </p>
                  )}

                  {product.description && (
                    <p className="text-sm mb-3 line-clamp-2" style={{ 
                      color: themeConfig.colors.text, 
                      opacity: 0.8 
                    }}>
                      {product.description}
                    </p>
                  )}

                  {/* Variations Preview */}
                  {product.variations && product.variations.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs" style={{ 
                        color: themeConfig.colors.text, 
                        opacity: 0.7 
                      }}>
                        Cores:
                      </span>
                      <div className="flex gap-1">
                        {product.variations.slice(0, 4).map((variation, index) => (
                          <div
                            key={variation.id}
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: variation.color?.hex_code }}
                            title={`${variation.color?.name} - ${variation.size?.name}`}
                          />
                        ))}
                        {product.variations.length > 4 && (
                          <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{product.variations.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <PriceDisplay
                      price={getProductPrice(product)?.minPrice}
                      promotionalPrice={getProductPrice(product)?.hasRange ? undefined : getProductPrice(product)?.minPrice}
                      isAuthenticated={isAuthenticated}
                      onAuthRequired={() => setShowAuthModal(true)}
                      size="md"
                    />
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(product);
                      }}
                      className="px-3 py-1 text-sm font-medium text-white rounded-lg transition-colors"
                      style={{ 
                        backgroundColor: themeConfig.colors.primary,
                        ':hover': { opacity: 0.9 }
                      }}
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Banner de Perfil */}
        {storeCustomization?.banner_profile_url && (
          <div className="mt-12 bg-white rounded-lg shadow-md overflow-hidden">
            <img 
              src={storeCustomization.banner_profile_url} 
              alt="Sobre a Loja"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-3" style={{ 
                color: themeConfig.colors.text,
                fontFamily: themeConfig.typography.headingFont
              }}>
                Sobre {tenant.name}
              </h3>
              <p style={{ 
                color: themeConfig.colors.text, 
                opacity: 0.8 
              }}>
                {tenant.description || 'Conheça mais sobre nossa loja e nossos produtos de qualidade.'}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t" style={{ 
        backgroundColor: themeConfig.colors.accent,
        borderColor: themeConfig.colors.primary + '20'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p style={{ color: themeConfig.colors.text, opacity: 0.7 }}>
            © 2024 {tenant.name}. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Customer Auth Modal */}
      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        storeName={tenant.name}
      />

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};

export default PublicStoreFront;