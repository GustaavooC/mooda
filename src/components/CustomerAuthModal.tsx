import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  onSignUp: (data: { name: string; email: string; phone?: string; password: string }) => Promise<{ data: any; error: any }>;
  storeName: string;
}

const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  onSignUp,
  storeName
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error when user types
  };

  const validateForm = () => {
    if (mode === 'signup') {
      if (!formData.name.trim()) {
        setError('Nome é obrigatório');
        return false;
      }
      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem');
        return false;
      }
    }
    
    if (!formData.email.trim()) {
      setError('E-mail é obrigatório');
      return false;
    }
    
    if (!formData.password.trim()) {
      setError('Senha é obrigatória');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (mode === 'signup') {
        result = await onSignUp({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        });
      } else {
        result = await onSignIn(formData.email, formData.password);
      }

      if (result.error) {
        throw result.error;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        resetForm();
      }, 1500);

    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
    setError(null);
    setSuccess(false);
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {mode === 'signin' ? 'Entrar' : 'Criar Conta'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {mode === 'signin' ? 'Login realizado!' : 'Conta criada!'}
              </h3>
              <p className="text-gray-600">
                Agora você pode ver os preços e fazer compras na {storeName}
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-gray-600">
                  {mode === 'signin' 
                    ? `Entre na sua conta para ver os preços da ${storeName}`
                    : `Crie sua conta na ${storeName} para ver preços exclusivos`
                  }
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome completo *
                      </label>
                      <div className="relative">
                        <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="pl-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Seu nome completo"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <div className="relative">
                        <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="pl-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail *
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha *
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Sua senha"
                      minLength={6}
                    />
                  </div>
                  {mode === 'signup' && (
                    <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                  )}
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar senha *
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirme sua senha"
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  )}
                  {loading ? 'Processando...' : (mode === 'signin' ? 'Entrar' : 'Criar Conta')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {mode === 'signin' ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
                  <button
                    onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    {mode === 'signin' ? 'Criar conta grátis' : 'Fazer login'}
                  </button>
                </p>
              </div>

              {mode === 'signup' && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-700 text-center">
                    ✅ Conta gratuita • ✅ Sem compromisso • ✅ Preços exclusivos
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerAuthModal;