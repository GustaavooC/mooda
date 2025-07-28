import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from './useAuth';

export interface Theme {
  id: string;
  name: string;
  description: string;
  preview_image: string;
  category: 'modern' | 'classic' | 'minimal' | 'elegant' | 'bold';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    fontSize: number;
  };
  layout: {
    style: string;
    headerType: 'simple' | 'centered' | 'split';
    productGrid: 'grid-2' | 'grid-3' | 'grid-4';
    cardStyle: 'minimal' | 'shadow' | 'border' | 'rounded';
  };
  features: string[];
  isPremium: boolean;
}

export interface StoreTheme {
  id: string;
  tenant_id: string;
  theme_id: string;
  applied_at: string;
  theme?: Theme;
}

// Temas pré-definidos
const PREDEFINED_THEMES: Theme[] = [
  {
    id: 'modern-blue',
    name: 'Moderno Azul',
    description: 'Design limpo e moderno com tons de azul, ideal para lojas de tecnologia e eletrônicos',
    preview_image: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'modern',
    colors: {
      primary: '#2563EB',
      secondary: '#EFF6FF',
      accent: '#1D4ED8',
      background: '#FFFFFF',
      text: '#1F2937'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      fontSize: 16
    },
    layout: {
      style: 'modern',
      headerType: 'centered',
      productGrid: 'grid-3',
      cardStyle: 'shadow'
    },
    features: ['Header centralizado', 'Cards com sombra', 'Grid 3 colunas', 'Tipografia moderna'],
    isPremium: false
  },
  {
    id: 'classic-green',
    name: 'Clássico Verde',
    description: 'Estilo tradicional com tons verdes, perfeito para lojas de produtos naturais e orgânicos',
    preview_image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'classic',
    colors: {
      primary: '#059669',
      secondary: '#ECFDF5',
      accent: '#047857',
      background: '#F9FAFB',
      text: '#374151'
    },
    typography: {
      headingFont: 'Georgia',
      bodyFont: 'Georgia',
      fontSize: 15
    },
    layout: {
      style: 'classic',
      headerType: 'simple',
      productGrid: 'grid-2',
      cardStyle: 'border'
    },
    features: ['Design clássico', 'Tipografia serifada', 'Grid 2 colunas', 'Bordas definidas'],
    isPremium: false
  },
  {
    id: 'minimal-gray',
    name: 'Minimalista Cinza',
    description: 'Design ultra-limpo e minimalista, ideal para marcas de luxo e produtos premium',
    preview_image: 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'minimal',
    colors: {
      primary: '#374151',
      secondary: '#F9FAFB',
      accent: '#6B7280',
      background: '#FFFFFF',
      text: '#111827'
    },
    typography: {
      headingFont: 'Helvetica',
      bodyFont: 'Helvetica',
      fontSize: 14
    },
    layout: {
      style: 'minimal',
      headerType: 'simple',
      productGrid: 'grid-4',
      cardStyle: 'minimal'
    },
    features: ['Ultra minimalista', 'Muito espaço em branco', 'Grid 4 colunas', 'Sem bordas'],
    isPremium: true
  },
  {
    id: 'elegant-purple',
    name: 'Elegante Roxo',
    description: 'Sofisticado e elegante com tons roxos, perfeito para moda feminina e cosméticos',
    preview_image: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'elegant',
    colors: {
      primary: '#7C3AED',
      secondary: '#F3E8FF',
      accent: '#6D28D9',
      background: '#FEFEFE',
      text: '#1F2937'
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Source Sans Pro',
      fontSize: 16
    },
    layout: {
      style: 'elegant',
      headerType: 'centered',
      productGrid: 'grid-3',
      cardStyle: 'rounded'
    },
    features: ['Design sofisticado', 'Tipografia elegante', 'Cards arredondados', 'Cores premium'],
    isPremium: true
  },
  {
    id: 'bold-orange',
    name: 'Vibrante Laranja',
    description: 'Design ousado e vibrante com laranja, ideal para esportes e produtos jovens',
    preview_image: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'bold',
    colors: {
      primary: '#EA580C',
      secondary: '#FFF7ED',
      accent: '#DC2626',
      background: '#FFFFFF',
      text: '#1F2937'
    },
    typography: {
      headingFont: 'Montserrat',
      bodyFont: 'Open Sans',
      fontSize: 16
    },
    layout: {
      style: 'bold',
      headerType: 'split',
      productGrid: 'grid-3',
      cardStyle: 'shadow'
    },
    features: ['Design ousado', 'Cores vibrantes', 'Header dividido', 'Tipografia impactante'],
    isPremium: false
  },
  {
    id: 'dark-mode',
    name: 'Modo Escuro',
    description: 'Tema escuro moderno, ideal para produtos tech e gaming',
    preview_image: 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'modern',
    colors: {
      primary: '#3B82F6',
      secondary: '#1F2937',
      accent: '#60A5FA',
      background: '#111827',
      text: '#F9FAFB'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      fontSize: 16
    },
    layout: {
      style: 'dark',
      headerType: 'centered',
      productGrid: 'grid-3',
      cardStyle: 'shadow'
    },
    features: ['Modo escuro', 'Cores contrastantes', 'Design moderno', 'Ideal para tech'],
    isPremium: true
  }
];

export const useThemes = () => {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const [themes] = useState<Theme[]>(PREDEFINED_THEMES);
  const [currentTheme, setCurrentTheme] = useState<StoreTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentTheme = async () => {
    if (!currentTenant?.id) {
      setCurrentTheme(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Para usuários demo, usar tema padrão baseado no slug
      if (user?.tenantSlug) {
        const defaultThemeMap: Record<string, string> = {
          'moda-bella': 'elegant-purple',
          'tech-store-pro': 'modern-blue',
          'casa-decoracao': 'classic-green',
          'esporte-total': 'bold-orange',
          'beleza-natural': 'elegant-purple',
          'livraria-saber': 'classic-green',
          'pet-shop-amigo': 'bold-orange',
          'gourmet-express': 'minimal-gray',
          'jardim-verde': 'classic-green',
          'arte-craft': 'elegant-purple'
        };

        const themeId = defaultThemeMap[user.tenantSlug] || 'modern-blue';
        const theme = themes.find(t => t.id === themeId);
        
        if (theme) {
          setCurrentTheme({
            id: `demo-${currentTenant.id}`,
            tenant_id: currentTenant.id,
            theme_id: themeId,
            applied_at: new Date().toISOString(),
            theme
          });
        }
        setLoading(false);
        return;
      }

      // Buscar tema atual no banco de dados
      const { data, error } = await supabase
        .from('store_themes')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const theme = themes.find(t => t.id === data.theme_id);
        setCurrentTheme({
          ...data,
          theme
        });
      } else {
        // Se não há tema definido, usar o primeiro tema como padrão
        const defaultTheme = themes[0];
        setCurrentTheme({
          id: 'default',
          tenant_id: currentTenant.id,
          theme_id: defaultTheme.id,
          applied_at: new Date().toISOString(),
          theme: defaultTheme
        });
      }
    } catch (err) {
      console.error('Error fetching current theme:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch theme');
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = async (themeId: string) => {
    if (!currentTenant?.id) throw new Error('No tenant selected');

    try {
      const theme = themes.find(t => t.id === themeId);
      if (!theme) throw new Error('Theme not found');

      // Para usuários demo, apenas atualizar o estado local
      if (user?.tenantSlug) {
        setCurrentTheme({
          id: `demo-${currentTenant.id}`,
          tenant_id: currentTenant.id,
          theme_id: themeId,
          applied_at: new Date().toISOString(),
          theme
        });
        return { success: true };
      }

      // Salvar no banco de dados
      const { data, error } = await supabase
        .from('store_themes')
        .upsert({
          tenant_id: currentTenant.id,
          theme_id: themeId,
          applied_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentTheme({
        ...data,
        theme
      });

      return { success: true };
    } catch (err) {
      console.error('Error applying theme:', err);
      throw err;
    }
  };

  const getThemesByCategory = (category: Theme['category']) => {
    return themes.filter(theme => theme.category === category);
  };

  const getThemeById = (themeId: string) => {
    return themes.find(theme => theme.id === themeId);
  };

  useEffect(() => {
    fetchCurrentTheme();
  }, [currentTenant?.id, user]);

  return {
    themes,
    currentTheme,
    loading,
    error,
    applyTheme,
    getThemesByCategory,
    getThemeById,
    refreshTheme: fetchCurrentTheme,
  };
};