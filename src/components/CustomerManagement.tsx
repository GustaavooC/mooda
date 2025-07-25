import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  ShoppingCart,
  DollarSign,
  Eye,
  X,
  User,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import TenantLayout from './TenantLayout';

interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
  created_at: string;
  updated_at: string;
  orders_count?: number;
  total_spent?: number;
  last_order_date?: string;
}

const CustomerManagement: React.FC = () => {
  const { currentTenant } = useTenant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipcode: ''
    }
  });

  useEffect(() => {
    if (currentTenant?.id) {
      fetchCustomers();
    }
  }, [currentTenant]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Para usuários demo, gerar dados mock
      if (currentTenant?.slug) {
        const mockCustomers = generateMockCustomers();
        setCustomers(mockCustomers);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMockCustomers = (): Customer[] => {
    const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Brasília', 'Fortaleza'];
    const states = ['SP', 'RJ', 'MG', 'BA', 'DF', 'CE'];
    
    return Array.from({ length: 25 }, (_, i) => ({
      id: `customer-${i + 1}`,
      tenant_id: currentTenant?.id || '',
      name: `Cliente ${i + 1}`,
      email: `cliente${i + 1}@email.com`,
      phone: `(11) 9999-${String(i + 1).padStart(4, '0')}`,
      address: {
        street: `Rua das Flores, ${100 + i}`,
        city: cities[i % cities.length],
        state: states[i % states.length],
        zipcode: `${String(i + 1).padStart(5, '0')}-000`
      },
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      orders_count: Math.floor(Math.random() * 10) + 1,
      total_spent: Math.floor(Math.random() * 2000) + 100,
      last_order_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedCustomer) {
        // Update existing customer
        setCustomers(prev => prev.map(customer => 
          customer.id === selectedCustomer.id 
            ? { ...customer, ...formData, updated_at: new Date().toISOString() }
            : customer
        ));
      } else {
        // Create new customer
        const newCustomer: Customer = {
          id: `customer-${Date.now()}`,
          tenant_id: currentTenant?.id || '',
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          orders_count: 0,
          total_spent: 0
        };
        setCustomers(prev => [newCustomer, ...prev]);
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: { street: '', city: '', state: '', zipcode: '' }
      });
      setShowForm(false);
      setSelectedCustomer(null);
      
    } catch (err) {
      console.error('Error saving customer:', err);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || { street: '', city: '', state: '', zipcode: '' }
    });
    setShowForm(true);
  };

  const handleDelete = async (customerId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return customer.name.toLowerCase().includes(searchLower) ||
           customer.email.toLowerCase().includes(searchLower) ||
           customer.phone?.toLowerCase().includes(searchLower);
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'email':
        return a.email.localeCompare(b.email);
      case 'orders_count':
        return (b.orders_count || 0) - (a.orders_count || 0);
      case 'total_spent':
        return (b.total_spent || 0) - (a.total_spent || 0);
      case 'created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.orders_count && c.orders_count > 0).length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const averageOrderValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  if (loading) {
    return (
      <TenantLayout title="Clientes" showBackButton={true}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout title="Gestão de Clientes" showBackButton={true}>
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <ShoppingCart className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{activeCustomers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-purple-600" />
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
              <Calendar className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">Gerencie sua base de clientes</p>
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setFormData({
                name: '',
                email: '',
                phone: '',
                address: { street: '', city: '', state: '', zipcode: '' }
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
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
                    placeholder="Buscar por nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="created_at">Mais recentes</option>
                  <option value="name">Nome A-Z</option>
                  <option value="orders_count">Mais pedidos</option>
                  <option value="total_spent">Maior gasto</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Gasto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {customer.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1 mb-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.address?.city && customer.address?.state ? (
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {customer.address.city}, {customer.address.state}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Não informado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.orders_count || 0}
                      </div>
                      {customer.last_order_date && (
                        <div className="text-xs text-gray-500">
                          Último: {new Date(customer.last_order_date).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      R$ {(customer.total_spent || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {sortedCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos de busca' 
                : 'Comece adicionando seu primeiro cliente'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adicionar Cliente
              </button>
            )}
          </div>
        )}
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome do cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.address.zipcode}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, zipcode: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="00000-000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={formData.address.state}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, state: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione o estado</option>
                    <option value="SP">São Paulo</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="BA">Bahia</option>
                    <option value="PR">Paraná</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="PE">Pernambuco</option>
                    <option value="CE">Ceará</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="GO">Goiás</option>
                    <option value="DF">Distrito Federal</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {selectedCustomer ? 'Atualizar Cliente' : 'Criar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && !showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalhes do Cliente
              </h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-gray-600">Cliente desde {new Date(selectedCustomer.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Informações de Contato</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedCustomer.email}</span>
                    </div>
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{selectedCustomer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Estatísticas</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total de Pedidos:</span>
                      <span className="text-sm font-medium">{selectedCustomer.orders_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Gasto:</span>
                      <span className="text-sm font-medium text-green-600">
                        R$ {(selectedCustomer.total_spent || 0).toFixed(2)}
                      </span>
                    </div>
                    {selectedCustomer.last_order_date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Último Pedido:</span>
                        <span className="text-sm font-medium">
                          {new Date(selectedCustomer.last_order_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedCustomer.address && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Endereço</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <div>
                        {selectedCustomer.address.street && (
                          <p className="text-sm">{selectedCustomer.address.street}</p>
                        )}
                        {(selectedCustomer.address.city || selectedCustomer.address.state) && (
                          <p className="text-sm">
                            {selectedCustomer.address.city}{selectedCustomer.address.city && selectedCustomer.address.state && ', '}{selectedCustomer.address.state}
                          </p>
                        )}
                        {selectedCustomer.address.zipcode && (
                          <p className="text-sm">{selectedCustomer.address.zipcode}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => handleEdit(selectedCustomer)}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Editar Cliente
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TenantLayout>
  );
};

export default CustomerManagement;