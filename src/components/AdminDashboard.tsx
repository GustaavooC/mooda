import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Store, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Settings,
  X,
  AlertCircle,
  CheckCircle,
  LogOut,
  Calendar,
  Clock
} from 'lucide-react';
import { useMetrics } from '../hooks/useMetrics';
import { useTenants } from '../hooks/useTenants';
import { useAuth } from '../hooks/useAuth';
import { useContract } from '../hooks/useContract';
import ContractStatusCard from './ContractStatusCard';

// Component to show active credentials
const ActiveCredentialsCard: React.FC = () => {
  const [credentials, setCredentials] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadCredentials = () => {
      try {
        const stored = localStorage.getItem('demo_credentials');
        if (stored) {
          setCredentials(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading credentials:', error);
      }
    };

    loadCredentials();
    
    // Listen for storage changes
    const handleStorageChange = () => loadCredentials();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const credentialEntries = Object.entries(credentials);

  if (credentialEntries.length === 0) {
    return null;
  }

  const testCredential = (email: string, password: string) => {
    // Fill the demo credentials in the login form
    const loginUrl = `/auth/signin?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    window.open(loginUrl, '_blank');
  };

  const clearAllCredentials = () => {
    if (window.confirm('Tem certeza que deseja limpar todas as credenciais de lojas criadas?')) {
      localStorage.removeItem('demo_credentials');
      setCredentials({});
      alert('Credenciais limpas com sucesso!');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Credenciais de Lojas Criadas ({credentialEntries.length})
        </h3>
        {credentialEntries.length > 0 && (
          <button
            onClick={clearAllCredentials}
            className="px-3 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
          >
            Limpar Todas
          </button>
        )}
      </div>
      <div className="space-y-3">
        {credentialEntries.map(([email, data]) => (
          <div key={email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{data.user.name}</p>
              <p className="text-sm text-gray-600">{email}</p>
              <p className="text-xs text-gray-500">Loja: {data.user.tenantName}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-mono text-blue-600">{data.password}</p>
                <p className="text-xs text-gray-500">Senha</p>
              </div>
              <button
                onClick={() => testCredential(email, data.password)}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title="Testar login"
              >
                Testar
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 Estas credenciais estão ativas e podem ser usadas para login imediatamente.
        </p>
      </div>
    </div>
  );
};

interface NewTenantForm {
  name: string;
  slug: string;
  description: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  contractDurationDays: number;
}

const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { systemMetrics, loading: metricsLoading, getCurrentMetrics, getMetricsComparison } = useMetrics();
  const { tenants, loading: tenantsLoading, createTenant, fetchTenants } = useTenants();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createResult, setCreateResult] = useState<any>(null);

  const [newTenantForm, setNewTenantForm] = useState<NewTenantForm>({
    name: '',
    slug: '',
    description: '',
    adminEmail: '',
    adminName: '',
    adminPassword: '',
    contractDurationDays: 30
  });

  const loading = metricsLoading || tenantsLoading;

  const currentMetrics = getCurrentMetrics();
  const comparison = getMetricsComparison();

  // Contract management
  const [selectedTenantForContract, setSelectedTenantForContract] = useState<string | null>(null);
  const [contractExtensionDays, setContractExtensionDays] = useState(30);
  const [contractLoading, setContractLoading] = useState(false);
  const { extendContract } = useContract();

  const handleExtendContract = async (tenantId: string, days: number) => {
    try {
      setContractLoading(true);
      await extendContract(tenantId, days);
      alert(`Contrato estendido por ${days} dias com sucesso!`);
      fetchTenants(); // Refresh the list
    } catch (error) {
      console.error('Error extending contract:', error);
      alert('Erro ao estender contrato. Tente novamente.');
    } finally {
      setContractLoading(false);
      setSelectedTenantForContract(null);
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || tenant.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, ''); // Remove hífens do início e fim
  };

  const handleFormChange = (field: keyof NewTenantForm, value: string) => {
    setNewTenantForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-gerar slug quando o nome muda
      if (field === 'name') {
        updated.slug = generateSlug(value);
      }
      
      // Auto-gerar email quando o nome muda
      if (field === 'name' && value) {
        const emailPrefix = generateSlug(value).replace(/-/g, '');
        updated.adminEmail = `admin@${emailPrefix}.com`;
      }

      // Auto-gerar nome do admin quando o nome da loja muda
      if (field === 'name' && value) {
        updated.adminName = `Administrador - ${value}`;
      }
      
      return updated;
    });
  };

  const validateForm = () => {
    if (!newTenantForm.name.trim()) {
      setCreateError('Nome da loja é obrigatório');
      return false;
    }
    if (!newTenantForm.slug.trim()) {
      setCreateError('Slug é obrigatório');
      return false;
    }
    if (!newTenantForm.adminEmail.trim()) {
      setCreateError('Email do administrador é obrigatório');
      return false;
    }
    if (!newTenantForm.adminName.trim()) {
      setCreateError('Nome do administrador é obrigatório');
      return false;
    }
    if (newTenantForm.adminPassword.length < 6) {
      setCreateError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    // Verificar se slug já existe
    const slugExists = tenants.some(tenant => 
      tenant.slug.toLowerCase() === newTenantForm.slug.toLowerCase()
    );
    if (slugExists) {
      setCreateError('Este slug já está em uso. Escolha outro.');
      return false;
    }

    return true;
  };

  const handleCreateTenant = async () => {
    if (!validateForm()) return;

    setCreateLoading(true);
    setCreateError(null);

    try {
      console.log('Creating tenant with data:', newTenantForm);
      
      // Chama o createTenant com os dados necessários
      const result = await createTenant({
        name: newTenantForm.name,
        slug: newTenantForm.slug,
        description: newTenantForm.description,
        status: 'active', // ou o status que você quiser definir
        settings: {
          theme: 'default',
          currency: 'BRL',
          colors: {
            primary: '#3B82F6',
            secondary: '#EFF6FF'
          }
        },
        adminEmail: newTenantForm.adminEmail,
        adminName: newTenantForm.adminName,
        adminPassword: newTenantForm.adminPassword,
        contractDurationDays: newTenantForm.contractDurationDays
      });

      if (!result.success) {
        throw new Error(result.message || 'Erro ao criar loja');
      }

      console.log('Tenant created successfully:', result);
      
      // Mostra mensagem de sucesso
      setCreateResult(result);
      setCreateSuccess(true);
      
      // Show success message with registration link
      setTimeout(() => {
        setCreateSuccess(false);
        setCreateResult(null);
        setShowCreateModal(false);
        setNewTenantForm({
          name: '',
          slug: '',
          description: '',
          adminEmail: '',
          adminName: '',
          adminPassword: 'loja123',
          contractDurationDays: 30
        });
        fetchTenants(); // Atualiza a lista de tenants
      }, 5000);

    } catch (error) {
      console.error('Error creating tenant:', error);
      setCreateError(error instanceof Error ? error.message : 'Erro ao criar loja');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/auth/signin';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
              <p className="text-gray-600 mt-1">Visão geral do sistema e gestão de lojas</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Olá, {user.user_metadata?.name || user.email}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Loja
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Lojas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentMetrics?.total_tenants || 0}
                </p>
                {comparison && (
                  <p className={`text-sm ${getChangeColor(comparison.tenants)}`}>
                    {formatPercentage(comparison.tenants)} vs ontem
                  </p>
                )}
              </div>
              <Store className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lojas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentMetrics?.active_tenants || 0}
                </p>
                {comparison && (
                  <p className={`text-sm ${getChangeColor(comparison.activeTenants)}`}>
                    {formatPercentage(comparison.activeTenants)} vs ontem
                  </p>
                )}
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(currentMetrics?.total_users || 0)}
                </p>
                {comparison && (
                  <p className={`text-sm ${getChangeColor(comparison.users)}`}>
                    {formatPercentage(comparison.users)} vs ontem
                  </p>
                )}
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">MRR</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentMetrics?.mrr || 0)}
                </p>
                {comparison && (
                  <p className={`text-sm ${getChangeColor(comparison.mrr)}`}>
                    {formatPercentage(comparison.mrr)} vs ontem
                  </p>
                )}
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Active Credentials */}
        <ActiveCredentialsCard />

        {/* Tenants Management */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Gestão de Lojas</h2>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou slug..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os status</option>
                  <option value="active">Ativo</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspenso</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contrato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {tenant.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                          <div className="text-sm text-gray-500">/{tenant.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tenant.status)}`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.subscription?.plan || 'Free'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ContractStatusDisplay tenantId={tenant.id} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/loja/${tenant.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setSelectedTenantForContract(tenant.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Gerenciar Contrato"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTenants.length === 0 && (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma loja encontrada</h3>
              <p className="text-gray-600">
                {searchTerm || selectedStatus ? 'Tente ajustar os filtros' : 'Comece criando sua primeira loja'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Criar Nova Loja</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {createSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Loja criada com sucesso!</h3>
                  <p className="text-gray-600 mb-4">
                    A loja "{newTenantForm.name}" foi criada e está disponível em:
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-mono text-sm text-blue-600">
                      /loja/{newTenantForm.slug}
                    </p>
                  </div>
                  {createResult?.data?.real_user_created ? (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">✅ Usuário Real Criado!</h4>
                      <div className="space-y-2 text-sm text-green-700">
                        <p><strong>📧 Email:</strong> {newTenantForm.adminEmail}</p>
                        <p><strong>🔑 Senha:</strong> {newTenantForm.adminPassword}</p>
                        <p><strong>🏪 URL da Loja:</strong> /loja/{newTenantForm.slug}</p>
                        <div className="mt-3 p-2 bg-white rounded border">
                          <p className="font-medium text-green-800 mb-1">Login Disponível:</p>
                          <p className="text-xs">1. Vá para /auth/signin</p>
                          <p className="text-xs">2. Use as credenciais acima</p>
                          <p className="text-xs">3. Acesse o dashboard da loja</p>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded">
                        <p className="text-xs text-green-800 font-medium">
                          🎉 Usuário criado no Supabase Auth - Sistema de produção ativo!
                        </p>
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="font-medium text-green-800 mb-2">🚀 Pronto para Usar:</p>
                          <div className="space-y-1 text-xs">
                            <p>✅ Usuário criado no Supabase Auth</p>
                            <p>✅ Perfil e permissões configurados</p>
                            <p>✅ Loja vinculada automaticamente</p>
                            <p>✅ Login disponível imediatamente</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-white rounded border">
                        <p className="font-medium text-green-800 mb-1">Como Testar:</p>
                        <div className="space-y-1 text-xs">
                          <p>1. Vá para <code>/auth/signin</code></p>
                          <p>2. Use: {newTenantForm.adminEmail}</p>
                          <p>3. Senha: {newTenantForm.adminPassword}</p>
                          <p>4. Acesse o dashboard da loja</p>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                        {window.location.origin}{createResult.data.registration_url}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <a
                          href={`/auth/signin?email=${encodeURIComponent(newTenantForm.adminEmail)}&password=${encodeURIComponent(newTenantForm.adminPassword)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          🚀 Testar Login
                        </a>
                        <a
                          href={`/loja/${newTenantForm.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          👁️ Ver Loja
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-6">
                  {createError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-700 text-sm">{createError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Loja *
                      </label>
                      <input
                        type="text"
                        value={newTenantForm.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Minha Loja Incrível"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slug (URL) *
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          /loja/
                        </span>
                        <input
                          type="text"
                          value={newTenantForm.slug}
                          onChange={(e) => handleFormChange('slug', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="minha-loja"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={newTenantForm.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descreva brevemente o que a loja vende..."
                    />
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Administrador da Loja</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome do Administrador *
                        </label>
                        <input
                          type="text"
                          value={newTenantForm.adminName}
                          onChange={(e) => handleFormChange('adminName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nome completo"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email do Administrador *
                        </label>
                        <input
                          type="email"
                          value={newTenantForm.adminEmail}
                          onChange={(e) => handleFormChange('adminEmail', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="admin@minhaloja.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Senha *
                        </label>
                        <input
                          type="password"
                          value={newTenantForm.adminPassword}
                          onChange={(e) => handleFormChange('adminPassword', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duração do Contrato (dias) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newTenantForm.contractDurationDays}
                          onChange={(e) => handleFormChange('contractDurationDays', parseInt(e.target.value) || 30)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="30"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Resumo:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Loja:</strong> {newTenantForm.name || 'Nome da loja'}</p>
                      <p><strong>URL:</strong> /loja/{newTenantForm.slug || 'slug'}</p>
                      <p><strong>Admin:</strong> {newTenantForm.adminEmail || 'email@exemplo.com'}</p>
                      <p><strong>Senha:</strong> {newTenantForm.adminPassword}</p>
                      <p><strong>Contrato:</strong> {newTenantForm.contractDurationDays} dias</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!createSuccess && (
              <div className="flex items-center justify-between p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateTenant}
                  disabled={createLoading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {createLoading ? 'Criando...' : 'Criar Loja'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contract Extension Modal */}
      {selectedTenantForContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Gerenciar Contrato</h2>
              <button
                onClick={() => setSelectedTenantForContract(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <ContractStatusCard 
                  tenantId={selectedTenantForContract} 
                  showDetails={true}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estender contrato por quantos dias?
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={contractExtensionDays}
                    onChange={(e) => setContractExtensionDays(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="30"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setContractExtensionDays(7)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    7 dias
                  </button>
                  <button
                    onClick={() => setContractExtensionDays(30)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    30 dias
                  </button>
                  <button
                    onClick={() => setContractExtensionDays(90)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    90 dias
                  </button>
                  <button
                    onClick={() => setContractExtensionDays(365)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    1 ano
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <button
                onClick={() => setSelectedTenantForContract(null)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleExtendContract(selectedTenantForContract, contractExtensionDays)}
                disabled={contractLoading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {contractLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {contractLoading ? 'Estendendo...' : 'Estender Contrato'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component to display contract status in the table
const ContractStatusDisplay: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const { contractInfo, loading } = useContract(tenantId);

  if (loading) {
    return <div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div>;
  }

  if (!contractInfo) {
    return <span className="text-gray-500 text-sm">N/A</span>;
  }

  const isExpired = contractInfo.is_expired;
  const isExpiringSoon = contractInfo.days_remaining <= 7 && !isExpired;

  return (
    <div className="text-sm">
      <div className={`flex items-center gap-1 ${
        isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-green-600'
      }`}>
        <Clock className="w-3 h-3" />
        <span>
          {isExpired 
            ? `Expirado há ${contractInfo.days_since_expiry}d`
            : `${contractInfo.days_remaining}d restantes`
          }
        </span>
      </div>
      <div className="text-gray-500 text-xs">
        {new Date(contractInfo.contract_end_date).toLocaleDateString('pt-BR')}
      </div>
    </div>
  );
};

export default AdminDashboard;