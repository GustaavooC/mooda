import React, { useState } from 'react';
import { 
  Palette, 
  Upload, 
  Image as ImageIcon, 
  Eye, 
  Save, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Monitor,
  Smartphone,
  Wand2,
  Type,
  History,
  Download,
  Star,
  Clock
} from 'lucide-react';
import { useCustomization, CustomizationTemplate, FontOption } from '../hooks/useCustomization';
import { useTenant } from '../contexts/TenantContext';
import TenantLayout from './TenantLayout';

const StoreCustomization: React.FC = () => {
  const { currentTenant } = useTenant();
  const { 
    customization, 
    templates, 
    fonts, 
    history, 
    loading, 
    updateCustomization, 
    applyTemplate, 
    uploadImage 
  } = useCustomization();
  const [activeTab, setActiveTab] = useState<'colors' | 'images' | 'templates' | 'fonts' | 'history' | 'preview'>('colors');
  const [saving, setSaving] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const [formData, setFormData] = useState({
    primary_color: customization?.primary_color || '#3B82F6',
    background_color: customization?.background_color || '#FFFFFF',
    text_color: customization?.text_color || '#1F2937',
    accent_color: customization?.accent_color || '#EFF6FF',
    font_family: customization?.font_family || 'Inter',
    font_size_base: customization?.font_size_base || 16,
    layout_style: customization?.layout_style || 'modern',
    logo_url: customization?.logo_url || '',
    banner_main_url: customization?.banner_main_url || '',
    banner_profile_url: customization?.banner_profile_url || ''
  });

  React.useEffect(() => {
    if (customization) {
      setFormData({
        primary_color: customization.primary_color,
        background_color: customization.background_color,
        text_color: customization.text_color,
        accent_color: customization.accent_color,
        font_family: customization.font_family,
        font_size_base: customization.font_size_base,
        layout_style: customization.layout_style,
        logo_url: customization.logo_url || '',
        banner_main_url: customization.banner_main_url || '',
        banner_profile_url: customization.banner_profile_url || ''
      });
    }
  }, [customization]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleColorChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFontChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyTemplate = async (template: CustomizationTemplate) => {
    try {
      setApplyingTemplate(template.id);
      await applyTemplate(template.id);
      
      // Update form data with template config
      setFormData(prev => ({
        ...prev,
        ...template.config
      }));
      
      showMessage('success', `Template "${template.name}" aplicado com sucesso!`);
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Erro ao aplicar template');
    } finally {
      setApplyingTemplate(null);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'banner_main' | 'banner_profile') => {
    try {
      setUploadingType(type);
      const url = await uploadImage(file, type);
      setFormData(prev => ({ ...prev, [`${type}_url`]: url }));
      showMessage('success', 'Imagem enviada com sucesso!');
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Erro ao enviar imagem');
    } finally {
      setUploadingType(null);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateCustomization(formData);
      showMessage('success', 'Personalização salva com sucesso!');
    } catch (error) {
      showMessage('error', 'Erro ao salvar personalização');
    } finally {
      setSaving(false);
    }
  };

  const exportCustomization = () => {
    const config = {
      ...formData,
      tenant_name: currentTenant?.name,
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTenant?.slug || 'store'}-customization.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('success', 'Configuração exportada com sucesso!');
  };

  const ImageUploadSection = ({ 
    type, 
    title, 
    description, 
    dimensions, 
    currentUrl 
  }: {
    type: 'logo' | 'banner_main' | 'banner_profile';
    title: string;
    description: string;
    dimensions: string;
    currentUrl: string;
  }) => (
    <div className="border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <p className="text-xs text-gray-500 mb-4">Dimensões recomendadas: {dimensions}</p>
      
      {currentUrl && (
        <div className="mb-4">
          <img 
            src={currentUrl} 
            alt={title}
            className="max-w-full h-32 object-cover rounded-lg border"
          />
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
          {uploadingType === type ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploadingType === type ? 'Enviando...' : 'Selecionar Arquivo'}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, type);
            }}
            className="hidden"
            disabled={uploadingType === type}
          />
        </label>
        <span className="text-xs text-gray-500">JPG, PNG, WebP (máx. 2MB)</span>
      </div>
    </div>
  );

  const ColorPicker = ({ 
    label, 
    value, 
    onChange, 
    description 
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    description: string;
  }) => (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-900">{label}</label>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg border-2 border-gray-300"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  const TemplatesSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Templates Pré-definidos</h2>
          <p className="text-gray-600 mt-1">Aplique um template profissional com um clique</p>
        </div>
        <button
          onClick={exportCustomization}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar Config
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  {template.name}
                  {template.is_premium && <Star className="w-4 h-4 text-yellow-500" />}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded mt-2">
                  {template.category}
                </span>
              </div>
            </div>

            {/* Preview das cores do template */}
            <div className="flex gap-2 mb-4">
              {template.config.primary_color && (
                <div 
                  className="w-8 h-8 rounded border-2 border-gray-300"
                  style={{ backgroundColor: template.config.primary_color }}
                  title="Cor Primária"
                />
              )}
              {template.config.background_color && (
                <div 
                  className="w-8 h-8 rounded border-2 border-gray-300"
                  style={{ backgroundColor: template.config.background_color }}
                  title="Cor de Fundo"
                />
              )}
              {template.config.accent_color && (
                <div 
                  className="w-8 h-8 rounded border-2 border-gray-300"
                  style={{ backgroundColor: template.config.accent_color }}
                  title="Cor de Destaque"
                />
              )}
            </div>

            <button
              onClick={() => handleApplyTemplate(template)}
              disabled={applyingTemplate === template.id}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {applyingTemplate === template.id ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {applyingTemplate === template.id ? 'Aplicando...' : 'Aplicar Template'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const FontsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tipografia</h2>
        <p className="text-gray-600 mb-6">Personalize as fontes e tamanhos do texto</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Família da Fonte</label>
            <select
              value={formData.font_family}
              onChange={(e) => handleFontChange('font_family', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {fonts.map((font) => (
                <option key={font.id} value={font.family}>
                  {font.name} {font.is_premium && '⭐'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tamanho Base (px)</label>
            <input
              type="range"
              min="12"
              max="20"
              value={formData.font_size_base}
              onChange={(e) => handleFontChange('font_size_base', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>12px</span>
              <span className="font-medium">{formData.font_size_base}px</span>
              <span>20px</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estilo de Layout</label>
            <select
              value={formData.layout_style}
              onChange={(e) => handleFontChange('layout_style', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="modern">Moderno</option>
              <option value="elegant">Elegante</option>
              <option value="minimal">Minimalista</option>
              <option value="playful">Divertido</option>
              <option value="tech">Tecnológico</option>
            </select>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preview da Fonte</h3>
          <div 
            className="space-y-3"
            style={{ 
              fontFamily: formData.font_family,
              fontSize: `${formData.font_size_base}px`
            }}
          >
            <h1 className="text-2xl font-bold">Título Principal</h1>
            <h2 className="text-xl font-semibold">Subtítulo</h2>
            <p className="text-base">
              Este é um parágrafo de exemplo para mostrar como ficará o texto normal da sua loja.
            </p>
            <p className="text-sm text-gray-600">
              Texto menor para descrições e detalhes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const HistorySection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Histórico de Alterações</h2>
        <p className="text-gray-600 mb-6">Acompanhe todas as modificações feitas na personalização</p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma alteração registrada ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {item.action_type === 'template_apply' ? (
                      <Wand2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Palette className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.action_type === 'template_apply' ? 'Template Aplicado' : 'Personalização Atualizada'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {Object.keys(item.changes).length} alteração(ões) feita(s)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
              
              {Object.keys(item.changes).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Alterações:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(item.changes).map((key) => (
                      <span key={key} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {key.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PreviewSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Preview da Loja</h3>
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

      <div className={`border border-gray-300 rounded-lg overflow-hidden ${
        previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
      }`}>
        <div 
          className="min-h-96"
          style={{ 
            backgroundColor: formData.background_color,
            color: formData.text_color,
            fontFamily: formData.font_family,
            fontSize: `${formData.font_size_base}px`
          }}
        >
          {/* Header */}
          <div 
            className="p-4 border-b"
            style={{ backgroundColor: formData.primary_color }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {formData.logo_url ? (
                  <img 
                    src={formData.logo_url} 
                    alt="Logo" 
                    className="h-8 w-auto"
                  />
                ) : (
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {currentTenant?.name?.charAt(0) || 'L'}
                    </span>
                  </div>
                )}
                <span className="text-white font-semibold">
                  {currentTenant?.name || 'Sua Loja'}
                </span>
              </div>
              <div className="text-white text-sm">
                🛒 Carrinho
              </div>
            </div>
          </div>

          {/* Banner Principal */}
          {formData.banner_main_url && (
            <div className="relative">
              <img 
                src={formData.banner_main_url} 
                alt="Banner Principal"
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-xl font-bold mb-2">Bem-vindo à {currentTenant?.name}</h2>
                  <p className="text-sm opacity-90">Descubra nossos produtos incríveis</p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3">
                  <div className="w-full h-20 bg-gray-200 rounded mb-2"></div>
                  <h3 className="font-medium text-sm mb-1">Produto {i}</h3>
                  <p className="text-xs text-gray-600 mb-2">Descrição do produto</p>
                  <button 
                    className="w-full py-1 px-2 text-xs text-white rounded"
                    style={{ backgroundColor: formData.primary_color }}
                  >
                    Ver Produto
                  </button>
                </div>
              ))}
            </div>

            {/* Banner de Perfil */}
            {formData.banner_profile_url && (
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium mb-2">Sobre Nossa Loja</h3>
                <img 
                  src={formData.banner_profile_url} 
                  alt="Banner de Perfil"
                  className="w-full h-24 object-cover rounded mb-2"
                />
                <p className="text-sm text-gray-600">
                  Conheça mais sobre nossa história e valores.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center">
        <a
          href={`/loja/${currentTenant?.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Ver Loja Completa
        </a>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (

    <TenantLayout title="Personalização da Loja" showBackButton={true}>
      <div className="p-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">Customize a aparência da sua loja</p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          {[
            { key: 'colors', label: 'Cores', icon: Palette },
            { key: 'images', label: 'Imagens', icon: ImageIcon },
            { key: 'preview', label: 'Preview', icon: Eye }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {activeTab === 'templates' && <TemplatesSection />}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personalização de Cores</h2>
                <p className="text-gray-600 mb-6">
                  Defina as cores que representam sua marca e serão aplicadas em toda a loja.
                </p>
              </div>

              <div className="space-y-4">
                <ColorPicker
                  label="Cor Primária"
                  description="Usada em botões, links e destaques"
                  value={formData.primary_color}
                  onChange={(value) => handleColorChange('primary_color', value)}
                />
                
                <ColorPicker
                  label="Cor de Fundo"
                  description="Cor de fundo principal da loja"
                  value={formData.background_color}
                  onChange={(value) => handleColorChange('background_color', value)}
                />
                
                <ColorPicker
                  label="Cor do Texto"
                  description="Cor principal do texto"
                  value={formData.text_color}
                  onChange={(value) => handleColorChange('text_color', value)}
                />
                
                <ColorPicker
                  label="Cor de Destaque"
                  description="Usada em seções e cards"
                  value={formData.accent_color}
                  onChange={(value) => handleColorChange('accent_color', value)}
                />
              </div>
            </div>
          )}

          {activeTab === 'fonts' && <FontsSection />}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Gerenciamento de Imagens</h2>
                <p className="text-gray-600 mb-6">
                  Envie a logo e banners da sua loja para criar uma identidade visual única.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ImageUploadSection
                  type="logo"
                  title="Logo da Loja"
                  description="Logo exibida no cabeçalho da loja"
                  dimensions="200x80px"
                  currentUrl={formData.logo_url}
                />
                
                <ImageUploadSection
                  type="banner_main"
                  title="Banner Principal"
                  description="Banner exibido no topo da página inicial"
                  dimensions="1200x400px"
                  currentUrl={formData.banner_main_url}
                />
              </div>

              <ImageUploadSection
                type="banner_profile"
                title="Banner de Perfil"
                description="Banner usado em seções como 'Sobre a loja'"
                dimensions="800x300px"
                currentUrl={formData.banner_profile_url}
              />
            </div>
          )}

          {activeTab === 'history' && <HistorySection />}
          {activeTab === 'preview' && <PreviewSection />}
        </div>
      </div>
    </TenantLayout>
  );
};

export default StoreCustomization;