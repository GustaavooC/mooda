import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, Heart, Star } from 'lucide-react';
import PriceDisplay from './PriceDisplay';

interface Product {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  category?: {
    name: string;
  };
  variations: ProductVariation[];
}

interface ProductVariation {
  id: string;
  price: number;
  promotional_price?: number;
  stock_quantity: number;
  color: {
    id: string;
    name: string;
    hex_code: string;
  };
  size: {
    id: string;
    name: string;
  };
}

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, variation: ProductVariation, quantity: number) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart
}) => {
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addToCartLoading, setAddToCartLoading] = useState(false);

  // Reset selections when product changes
  useEffect(() => {
    if (product && isOpen) {
      setSelectedColorId('');
      setSelectedSizeId('');
      setQuantity(1);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const getAvailableColors = () => {
    if (!product.variations) return [];
    
    const availableVariations = product.variations.filter(v => v.stock_quantity > 0);
    const colorIds = [...new Set(availableVariations.map(v => v.color.id))];
    
    return colorIds.map(colorId => {
      const variation = availableVariations.find(v => v.color.id === colorId);
      return variation?.color;
    }).filter(Boolean);
  };

  const getAvailableSizesForColor = () => {
    if (!selectedColorId) return [];
    
    return product.variations?.filter(v => 
      v.color.id === selectedColorId && v.stock_quantity > 0
    ) || [];
  };

  const getSelectedVariation = () => {
    if (!selectedColorId || !selectedSizeId) return null;
    
    return product.variations?.find(v => 
      v.color.id === selectedColorId && v.size.id === selectedSizeId
    ) || null;
  };

  const handleColorSelect = (colorId: string) => {
    setSelectedColorId(colorId);
    setSelectedSizeId('');
    setQuantity(1);
  };

  const handleAddToCart = async () => {
    const variation = getSelectedVariation();
    if (!variation) return;

    setAddToCartLoading(true);
    
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onAddToCart(product, variation, quantity);
    setAddToCartLoading(false);
    onClose();
  };

  const availableColors = getAvailableColors();
  const availableSizes = getAvailableSizesForColor();
  const selectedVariation = getSelectedVariation();
  const maxQuantity = selectedVariation?.stock_quantity || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="w-24 h-24 mx-auto mb-4 opacity-50">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
                <p className="text-lg">Imagem do produto</p>
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                {product.brand && (
                  <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                )}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                {product.description && (
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                )}
              </div>

              {/* Price */}
              <div className="border-t border-b py-4">
                {selectedVariation ? (
                  <PriceDisplay
                    price={selectedVariation.price}
                    promotionalPrice={selectedVariation.promotional_price}
                    isAuthenticated={true}
                    onAuthRequired={() => {}}
                    size="lg"
                  />
                ) : (
                  <div className="text-gray-500">
                    Selecione cor e tamanho para ver o preço
                  </div>
                )}
              </div>

              {/* Color Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Cor {selectedColorId && `(${availableColors.find(c => c?.id === selectedColorId)?.name})`}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((color) => (
                    <button
                      key={color?.id}
                      onClick={() => handleColorSelect(color?.id || '')}
                      className={`w-12 h-12 rounded-full border-2 transition-all ${
                        selectedColorId === color?.id
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color?.hex_code }}
                      title={color?.name}
                    />
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              {selectedColorId && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Tamanho {selectedSizeId && `(${availableSizes.find(s => s.size.id === selectedSizeId)?.size.name})`}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((variation) => (
                      <button
                        key={variation.id}
                        onClick={() => setSelectedSizeId(variation.size.id)}
                        className={`px-4 py-2 border rounded-lg font-medium transition-all ${
                          selectedSizeId === variation.size.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {variation.size.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity and Stock */}
              {selectedVariation && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Quantidade</h3>
                    <span className="text-sm text-gray-600">
                      {selectedVariation.stock_quantity} em estoque
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xl font-semibold px-4">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <div className="pt-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariation || addToCartLoading || maxQuantity === 0}
                  className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addToCartLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      {!selectedVariation 
                        ? 'Selecione cor e tamanho' 
                        : maxQuantity === 0 
                        ? 'Fora de estoque'
                        : `Adicionar ao carrinho - R$ ${((selectedVariation.promotional_price || selectedVariation.price) * quantity).toFixed(2)}`
                      }
                    </>
                  )}
                </button>
              </div>

              {/* Additional Info */}
              <div className="text-sm text-gray-600 space-y-2">
                {product.category && (
                  <p>
                    <span className="font-medium">Categoria:</span> {product.category.name}
                  </p>
                )}
                <p>
                  <span className="font-medium">Variações disponíveis:</span> {product.variations?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;