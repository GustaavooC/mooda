import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Store, 
  User, 
  Bell, 
  Shield, 
  CreditCard,
  Globe,
  Mail,
  Phone,
  MapPin,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Upload,
  X
} from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../hooks/useAuth';
import TenantLayout from './TenantLayout';

interface StoreSettings {
  name: string;
  description: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipcode: string;
    country: string;
  };
  business: {
    cnpj: string;
    ie: string;
    category: string;
  };
  notifications: {
    newOrders: boolean;
    lowStock: boolean;
    customerMessages: boolean;
    marketing: boolean;
  };
  payment: {
    pixKey: string;
    bankAccount: string;
    paymentMethods: string[];
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  social: {
    instagram: string;
    facebook: string;
    whatsapp: string;
    website: string;
  };
}

const StoreSettings: React.FC = () => {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [settings, setSettings] = useState<StoreSettings>({
    name: currentTenant?.name || '',
    description: currentTenant?.description || '',
    email: user?.email || '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipcode: '',
      country: 'Brasil'
    },
    business: {
      cnpj: '',
      ie: '',
      category: ''
    },
    notifications: {
      newOrders: true,
      lowStock: true,
      customerMessages: true,
      marketing: false
    },
    payment: {
      pixKey: '',
      bankAccount: '',
      paymentMethods: ['pix', 'credit_card']
    },
    seo: {
      title: currentTenant?.name || '',
      description: currentTenant?.description || '',
      keywords: ''
    },
    social: {
      instagram: '',
      facebook: '',
      whatsapp: '',
      website: ''
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showMessage('success', 'Configurações salvas com sucesso!');
    } catch (error) {
      showMessage('error', 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      
      // Simular mudança de senha
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', 'Senha alterada com sucesso!');
    } catch (error) {
      showMessage('error', 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'Geral', icon: Store },
    { id: 'business', name: 'Empresa', icon: Settings },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'payment', name: 'Pagamentos', icon: CreditCard },
    { id: 'seo', name: 'SEO', icon: Globe },
    { id: 'social', name: 'Redes Sociais', icon: User },
    { id: 'security', name: 'Segurança', icon: Shield }
  ];

  const businessCategories = [
    'Moda e Vestuário',
    'Eletrônicos e Tecnologia',
    'Casa e Decoração',
    'Esportes e Lazer',
    'Beleza e Cosméticos',
    'Livros e Educação',
    'Pet Shop',
    'Alimentação',
    'Jardinagem',
    'Arte e Artesanato',
    'Outros'
  ];

  const paymentMethods = [
    { id: 'pix', name: 'PIX', description: 'Pagamento instantâneo' },
    { id: 'credit_card', name: 'Cartão de Crédito', description: 'Visa, Mastercard, etc.' },
    { id: 'debit_card', name: 'Cartão de Débito', description: 'Débito online' },
    { id: 'boleto', name: 'Boleto Bancário', description: 'Pagamento via boleto' },
    { id: 'bank_transfer', name: 'Transferência Bancária', description: 'TED/DOC' }
  ];

  return (
    <TenantLayout title="Configurações da Loja" showBackButton={true}>
      <div className="p-6">
        {/* Message */}
        {message && (
          <div className={`flex items-center gap-3 p-4 rounded-lg mb-6 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Gerais</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome da Loja *
                        </label>
                        <input
                          type="text"
                          value={settings.name}
                          onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email de Contato *
                        </label>
                        <input
                          type="email"
                          value={settings.email}
                          onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          value={settings.phone}
                          onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição da Loja
                      </label>
                      <textarea
                        value={settings.description}
                        onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Descreva sua loja..."
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Endereço</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Endereço Completo
                        </label>
                        <input
                          type="text"
                          value={settings.address.street}
                          onChange={(e) => setSettings(prev => ({ 
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
                          value={settings.address.city}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, city: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado
                        </label>
                        <select
                          value={settings.address.state}
                          onChange={(e) => setSettings(prev => ({ 
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
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CEP
                        </label>
                        <input
                          type="text"
                          value={settings.address.zipcode}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, zipcode: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="00000-000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Settings */}
              {activeTab === 'business' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Empresa</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CNPJ
                        </label>
                        <input
                          type="text"
                          value={settings.business.cnpj}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            business: { ...prev.business, cnpj: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="00.000.000/0000-00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Inscrição Estadual
                        </label>
                        <input
                          type="text"
                          value={settings.business.ie}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            business: { ...prev.business, ie: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoria do Negócio
                        </label>
                        <select
                          value={settings.business.category}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            business: { ...prev.business, category: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Selecione uma categoria</option>
                          {businessCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferências de Notificação</h3>
                    
                    <div className="space-y-4">
                      {Object.entries(settings.notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {key === 'newOrders' && 'Novos Pedidos'}
                              {key === 'lowStock' && 'Estoque Baixo'}
                              {key === 'customerMessages' && 'Mensagens de Clientes'}
                              {key === 'marketing' && 'Marketing e Promoções'}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {key === 'newOrders' && 'Receba notificações quando houver novos pedidos'}
                              {key === 'lowStock' && 'Seja alertado quando produtos estiverem com estoque baixo'}
                              {key === 'customerMessages' && 'Notificações de mensagens e avaliações de clientes'}
                              {key === 'marketing' && 'Dicas de marketing e novidades da plataforma'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                notifications: {
                                  ...prev.notifications,
                                  [key]: e.target.checked
                                }
                              }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Pagamento</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Métodos de Pagamento Aceitos</h4>
                        <div className="space-y-3">
                          {paymentMethods.map(method => (
                            <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={settings.payment.paymentMethods.includes(method.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSettings(prev => ({
                                        ...prev,
                                        payment: {
                                          ...prev.payment,
                                          paymentMethods: [...prev.payment.paymentMethods, method.id]
                                        }
                                      }));
                                    } else {
                                      setSettings(prev => ({
                                        ...prev,
                                        payment: {
                                          ...prev.payment,
                                          paymentMethods: prev.payment.paymentMethods.filter(id => id !== method.id)
                                        }
                                      }));
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{method.name}</p>
                                  <p className="text-sm text-gray-500">{method.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chave PIX
                          </label>
                          <input
                            type="text"
                            value={settings.payment.pixKey}
                            onChange={(e) => setSettings(prev => ({ 
                              ...prev, 
                              payment: { ...prev.payment, pixKey: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Email, telefone ou chave aleatória"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Conta Bancária
                          </label>
                          <input
                            type="text"
                            value={settings.payment.bankAccount}
                            onChange={(e) => setSettings(prev => ({ 
                              ...prev, 
                              payment: { ...prev.payment, bankAccount: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Banco, agência, conta"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SEO Settings */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Otimização para Buscadores (SEO)</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Título da Página (Meta Title)
                        </label>
                        <input
                          type="text"
                          value={settings.seo.title}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            seo: { ...prev.seo, title: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Título que aparece no Google"
                        />
                        <p className="text-xs text-gray-500 mt-1">Máximo 60 caracteres</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descrição (Meta Description)
                        </label>
                        <textarea
                          value={settings.seo.description}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            seo: { ...prev.seo, description: e.target.value }
                          }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Descrição que aparece no Google"
                        />
                        <p className="text-xs text-gray-500 mt-1">Máximo 160 caracteres</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Palavras-chave
                        </label>
                        <input
                          type="text"
                          value={settings.seo.keywords}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            seo: { ...prev.seo, keywords: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="palavra1, palavra2, palavra3"
                        />
                        <p className="text-xs text-gray-500 mt-1">Separe as palavras-chave com vírgulas</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Media */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Redes Sociais</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instagram
                        </label>
                        <input
                          type="url"
                          value={settings.social.instagram}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            social: { ...prev.social, instagram: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://instagram.com/suapagina"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Facebook
                        </label>
                        <input
                          type="url"
                          value={settings.social.facebook}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            social: { ...prev.social, facebook: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://facebook.com/suapagina"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          WhatsApp
                        </label>
                        <input
                          type="tel"
                          value={settings.social.whatsapp}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            social: { ...prev.social, whatsapp: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="(11) 99999-9999"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          value={settings.social.website}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            social: { ...prev.social, website: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://seusite.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Segurança da Conta</h3>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          Mantenha sua conta segura alterando sua senha regularmente.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Senha Atual *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nova Senha *
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmar Nova Senha *
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <button
                        onClick={handlePasswordChange}
                        disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Alterando...' : 'Alterar Senha'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              {activeTab !== 'security' && (
                <div className="flex items-center justify-end pt-6 border-t">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TenantLayout>
  );
};

export default StoreSettings;