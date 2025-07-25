import React, { useState } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, Package, Tag, ShoppingCart } from 'lucide-react';
import { useProducts, Product } from '../hooks/useProducts';
import { useTenant } from '../contexts/TenantContext';
import ProductForm from './ProductForm';
import TenantLayout from './TenantLayout';

const ProductList: React.FC = () => {
  const { currentTenant, loading: tenantLoading } = useTenant();
  const { products, loading: productsLoading, error, fetchProducts } = useProducts(currentTenant?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  const loading = tenantLoading || productsLoading;

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category?.name === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const outOfStockProducts = products.filter(p => 
    p.variations?.every(v => v.stock_quantity === 0)
  ).length;

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleNewProduct = () => {
    setSelectedProduct(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedProduct(undefined);
  };

  const handleFormSave = () => {
    fetchProducts();
  };

  const getProductPrice = (product: Product) => {
    if (!product.variations || product.variations.length === 0) return 'N/A';
    
    const prices = product.variations.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return `R$ ${minPrice.toFixed(2)}`;
    }
    return `R$ ${minPrice.toFixed(2)} - R$ ${maxPrice.toFixed(2)}`;
  };

  const getTotalStock = (product: Product) => {
    if (!product.variations || product.variations.length === 0) return 0;
    return product.variations.reduce((sum, v) => sum + v.stock_quantity, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">Erro ao carregar produtos</div>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma loja encontrada</h1>
          <p className="text-gray-600">Você não está associado a nenhuma loja.</p>
        </div>
      </div>
    );
  }

  return (

    <TenantLayout title="Gestão de Produtos" showBackButton={true}>
      <div className="p-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">Gerencie seu catálogo de produtos e variações</p>
          <button
            onClick={handleNewProduct}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Tag className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{activeProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <ShoppingCart className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sem Estoque</p>
                <p className="text-2xl font-bold text-gray-900">{outOfStockProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Filter className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Variações</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.reduce((sum, p) => sum + (p.variations?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, marca ou SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="sm:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas as categorias</option>
                  {/* Categories would be populated here */}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory 
                ? 'Tente ajustar os filtros de busca' 
                : 'Comece criando seu primeiro produto'
              }
            </p>
            {!searchTerm && !selectedCategory && (
              <button
                onClick={handleNewProduct}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Primeiro Produto
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                      {product.brand && (
                        <p className="text-sm text-gray-600">{product.brand}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Preço</span>
                      <span className="font-semibold text-green-600">{getProductPrice(product)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Estoque</span>
                      <span className={`font-semibold ${getTotalStock(product) > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {getTotalStock(product)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Variações</span>
                      <span className="font-semibold text-gray-900">{product.variations?.length || 0}</span>
                    </div>

                    {product.variations && product.variations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {product.variations.slice(0, 4).map((variation, index) => (
                          <div
                            key={variation.id}
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: variation.color?.hex_code }}
                            title={`${variation.color?.name} - ${variation.size?.name}`}
                          />
                        ))}
                        {product.variations.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{product.variations.length - 4}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                      {product.sku && (
                        <span className="text-xs text-gray-500">{product.sku}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        product={selectedProduct}
        onSave={handleFormSave}
      />
    </TenantLayout>
  );
};

export default ProductList;