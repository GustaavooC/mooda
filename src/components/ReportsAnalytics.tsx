import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  Download,
  Filter,
  Eye,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { useMetrics } from '../hooks/useMetrics';
import TenantLayout from './TenantLayout';

interface ReportData {
  period: string;
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  avgOrderValue: number;
  conversionRate: number;
}

const ReportsAnalytics: React.FC = () => {
  const { currentTenant } = useTenant();
  const { tenantMetrics, getCurrentMetrics, getMetricsComparison } = useMetrics(currentTenant?.id);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [reportType, setReportType] = useState('overview');
  const [loading, setLoading] = useState(false);

  const currentMetrics = getCurrentMetrics();
  const comparison = getMetricsComparison();

  // Generate mock historical data for charts
  const generateHistoricalData = (): ReportData[] => {
    const days = parseInt(selectedPeriod);
    const data: ReportData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        period: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        revenue: Math.floor(Math.random() * 1000) + 200,
        orders: Math.floor(Math.random() * 20) + 5,
        customers: Math.floor(Math.random() * 15) + 3,
        products: Math.floor(Math.random() * 5) + 1,
        avgOrderValue: Math.floor(Math.random() * 200) + 50,
        conversionRate: Math.random() * 5 + 1
      });
    }
    
    return data;
  };

  const [historicalData, setHistoricalData] = useState<ReportData[]>([]);

  useEffect(() => {
    setHistoricalData(generateHistoricalData());
  }, [selectedPeriod]);

  const exportReport = () => {
    const csvContent = [
      ['Data', 'Receita', 'Pedidos', 'Clientes', 'Produtos', 'Ticket Médio', 'Conversão'],
      ...historicalData.map(row => [
        row.period,
        row.revenue.toFixed(2),
        row.orders.toString(),
        row.customers.toString(),
        row.products.toString(),
        row.avgOrderValue.toFixed(2),
        row.conversionRate.toFixed(2) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${currentTenant?.slug}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (value: number) => {
    return value >= 0 ? ArrowUp : ArrowDown;
  };

  const totalRevenue = historicalData.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = historicalData.reduce((sum, day) => sum + day.orders, 0);
  const totalCustomers = historicalData.reduce((sum, day) => sum + day.customers, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const topProducts = [
    { name: 'Produto A', sales: 45, revenue: 2250 },
    { name: 'Produto B', sales: 38, revenue: 1900 },
    { name: 'Produto C', sales: 32, revenue: 1600 },
    { name: 'Produto D', sales: 28, revenue: 1400 },
    { name: 'Produto E', sales: 25, revenue: 1250 }
  ];

  const topCustomers = [
    { name: 'Cliente A', orders: 8, spent: 1200 },
    { name: 'Cliente B', orders: 6, spent: 950 },
    { name: 'Cliente C', orders: 5, spent: 800 },
    { name: 'Cliente D', orders: 4, spent: 650 },
    { name: 'Cliente E', orders: 4, spent: 600 }
  ];

  return (
    <TenantLayout title="Relatórios e Analytics" showBackButton={true}>
      <div className="p-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-gray-600">Análise detalhada do desempenho da sua loja</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="overview">Visão Geral</option>
              <option value="sales">Vendas</option>
              <option value="products">Produtos</option>
              <option value="customers">Clientes</option>
            </select>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalRevenue)}
                </p>
                {comparison && (
                  <div className={`flex items-center gap-1 text-sm ${getChangeColor(comparison.revenue)}`}>
                    {React.createElement(getChangeIcon(comparison.revenue), { className: "w-3 h-3" })}
                    {formatPercentage(comparison.revenue)} vs período anterior
                  </div>
                )}
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                {comparison && (
                  <div className={`flex items-center gap-1 text-sm ${getChangeColor(comparison.orders)}`}>
                    {React.createElement(getChangeIcon(comparison.orders), { className: "w-3 h-3" })}
                    {formatPercentage(comparison.orders)} vs período anterior
                  </div>
                )}
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Novos Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                {comparison && (
                  <div className={`flex items-center gap-1 text-sm ${getChangeColor(comparison.customers)}`}>
                    {React.createElement(getChangeIcon(comparison.customers), { className: "w-3 h-3" })}
                    {formatPercentage(comparison.customers)} vs período anterior
                  </div>
                )}
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(averageOrderValue)}
                </p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <TrendingUp className="w-3 h-3" />
                  Baseado em {totalOrders} pedidos
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Receita por Dia</h3>
            <div className="h-64 flex items-end justify-between gap-1">
              {historicalData.map((day, index) => {
                const maxRevenue = Math.max(...historicalData.map(d => d.revenue));
                const height = (day.revenue / maxRevenue) * 100;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="bg-blue-500 rounded-t w-full min-h-[4px] hover:bg-blue-600 transition-colors cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`${day.period}: ${formatCurrency(day.revenue)}`}
                    />
                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                      {day.period}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Orders Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos por Dia</h3>
            <div className="h-64 flex items-end justify-between gap-1">
              {historicalData.map((day, index) => {
                const maxOrders = Math.max(...historicalData.map(d => d.orders));
                const height = (day.orders / maxOrders) * 100;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="bg-green-500 rounded-t w-full min-h-[4px] hover:bg-green-600 transition-colors cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`${day.period}: ${day.orders} pedidos`}
                    />
                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                      {day.period}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sales} vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                    <p className="text-sm text-gray-500">receita</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Melhores Clientes</h3>
            <div className="space-y-4">
              {topCustomers.map((customer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.orders} pedidos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(customer.spent)}</p>
                    <p className="text-sm text-gray-500">total gasto</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Métricas Adicionais</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{currentMetrics?.total_products || 0}</p>
              <p className="text-sm text-gray-600">Produtos Ativos</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {currentMetrics?.conversion_rate?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-sm text-gray-600">Taxa de Conversão</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{currentMetrics?.page_views || 0}</p>
              <p className="text-sm text-gray-600">Visualizações</p>
            </div>
          </div>
        </div>
      </div>
    </TenantLayout>
  );
};

export default ReportsAnalytics;