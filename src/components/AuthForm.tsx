import React, { useState } from 'react';
import { Mail, Lock, User, Store, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface AuthFormProps {
  mode: 'signin' | 'signup' | 'admin';
  onSuccess?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSuccess }) => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    storeName: '',
    storeSlug: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-gerar slug da loja
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'storeName' && {
        storeSlug: value.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      })
    }));
  };

  // Validação de formulário
  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email e senha são obrigatórios');
      return false;
    }

    if (mode === 'signup') {
      if (!formData.name || !formData.storeName || !formData.storeSlug) {
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
        const { error } = await signUp(formData.email, formData.password, {
          name: formData.name,
          store_name: formData.storeName,
          store_slug: formData.storeSlug,
        });

        if (error) {
          switch (error.message) {
            case 'User already registered':
              throw new Error('Este email já está registrado');
            case 'Password should be at least 6 characters':
              throw new Error('A senha deve ter pelo menos 6 caracteres');
            default:
              throw error;
          }
        }
        setSuccess(true);
        setTimeout(() => {
          navigate('/auth/signin');
        }, 5000);

      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          switch (error.message) {
            case 'Invalid login credentials':
              throw new Error('Email ou senha inválidos');
            case 'Email not confirmed':
              throw new Error('Por favor, confirme seu email antes de fazer login');
            default:
              throw error;
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
      case 'signup': return 'Comece a vender online hoje mesmo';
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
            <h3 className="text-lg font-medium text-green-800 mb-2">
              Loja criada com sucesso! 🎉
            </h3>
            <p className="text-sm text-green-600">
              Verifique seu email para confirmar sua conta. Você será redirecionado para a página de login em alguns segundos...
            </p>
          </div>
        )}

        {/* Demo Credentials (não exibe no signup) */}
        {mode !== 'signup' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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

                <div>
                  <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da loja
                  </label>
                  <div className="relative">
                    <Store className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="storeName"
                      name="storeName"
                      type="text"
                      required
                      value={formData.storeName}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da sua loja"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="storeSlug" className="block text-sm font-medium text-gray-700 mb-2">
                    URL da loja
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      mooda.com/
                    </span>
                    <input
                      id="storeSlug"
                      name="storeSlug"
                      type="text"
                      required
                      value={formData.storeSlug}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="minha-loja"
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
                  💡 Dica: Lojas criadas pelo admin podem fazer login com as credenciais definidas na criação
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