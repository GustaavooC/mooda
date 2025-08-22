import React, { useState } from 'react';
import { Mail, Lock, User, Store, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface AuthFormProps {
  mode: 'signin' | 'signup' | 'admin';
  onSuccess?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSuccess }) => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    password: searchParams.get('password') || '',
    confirmPassword: '',
    name: '',
    tenantSlug: searchParams.get('tenant') || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableTenant, setAvailableTenant] = useState<any>(null);

  // Check if there's a tenant waiting for registration
  React.useEffect(() => {
    const checkTenant = async () => {
      const tenantSlug = searchParams.get('tenant');
      if (tenantSlug && mode === 'signup') {
        try {
          const { data: tenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('slug', tenantSlug)
            .is('owner_id', null)
            .single();
          
          if (tenant) {
            setAvailableTenant(tenant);
            setFormData(prev => ({
              ...prev,
              tenantSlug: tenant.slug
            }));
          }
        } catch (error) {
          console.error('Error checking tenant:', error);
        }
      }
    };
    
    checkTenant();
  }, [searchParams, mode]);

  // Auto-fill and focus if URL params are present
  React.useEffect(() => {
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    
    if (email && password) {
      setFormData(prev => ({
        ...prev,
        email,
        password
      }));
      
      // Show a message that credentials were pre-filled
      setTimeout(() => {
        const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.focus();
        }
      }, 100);
    }
  }, [searchParams]);

  // Auto-gerar slug da loja
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validação de formulário
  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email e senha são obrigatórios');
      return false;
    }

    if (mode === 'signup') {
      if (!formData.name) {
        setError('Todos os campos são obrigatórios');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem');
        return false;
      }
      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return false;
      }
    }

    return true;
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        // First, create the user account
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name
            }
          }
        });

        if (signUpError) {
          switch (signUpError.message) {
            case 'User already registered':
              throw new Error('Este email já está registrado');
            case 'Password should be at least 6 characters':
              throw new Error('A senha deve ter pelo menos 6 caracteres');
            default:
              throw signUpError;
          }
        }

        // If there's a tenant waiting, associate the user with it
        if (availableTenant && authData.user) {
          try {
            // Create user profile
            await supabase
              .from('users')
              .insert({
                id: authData.user.id,
                email: formData.email,
                name: formData.name
              });

            // Update tenant with owner_id
            await supabase
              .from('tenants')
              .update({ owner_id: authData.user.id })
              .eq('id', availableTenant.id);

            // Create tenant_users relationship
            await supabase
              .from('tenant_users')
              .insert({
                tenant_id: availableTenant.id,
                user_id: authData.user.id,
                role: 'owner',
                is_active: true
              });

            setSuccess(true);
            setTimeout(() => {
              navigate('/auth/signin');
            }, 3000);
          } catch (tenantError) {
            console.error('Error associating user with tenant:', tenantError);
            setError('Conta criada, mas erro ao vincular à loja. Entre em contato com o suporte.');
          }
        } else {
          setSuccess(true);
          setTimeout(() => {
            navigate('/auth/signin');
          }, 3000);
        }

      } else {
        const result = await signIn(formData.email, formData.password);
        if (result.error) {
          switch (result.error.message) {
            case 'Invalid login credentials':
              throw new Error('Email ou senha inválidos');
            case 'Email not confirmed':
              throw new Error('Por favor, confirme seu email antes de fazer login');
            default:
              throw result.error;
          }
        }
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(mode === 'admin' ? '/admin' : '/dashboard');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  // Credenciais demo
  const getDemoCredentials = () => {
    if (mode === 'admin') {
      return {
        email: 'admin@mooda.com',
        password: 'admin123',
        label: 'Admin do Sistema'
      };
    } else {
      return {
        email: 'loja@moda-bella.com',
        password: 'loja123',
        label: 'Loja Moda Bella'
      };
    }
  };

  const fillDemoCredentials = () => {
    const demo = getDemoCredentials();
    setFormData(prev => ({
      ...prev,
      email: demo.email,
      password: demo.password
    }));
  };

  // Títulos e subtítulos
  const getTitle = () => {
    switch (mode) {
      case 'signin': return 'Entrar na sua conta';
      case 'signup': return 'Criar nova loja';
      case 'admin': return 'Acesso Administrativo';
      default: return 'Autenticação';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signin': return 'Acesse o painel da sua loja';
      case 'signup': return availableTenant ? `Registre-se como administrador da loja "${availableTenant.name}"` : 'Crie sua conta';
      case 'admin': return 'Painel de administração do sistema';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            {mode === 'admin' ? (
              <User className="h-6 w-6 text-white" />
            ) : (
              <Store className="h-6 w-6 text-white" />
            )}
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">{getTitle()}</h2>
          <p className="mt-2 text-sm text-gray-600">{getSubtitle()}</p>
        </div>

        {/* Mensagem de sucesso para signup */}
        {mode === 'signup' && success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-800 mb-2">Conta criada com sucesso! 🎉</h3>
            <p className="text-sm text-green-600">
              {availableTenant 
                ? `Você agora é o administrador da loja "${availableTenant.name}". Redirecionando para o login...`
                : 'Verifique seu email para confirmar sua conta. Redirecionando para o login...'
              }
            </p>
          </div>
        )}

        {/* Tenant Registration Info */}
        {mode === 'signup' && availableTenant && !success && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Registro de Administrador</h3>
            <p className="text-sm text-blue-600 mb-2">
              Você está se registrando como administrador da loja:
            </p>
            <div className="bg-white p-3 rounded border">
              <p className="font-medium text-blue-900">{availableTenant.name}</p>
              <p className="text-sm text-blue-700">/{availableTenant.slug}</p>
            </div>
          </div>
        )}

        {/* Demo Credentials (não exibe no signup) */}
        {mode !== 'signup' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            {searchParams.get('email') && searchParams.get('password') && (
              <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Credenciais pré-preenchidas automaticamente
                </p>
                <p className="text-xs text-green-700">
                  Clique em "Entrar" para fazer login
                </p>
              </div>
            )}
            <h3 className="text-sm font-medium text-blue-800 mb-2">🎯 Credenciais Demo:</h3>
            <div className="text-sm text-blue-700 mb-3">
              <p><strong>Email:</strong> {getDemoCredentials().email}</p>
              <p><strong>Senha:</strong> {getDemoCredentials().password}</p>
              <p><strong>Tipo:</strong> {getDemoCredentials().label}</p>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Preencher Automaticamente
            </button>
          </div>
        )}

        {/* Formulário */}
        {!success && (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sua senha"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirme sua senha"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : success ? 'Sucesso!' : (mode === 'signup' ? 'Criar Loja' : 'Entrar')}
          </button>

          {/* Links para alternar entre login/criação */}
          {mode !== 'admin' && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {mode === 'signup' ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
                <a 
                  href={mode === 'signup' ? '/auth/signin' : '/auth/signup'}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  {mode === 'signup' ? 'Fazer login' : 'Criar loja grátis'}
                </a>
              </p>
            </div>
          )}
        </form>
        )}

        {/* Aviso sobre credenciais reais */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            <strong>⚠️ Importante:</strong> Se você é um usuário real (não demo), use as credenciais fornecidas durante a criação da sua loja ou pelo administrador.
          </p>
        </div>

        {/* Lista de Credenciais Demo */}
        {mode !== 'signup' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-800 mb-3">📋 Todas as Credenciais Demo:</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div><strong>Admin:</strong> admin@mooda.com / admin123</div>
              <div><strong>Moda Bella:</strong> loja@moda-bella.com / loja123</div>
              <div><strong>Tech Store:</strong> admin@tech-store-pro.com / loja123</div>
              <div><strong>Casa Decoração:</strong> gerente@casa-decoracao.com / loja123</div>
              <div><strong>Esporte Total:</strong> dono@esporte-total.com / loja123</div>
              <div><strong>Beleza Natural:</strong> admin@beleza-natural.com / loja123</div>
              <div><strong>Livraria Saber:</strong> livreiro@livraria-saber.com / loja123</div>
              <div><strong>Pet Shop:</strong> veterinario@pet-shop-amigo.com / loja123</div>
              <div><strong>Gourmet:</strong> chef@gourmet-express.com / loja123</div>
              <div><strong>Jardim:</strong> jardineiro@jardim-verde.com / loja123</div>
              <div><strong>Arte:</strong> artista@arte-craft.com / loja123</div>
              <div className="pt-2 border-t border-gray-300 mt-3">
                <p className="text-xs text-blue-600 font-medium">
                  💡 Dica: Lojas criadas pelo admin são automaticamente adicionadas ao sistema de login
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ✅ Credenciais de lojas criadas ficam disponíveis imediatamente
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthForm;