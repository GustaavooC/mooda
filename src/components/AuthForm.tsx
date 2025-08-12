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
        const { data, error } = await signUp(formData.email, formData.password, {
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

        // Se chegou aqui, signup foi bem sucedido
        setSuccess(true);
        setTimeout(() => {
          navigate('/auth/signin');
        }, 5000);

      } else {
        const { data, error } = await signIn(formData.email, formData.password);
        
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

        // Login bem sucedido
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(mode === 'admin' ? '/admin' : '/dashboard');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  // ... resto do seu código de getDemoCredentials e getTitle/Subtitle permanece igual ...

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Cabeçalho permanece igual */}
        
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

        {/* Credenciais Demo (apenas para não-signup) */}
        {mode !== 'signup' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              🎯 Credenciais Demo:
            </h3>
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
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* ... resto do seu formulário permanece igual ... */}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : success ? 'Sucesso!' : (mode === 'signup' ? 'Criar Loja' : 'Entrar')}
          </button>

          {/* Links de alternância entre signin/signup */}
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

        {/* Aviso sobre credenciais reais */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            <strong>⚠️ Importante:</strong> Se você é um usuário real (não demo), 
            use as credenciais fornecidas durante a criação da sua loja ou pelo administrador.
          </p>
        </div>

        {/* Lista de Credenciais Demo */}
        {mode !== 'signup' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            {/* ... sua lista de credenciais demo permanece igual ... */}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthForm;