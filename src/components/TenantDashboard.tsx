import React, { useState } from 'react';
import { Package, ShoppingCart, Users, DollarSign, Plus, Edit, Trash2, AlertTriangle, BarChart3 } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { useMetrics } from '../hooks/useMetrics';
import { useProducts } from '../hooks/useProducts';
import { useContract } from '../hooks/useContract';
import ProductForm from './ProductForm';
import ContractStatusCard from './ContractStatusCard';
import TenantLayout from './TenantLayout';

const TenantDashboard: React.FC = () => {
  const { currentTenant, loading: tenantLoading } = useTenant();
  const { tenantMetrics, loading: metricsLoading, getCurrentMetrics, getMetricsComparison } = useMetrics(currentTenant?.id);
  const { products, loading: productsLoading, fetchProducts, deleteProduct } = useProducts(currentTenant?.id);
  const { contractInfo } = useContract(currentTenant?.id);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loading = tenantLoading || metricsLoading || productsLoading;

  const currentMetrics = getCurrentMetrics();
  const comparison = getMetricsComparison();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const recentProducts = products.slice(0, 5);
  const lowStockProducts = products.filter(p => 
    p.variations?.some(v => v.stock_quantity <= 5)
  ).slice(0, 5);

  // Check if contract is expired
  const isContractExpired = contractInfo?.is_expired || false;
  const isExpiringSoon = contractInfo && contractInfo.days_remaining <= 7 && !contractInfo.is_expired;
  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteProduct(productId);
        fetchProducts();
      } catch (error) {
        alert('Erro ao excluir produto');
      }
    }
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setShowProductForm(true);
  };

  const handleFormClose = () => {
    setShowProductForm(false);
    setSelectedProduct(null);
  };

  const handleFormSave = () => {
    fetchProducts();
    setShowProductForm(false);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma loja encontrada</h1>
          <p className="text-gray-600 mb-4">Você não está associado a nenhuma loja.</p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Entre em contato com o suporte para obter acesso.</p>
          </div>
        </div>
      </div>
    );
  }

  return (

    <TenantLayout title={`Dashboard - ${currentTenant.name}`}>
      <div className="p-6">
        {/* Contract Status Alert */}
        {(isContractExpired || isExpiringSoon) && (
          <div className={`mb-6 p-4 rounded-lg border ${
            isContractExpired 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-5 h-5 ${
                isContractExpired ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <div>
                <h3 className={`font-medium ${
                  isContractExpired ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {isContractExpired ? 'Contrato Expirado' : 'Contrato Expirando'}
                </h3>
                <p className={`text-sm ${
                  isContractExpired ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {isContractExpired 
                    ? 'Fatura vencida. Entre em contato com o suporte para renovar seu plano.'
                    : `Seu contrato expira em ${contractInfo?.days_remaining} dias. Renove para continuar usando todos os recursos.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produtos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentMetrics?.total_products || 0}
                </p>
                {comparison && (
                  <p className={`text-sm ${getChangeColor(comparison.products)}`}>
                    {formatPercentage(comparison.products)} vs ontem
                  </p>
                )}
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentMetrics?.total_orders || 0}
                </p>
                {comparison && (
                  <p className={`text-sm ${getChangeColor(comparison.orders)}`}>
                    {formatPercentage(comparison.orders)} vs ontem
                  </p>
                )}
              </div>
              <ShoppingCart className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentMetrics?.total_revenue || 0)}
                </p>
                {comparison && (
                  <p className={`text-sm ${getChangeColor(comparison.revenue)}`}>
                    {formatPercentage(comparison.revenue)} vs ontem
                  </p>
                )}
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentMetrics?.active_customers || 0}
                </p>
                {comparison && (
                  <p className={`text-sm ${getChangeColor(comparison.customers)}`}>
                    {formatPercentage(comparison.customers)} vs ontem
                  </p>
                )}
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Contract Status */}
          <ContractStatusCard 
            tenantId={currentTenant.id} 
            showDetails={true}
          />

          {/* Recent Products */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Produtos Recentes</h2>
              <button 
                onClick={() => window.location.href = '/dashboard/products'}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Ver todos
              </button>
            </div>
            <div className="p-6">
              {recentProducts.length > 0 ? (
                <div className="space-y-4">
                  {recentProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.brand}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {product.variations?.length || 0} variações
                          </p>
                          <p className="text-sm text-gray-500">
                            {product.variations?.reduce((sum, v) => sum + v.stock_quantity, 0) || 0} em estoque
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Nenhum produto cadastrado</p>
                  <button
                    onClick={handleNewProduct}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Criar Primeiro Produto
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Estoque Baixo</h2>
            </div>
            <div className="p-6">
              {lowStockProducts.length > 0 ? (
                <div className="space-y-4">
                  {lowStockProducts.map((product) => {
                    const lowStockVariations = product.variations?.filter(v => v.stock_quantity <= 5) || [];
                    return (
                      <div key={product.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-red-600">
                              {lowStockVariations.length} variação(ões) com estoque baixo
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-600">
                            {Math.min(...lowStockVariations.map(v => v.stock_quantity))} restante(s)
                          </p>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Reabastecer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Todos os produtos com estoque adequado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button 
              onClick={handleNewProduct}
              disabled={isContractExpired}
              className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={isContractExpired ? 'Contrato expirado - Renove para adicionar produtos' : ''}
            >
              <Plus className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Adicionar Produto</span>
              {isContractExpired && (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard/products'}
              className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Package className="w-5 h-5 text-green-600" />
              <span className="font-medium">Gerenciar Produtos</span>
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard/reports'}
              className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Ver Relatórios</span>
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard/customization'}
              className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="w-5 h-5 text-orange-600" />
              <span className="font-medium">Personalizar Loja</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={showProductForm}
        onClose={handleFormClose}
        product={selectedProduct}
        onSave={handleFormSave}
      />
    </TenantLayout>
  );
};

export default TenantDashboard;