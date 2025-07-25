import React from 'react';
import { Lock } from 'lucide-react';

interface PriceDisplayProps {
  price?: number;
  promotionalPrice?: number;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLoginPrompt?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  promotionalPrice,
  isAuthenticated,
  onAuthRequired,
  className = '',
  size = 'md',
  showLoginPrompt = true
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-3xl'
  };

  const lockSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (!isAuthenticated && showLoginPrompt) {
    return (
      <div className={`${className}`}>
        <button
          onClick={onAuthRequired}
          className={`flex items-center gap-2 ${sizeClasses[size]} font-bold text-blue-600 hover:text-blue-700 transition-colors`}
        >
          <Lock className={lockSizeClasses[size]} />
          Faça login para ver o preço
        </button>
      </div>
    );
  }

  if (!isAuthenticated && !showLoginPrompt) {
    return (
      <div className={`${sizeClasses[size]} text-gray-500 ${className}`}>
        Preço disponível após login
      </div>
    );
  }

  if (!price) {
    return (
      <div className={`${sizeClasses[size]} text-gray-500 ${className}`}>
        Preço indisponível
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`${sizeClasses[size]} font-bold text-gray-900`}>
        R$ {(promotionalPrice || price).toFixed(2)}
      </span>
      {promotionalPrice && (
        <span className={`${size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm'} text-gray-500 line-through`}>
          R$ {price.toFixed(2)}
        </span>
      )}
    </div>
  );
};

export default PriceDisplay;