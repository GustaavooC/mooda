import React, { useState } from 'react';
import { 
  Palette, 
  Check, 
  Star, 
  Eye, 
  Wand2,
  RefreshCw,
  Crown,
  Grid,
  Type,
  Layout,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useThemes, Theme } from '../hooks/useThemes';
import { useTenant } from '../contexts/TenantContext';
import TenantLayout from './TenantLayout';

const ThemeSelector: React.FC = () => {
  const { currentTenant } = useTenant();
  const { themes, currentTheme, loading, applyTheme } = useThemes();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [applyingTheme, setApplyingTheme] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categories = [
    { id: 'all', name: 'Todos os Temas', icon: Grid },
    { id: 'modern', name: 'Moderno', icon: Layout },
    { id: 'classic', name: 'Clássico', icon: Type },
    { id: 'minimal', name: 'Minimalista', icon: Eye },
    { id: 'elegant', name: 'Elegante', icon: Crown },
    { id: 'bold', name: 'Vibrante', icon: Star }
  ];

  const filteredThemes = selectedCategory === 'all' 
    ? themes 
    : themes.filter(theme => theme.category === selectedCategory);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleApplyTheme = async (themeId: string) => {
    try {
      setApplyingTheme(themeId);
      await applyTheme(themeId);
      showMessage('success', 'Tema aplicado com sucesso!');
    } catch (error) {
      showMessage('error', 'Erro ao aplicar tema. Tente novamente.');
    } finally {
      setApplyingTheme(null);
    }
  };

  const ThemeCard: React.FC<{ theme: Theme }> = ({ theme }) => {
    const isCurrentTheme = currentTheme?.theme_id === theme.id;
    const isApplying = applyingTheme === theme.id;

    return (
      <div className={`relative bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
        isCurrentTheme ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}>
        {/* Premium Badge */}
        {theme.isPremium && (
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-medium rounded-full">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          </div>
        )}

        {/* Current Theme Badge */}
        {isCurrentTheme && (
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
              <Check className="w-3 h-3" />
              Atual
            </div>
          </div>
        )}

        {/* Preview Image */}
        <div className="relative">
          <img
            src={theme.preview_image}
            alt={theme.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-t-lg" />
          
          {/* Color Palette Preview */}
          <div className="absolute bottom-3 left-3 flex gap-1">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: theme.colors.primary }}
              title="Cor Primária"
            />
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: theme.colors.secondary }}
              title="Cor Secundária"
            />
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: theme.colors.accent }}
              title="Cor de Destaque"
            />
          </div>
        </div>

        {/* Theme Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {theme.name}
                {theme.isPremium && <Star className="w-4 h-4 text-yellow-500" />}
              </h3>
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full mt-1 capitalize">
                {theme.category}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {theme.description}
          </p>

          {/* Features */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Características:</h4>
            <div className="flex flex-wrap gap-1">
              {theme.features.slice(0, 3).map((feature, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                  {feature}
                </span>
              ))}
              {theme.features.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded">
                  +{theme.features.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Typography & Layout Info */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Fonte:</span> {theme.typography.headingFont}
            </div>
            <div>
              <span className="font-medium">Grid:</span> {theme.layout.productGrid.replace('grid-', '')} colunas
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => handleApplyTheme(theme.id)}
              disabled={isCurrentTheme || isApplying}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                isCurrentTheme
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : isApplying
                  ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Aplicando...
                </>
              ) : isCurrentTheme ? (
                <>
                  <Check className="w-4 h-4" />
                  Tema Atual
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Aplicar Tema
                </>
              )}
            </button>

            <a
              href={`/loja/${currentTenant?.slug}?preview=${theme.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Visualizar tema"
            >
              <Eye className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <TenantLayout title="Seleção de Temas" showBackButton={true}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando temas...</p>
          </div>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout title="Seleção de Temas" showBackButton={true}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Galeria de Temas</h1>
              <p className="text-gray-600">Escolha o visual perfeito para sua loja</p>
            </div>
          </div>

          {/* Current Theme Info */}
          {currentTheme?.theme && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-300">
                  <img
                    src={currentTheme.theme.preview_image}
                    alt={currentTheme.theme.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Tema Atual: {currentTheme.theme.name}
                  </h3>
                  <p className="text-blue-700 text-sm">{currentTheme.theme.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href={`/loja/${currentTenant?.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Loja
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-3 p-4 rounded-lg mb-6 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded-lg ${previewMode === 'desktop' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Monitor className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded-lg ${previewMode === 'mobile' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Smartphone className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                  <span className="text-xs opacity-75">
                    ({category.id === 'all' ? themes.length : themes.filter(t => t.category === category.id).length})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThemes.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </div>

        {/* Empty State */}
        {filteredThemes.length === 0 && (
          <div className="text-center py-12">
            <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum tema encontrado
            </h3>
            <p className="text-gray-600">
              Tente selecionar uma categoria diferente
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💡 Dicas para Escolher o Tema Ideal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎨 Por Tipo de Produto:</h4>
              <ul className="space-y-1">
                <li>• <strong>Tecnologia:</strong> Moderno Azul ou Modo Escuro</li>
                <li>• <strong>Moda:</strong> Elegante Roxo ou Minimalista</li>
                <li>• <strong>Produtos Naturais:</strong> Clássico Verde</li>
                <li>• <strong>Esportes:</strong> Vibrante Laranja</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">⚡ Recursos Disponíveis:</h4>
              <ul className="space-y-1">
                <li>• Troca de tema a qualquer momento</li>
                <li>• Preview antes de aplicar</li>
                <li>• Temas responsivos</li>
                <li>• Cores e tipografia otimizadas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </TenantLayout>
  );
};

export default ThemeSelector;