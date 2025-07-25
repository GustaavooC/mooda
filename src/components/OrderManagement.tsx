import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit, 
  Search,
  Filter,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
  Clock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import TenantLayout from './TenantLayout';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  subtotal: number;
  tax_amount?: number;
  shipping_amount?: number;
  total_amount: number;
  shipping_address?: any;
  billing_address?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_variation_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_variation?: {
    product?: {
      name: string;
      brand?: string;
    };
    color?: {
      name: string;
      hex_code: string;
    };
    size?: {
      name: string;
    };
  };
}

const OrderManagement: React.FC = () => {
  const { currentTenant } = useTenant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (currentTenant?.id) {
      fetchOrders();
    }
  }, [currentTenant]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Para usuários demo, gerar dados mock
      if (currentTenant?.slug) {
        const mockOrders = generateMockOrders();
        setOrders(mockOrders);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(name, email, phone),
          items:order_items(
            *,
            product_variation:product_variations(
              product:products(name, brand),
              color:colors(name, hex_code),
              size:sizes(name)
            )
          )
        `)
        .eq('tenant_id', currentTenant?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMockOrders = (): Order[] => {
    const statuses: Order['status'][] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const paymentStatuses: Order['payment_status'][] = ['pending', 'paid', 'failed'];
    
    return Array.from({ length: 15 }, (_, i) => ({
      id: `order-${i + 1}`,
      order_number: `ORD-${String(i + 1).padStart(4, '0')}`,
      customer_id: `customer-${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      payment_status: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
      payment_method: ['credit_card', 'pix', 'boleto'][Math.floor(Math.random() * 3)],
      subtotal: Math.floor(Math.random() * 500) + 50,
      tax_amount: 0,
      shipping_amount: Math.random() > 0.5 ? 15.90 : 0,
      total_amount: Math.floor(Math.random() * 500) + 65.90,
      shipping_address: {
        street: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipcode: '01234-567'
      },
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      customer: {
        name: `Cliente ${i + 1}`,
        email: `cliente${i + 1}@email.com`,
        phone: `(11) 9999-${String(i + 1).padStart(4, '0')}`
      },
      items: [
        {
          id: `item-${i + 1}`,
          product_variation_id: `variation-${i + 1}`,
          quantity: Math.floor(Math.random() * 3) + 1,
          unit_price: Math.floor(Math.random() * 200) + 50,
          total_price: Math.floor(Math.random() * 400) + 50,
          product_variation: {
            product: {
              name: `Produto ${i + 1}`,
              brand: 'Marca Exemplo'
            },
            color: {
              name: ['Preto', 'Branco', 'Azul', 'Vermelho'][Math.floor(Math.random() * 4)],
              hex_code: ['#000000', '#FFFFFF', '#0000FF', '#FF0000'][Math.floor(Math.random() * 4)]
            },
            size: {
              name: ['P', 'M', 'G', 'GG'][Math.floor(Math.random() * 4)]
            }
          }
        }
      ]
    }));
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Para demo, apenas atualizar localmente
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));

      // Em produção, faria a chamada para o Supabase
      // await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'processing': return 'Processando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: Order['payment_status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    const matchesDate = !dateFilter || order.created_at.startsWith(dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  if (loading) {
    return (
      <TenantLayout title="Pedidos" showBackButton={true}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout title="Gestão de Pedidos" showBackButton={true}>
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {averageOrderValue.toFixed(2)}
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
                    placeholder="Buscar por número do pedido, cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os status</option>
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="processing">Processando</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div className="sm:w-48">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items?.length || 0} item(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="processing">Processando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregue</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status === 'paid' ? 'Pago' : 
                         order.payment_status === 'pending' ? 'Pendente' :
                         order.payment_status === 'failed' ? 'Falhou' : 'Reembolsado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      R$ {order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter || dateFilter ? 'Nenhum pedido encontrado' : 'Nenhum pedido ainda'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter || dateFilter 
                ? 'Tente ajustar os filtros de busca' 
                : 'Os pedidos dos clientes aparecerão aqui'
              }
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Pedido {selectedOrder.order_number}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Order Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Pedido</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pagamento:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                        {selectedOrder.payment_status === 'paid' ? 'Pago' : 
                         selectedOrder.payment_status === 'pending' ? 'Pendente' : 'Falhou'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Método de Pagamento:</span>
                      <span className="font-medium">{selectedOrder.payment_method || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data do Pedido:</span>
                      <span className="font-medium">
                        {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Cliente</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{selectedOrder.customer?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{selectedOrder.customer?.email}</span>
                    </div>
                    {selectedOrder.customer?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedOrder.customer.phone}</span>
                      </div>
                    )}
                    {selectedOrder.shipping_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p>{selectedOrder.shipping_address.street}</p>
                          <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</p>
                          <p>{selectedOrder.shipping_address.zipcode}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Itens do Pedido</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variação</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{item.product_variation?.product?.name}</p>
                              <p className="text-sm text-gray-500">{item.product_variation?.product?.brand}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: item.product_variation?.color?.hex_code }}
                              />
                              <span className="text-sm">
                                {item.product_variation?.color?.name} - {item.product_variation?.size?.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="px-4 py-3">R$ {item.unit_price.toFixed(2)}</td>
                          <td className="px-4 py-3 font-medium">R$ {item.total_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.shipping_amount && selectedOrder.shipping_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Frete:</span>
                      <span>R$ {selectedOrder.shipping_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.tax_amount && selectedOrder.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Impostos:</span>
                      <span>R$ {selectedOrder.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>R$ {selectedOrder.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Observações:</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </TenantLayout>
  );
};

export default OrderManagement;