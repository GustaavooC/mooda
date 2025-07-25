import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Save, Package, Upload, AlertCircle } from 'lucide-react';
import { useProducts, Product, ProductVariation, Color, Size, Category } from '../hooks/useProducts';
import { useTenant } from '../contexts/TenantContext';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  onSave: () => void;
}

interface NewVariation {
  color_id: string;
  size_id: string;
  price: number;
  promotional_price?: number;
  stock_quantity: number;
  sku?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, product, onSave }) => {
  const { currentTenant } = useTenant();
  const { colors, sizes, categories, createProduct, createProductVariation, updateProduct } = useProducts();
  const [currentTab, setCurrentTab] = useState<'basic' | 'variations' | 'summary'>('basic');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productImages, setProductImages] = useState<Array<{
    file: File;
    preview: string;
    isPrimary: boolean;
  }>>([]);
  
  // Basic product info
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    brand: '',
    sku: '',
    is_active: true
  });

  // Variations
  const [variations, setVariations] = useState<NewVariation[]>([]);
  const [newVariation, setNewVariation] = useState<NewVariation>({
    color_id: '',
    size_id: '',
    price: 0,
    stock_quantity: 0
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        category_id: product.category_id || '',
        brand: product.brand || '',
        sku: product.sku || '',
        is_active: product.is_active
      });
      // Convert existing variations to new format if editing
      if (product.variations) {
        setVariations(product.variations.map(v => ({
          color_id: v.color_id,
          size_id: v.size_id,
          price: v.price,
          promotional_price: v.promotional_price || undefined,
          stock_quantity: v.stock_quantity,
          sku: v.sku || undefined
        })));
      }
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        description: '',
        category_id: '',
        brand: '',
        sku: '',
        is_active: true
      });
      setVariations([]);
    }
    setErrors({});
    setCurrentTab('basic');
  }, [product, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do produto é obrigatório';
    }

    if (!formData.brand?.trim()) {
      newErrors.brand = 'Marca é obrigatória';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Categoria é obrigatória';
    }

    if (variations.length === 0) {
      newErrors.variations = 'Adicione pelo menos uma variação do produto';
    }

    // Validate variations
    variations.forEach((variation, index) => {
      if (!variation.color_id) {
        newErrors[`variation_${index}_color`] = 'Cor é obrigatória';
      }
      if (!variation.size_id) {
        newErrors[`variation_${index}_size`] = 'Tamanho é obrigatório';
      }
      if (variation.price <= 0) {
        newErrors[`variation_${index}_price`] = 'Preço deve ser maior que zero';
      }
      if (variation.stock_quantity < 0) {
        newErrors[`variation_${index}_stock`] = 'Estoque não pode ser negativo';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleVariationChange = (field: keyof NewVariation, value: string | number) => {
    setNewVariation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateSKU = (productName: string, colorName: string, sizeName: string) => {
    const productCode = productName.substring(0, 3).toUpperCase();
    const colorCode = colorName.substring(0, 2).toUpperCase();
    const sizeCode = sizeName.toUpperCase();
    return `${productCode}-${colorCode}-${sizeCode}`;
  };

  const addVariation = () => {
    if (!newVariation.color_id || !newVariation.size_id || !newVariation.price) {
      alert('Por favor, preencha todos os campos obrigatórios da variação');
      return;
    }

    // Check for duplicate variation
    const duplicate = variations.find(v => 
      v.color_id === newVariation.color_id && v.size_id === newVariation.size_id
    );
    
    if (duplicate) {
      alert('Esta combinação de cor e tamanho já existe');
      return;
    }

    // Generate SKU automatically
    const color = colors.find(c => c.id === newVariation.color_id);
    const size = sizes.find(s => s.id === newVariation.size_id);
    const autoSKU = generateSKU(formData.name || 'PROD', color?.name || 'COR', size?.name || 'TAM');

    setVariations(prev => [...prev, { 
      ...newVariation, 
      sku: newVariation.sku || autoSKU 
    }]);
    
    setNewVariation({
      color_id: '',
      size_id: '',
      price: 0,
      stock_quantity: 0
    });
  };

  const removeVariation = (index: number) => {
    setVariations(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariation = (index: number, field: keyof NewVariation, value: any) => {
    setVariations(prev => prev.map((variation, i) => 
      i === index ? { ...variation, [field]: value } : variation
    ));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(`Arquivo ${file.name} é muito grande. Máximo 5MB.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setProductImages(prev => [...prev, {
          file,
          preview: event.target?.result as string,
          isPrimary: prev.length === 0 // First image is primary by default
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setProductImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // If we removed the primary image, make the first one primary
      if (prev[index].isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  };

  const setPrimaryImage = (index: number) => {
    setProductImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Por favor, corrija os erros antes de continuar');
      return;
    }

    try {
      setLoading(true);
      
      if (product) {
        // Update existing product
        await updateProduct(product.id, formData);
        alert('Produto atualizado com sucesso!');
      } else {
        // Create new product
        const newProduct = await createProduct(formData);
        
        // Create all variations
        for (const variation of variations) {
          await createProductVariation({
            ...variation,
            product_id: newProduct.id,
            is_active: true
          });
        }
        
        // Note: In a real implementation, you would upload images to storage
        // For now, we'll just show a message about the images
        if (productImages.length > 0) {
          console.log(`${productImages.length} imagens selecionadas para o produto ${newProduct.id}`);
          console.log(`${productImages.length} imagens foram selecionadas para upload futuro.`);
        }
        
        alert('Produto criado com sucesso!');
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao salvar produto: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getColorName = (colorId: string) => {
    const color = colors.find(c => c.id === colorId);
    return color?.name || '';
  };

  const getSizeName = (sizeId: string) => {
    const size = sizes.find(s => s.id === sizeId);
    return size?.name || '';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '';
  };

  const getTotalStock = () => {
    return variations.reduce((sum, v) => sum + v.stock_quantity, 0);
  };

  const getAveragePrice = () => {
    if (variations.length === 0) return 0;
    const total = variations.reduce((sum, v) => sum + v.price, 0);
    return total / variations.length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { key: 'basic', label: 'Informações Básicas' },
            { key: 'variations', label: 'Variações' },
            { key: 'summary', label: 'Resumo' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setCurrentTab(tab.key as any)}
              className={`px-6 py-3 font-medium transition-colors ${
                currentTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
              {tab.key === 'basic' && Object.keys(errors).some(key => !key.includes('variation')) && (
                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block"></span>
              )}
              {tab.key === 'variations' && Object.keys(errors).some(key => key.includes('variation')) && (
                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block"></span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Basic Information Tab */}
          {currentTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Digite o nome do produto"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca *
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.brand ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Digite a marca"
                  />
                  {errors.brand && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.brand}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.category_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.category_id}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU (Código do Produto)
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Código único do produto"
                  />
                </div>
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagens do Produto
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Clique para adicionar imagens ou arraste e solte
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      Selecionar Imagens
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG, GIF até 5MB cada
                    </p>
                  </div>
                  
                  {/* Preview das imagens */}
                  {productImages.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Imagens selecionadas ({productImages.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {productImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                            <div className="mt-1">
                              <label className="flex items-center text-xs">
                                <input
                                  type="checkbox"
                                  checked={image.isPrimary}
                                  onChange={() => setPrimaryImage(index)}
                                  className="mr-1"
                                />
                                Principal
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva o produto detalhadamente..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Produto ativo (visível na loja)
                </label>
              </div>
            </div>
          )}

          {/* Variations Tab */}
          {currentTab === 'variations' && (
            <div className="space-y-6">
              {errors.variations && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700">{errors.variations}</span>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Nova Variação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor *</label>
                    <select
                      value={newVariation.color_id}
                      onChange={(e) => handleVariationChange('color_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma cor</option>
                      {colors.map(color => (
                        <option key={color.id} value={color.id}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tamanho *</label>
                    <select
                      value={newVariation.size_id}
                      onChange={(e) => handleVariationChange('size_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione um tamanho</option>
                      {sizes.map(size => (
                        <option key={size.id} value={size.id}>
                          {size.name} ({size.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preço (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newVariation.price}
                      onChange={(e) => handleVariationChange('price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estoque *</label>
                    <input
                      type="number"
                      min="0"
                      value={newVariation.stock_quantity}
                      onChange={(e) => handleVariationChange('stock_quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={addVariation}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* Variations List */}
              {variations.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Variações Cadastradas ({variations.length})
                  </h3>
                  <div className="space-y-3">
                    {variations.map((variation, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: colors.find(c => c.id === variation.color_id)?.hex_code }}
                          />
                          <div>
                            <span className="font-medium">
                              {getColorName(variation.color_id)} - {getSizeName(variation.size_id)}
                            </span>
                            <div className="text-sm text-gray-500">
                              SKU: {variation.sku || 'Auto-gerado'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              R$ {variation.price.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Estoque: {variation.stock_quantity}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={variation.price}
                              onChange={(e) => updateVariation(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="Preço"
                            />
                            <input
                              type="number"
                              min="0"
                              value={variation.stock_quantity}
                              onChange={(e) => updateVariation(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="Estoque"
                            />
                            <button
                              onClick={() => removeVariation(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary Tab */}
          {currentTab === 'summary' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Resumo do Produto</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Nome:</span> {formData.name || 'Não informado'}</p>
                      <p><span className="font-medium">Marca:</span> {formData.brand || 'Não informado'}</p>
                      <p><span className="font-medium">Categoria:</span> {getCategoryName(formData.category_id) || 'Não informado'}</p>
                      <p><span className="font-medium">SKU:</span> {formData.sku || 'Não informado'}</p>
                      <p><span className="font-medium">Status:</span> {formData.is_active ? 'Ativo' : 'Inativo'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Estatísticas</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Total de variações:</span> {variations.length}</p>
                      <p><span className="font-medium">Estoque total:</span> {getTotalStock()}</p>
                      <p><span className="font-medium">Preço médio:</span> R$ {getAveragePrice().toFixed(2)}</p>
                      <p><span className="font-medium">Preço mínimo:</span> R$ {variations.length > 0 ? Math.min(...variations.map(v => v.price)).toFixed(2) : '0,00'}</p>
                      <p><span className="font-medium">Preço máximo:</span> R$ {variations.length > 0 ? Math.max(...variations.map(v => v.price)).toFixed(2) : '0,00'}</p>
                    </div>
                  </div>
                </div>

                {formData.description && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-700 mb-2">Descrição</h4>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded border">{formData.description}</p>
                  </div>
                )}

                {variations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-700 mb-3">Variações</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {variations.map((variation, index) => (
                        <div key={index} className="bg-white p-3 rounded border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: colors.find(c => c.id === variation.color_id)?.hex_code }}
                            />
                            <span className="text-sm">
                              {getColorName(variation.color_id)} - {getSizeName(variation.size_id)}
                            </span>
                          </div>
                          <div className="text-sm text-right">
                            <div className="font-medium">R$ {variation.price.toFixed(2)}</div>
                            <div className="text-gray-500">{variation.stock_quantity} un.</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <div className="flex gap-3">
            {currentTab !== 'summary' && (
              <button
                onClick={() => {
                  const tabs = ['basic', 'variations', 'summary'];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex < tabs.length - 1) {
                    setCurrentTab(tabs[currentIndex + 1] as any);
                  }
                }}
                className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Próximo
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : (product ? 'Atualizar Produto' : 'Criar Produto')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;