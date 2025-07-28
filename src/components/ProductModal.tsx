import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingCart, Heart, Star } from 'lucide-react';
import { Product, ProductVariation } from '../hooks/useProducts';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, variation: ProductVariation, quantity: number) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product.variations) return null;

  const availableVariations = product.variations.filter(v => v.stock_quantity > 0);
  
  // Get unique colors from available variations
  const availableColors = availableVariations.reduce((colors, variation) => {
    if (!colors.find(c => c.id === variation.color_id) && variation.color) {
      colors.push(variation.color);
    }
    return colors;
  }, [] as Array<{ id: string; name: string; hex_code: string }>);

  // Get available sizes for selected color
  const availableSizesForColor = selectedColorId 
    ? availableVariations.filter(v => v.color_id === selectedColorId)
    : [];

  const selectedVariation = availableVariations.find(
    v => v.color_id === selectedColorId && v.size_id === selectedSizeId
  );

  const maxQuantity = selectedVariation ? selectedVariation.stock_quantity : 0;

  const handleColorSelect = (colorId: string) => {
    setSelectedColorId(colorId);
    setSelectedSizeId(''); // Reset size when color changes
    setQuantity(1);
  };

  const handleSizeSelect = (sizeId: string) => {
    setSelectedSizeId(sizeId);
    setQuantity(1);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (selectedVariation) {
      onAddToCart(product, selectedVariation, quantity);
      onClose();
    }
  };

  const getPrice = () => {
    if (!selectedVariation) return 'Selecione uma variação';
    return selectedVariation.promotional_price 
      ? `R$ ${selectedVariation.promotional_price.toFixed(2)}`
      : `R$ ${selectedVariation.price.toFixed(2)}`;
  };

  const getOriginalPrice = () => {
    if (!selectedVariation || !selectedVariation.promotional_price) return null;
    return `R$ ${selectedVariation.price.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex">
          {/* Product Image */}
          <div className="flex-1 bg-gray-100 aspect-square relative">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="w-24 h-24 mx-auto mb-4 opacity-50">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
                <p className="text-lg">Imagem do produto</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Product Details */}
          <div className="flex-1 p-8 overflow-y-auto max-h-[90vh]">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
              {product.brand && (
                <p className="text-lg text-gray-600 mb-4">{product.brand}</p>
              )}
              
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <span className="text-gray-600 ml-2">(0 avaliações)</span>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-gray-900">{getPrice()}</span>
                  {getOriginalPrice() && (
                    <span className="text-xl text-gray-500 line-through">{getOriginalPrice()}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Color Selection */}
            {availableColors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Cor</h3>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => handleColorSelect(color.id)}
                      className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all ${
                        selectedColorId === color.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hex_code }}
                      />
                      <span className="font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {selectedColorId && availableSizesForColor.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tamanho</h3>
                <div className="flex flex-wrap gap-2">
                  {availableSizesForColor.map((variation) => (
                    <button
                      key={variation.id}
                      onClick={() => handleSizeSelect(variation.size_id)}
                      className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                        selectedSizeId === variation.size_id
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {variation.size?.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            {selectedVariation && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Quantidade</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 border border-gray-300 rounded-lg font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= maxQuantity}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 ml-2">
                    ({maxQuantity} disponível{maxQuantity !== 1 ? 'is' : ''})
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Descrição</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariation}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-all ${
                  selectedVariation
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                Adicionar ao Carrinho
              </button>
              
              <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            {!selectedVariation && selectedColorId && (
              <p className="text-amber-600 text-sm mt-2">
                Selecione um tamanho para continuar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;