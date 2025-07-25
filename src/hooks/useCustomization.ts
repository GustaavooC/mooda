import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from './useAuth';

export interface StoreCustomization {
  id: string;
  tenant_id: string;
  logo_url?: string;
  banner_main_url?: string;
  banner_profile_url?: string;
  primary_color: string;
  background_color: string;
  text_color: string;
  accent_color: string;
  font_family: string;
  font_size_base: number;
  layout_style: string;
  template_id?: string;
  custom_css?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomizationTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  preview_image_url?: string;
  config: Record<string, any>;
  is_premium: boolean;
  is_active: boolean;
}

export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: string;
  google_font_url?: string;
  is_premium: boolean;
  preview_text: string;
}

export interface CustomizationHistory {
  id: string;
  tenant_id: string;
  user_id?: string;
  action_type: string;
  changes: Record<string, any>;
  previous_config?: Record<string, any>;
  new_config?: Record<string, any>;
  template_used?: string;
  created_at: string;
}

export const useCustomization = (tenantId?: string) => {
  const { currentTenant } = useTenant();
  const { user } = useAuth();
  const [customization, setCustomization] = useState<StoreCustomization | null>(null);
  const [templates, setTemplates] = useState<CustomizationTemplate[]>([]);
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [history, setHistory] = useState<CustomizationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTenantId = tenantId || currentTenant?.id;

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      // Para usuários demo, retornar templates mock
      if (user?.tenantSlug || user?.isAdmin) {
        const mockTemplates: CustomizationTemplate[] = [
          {
            id: 'modern-clean',
            name: 'Moderno Limpo',
            description: 'Design moderno e minimalista com cores neutras',
            category: 'modern',
            preview_image_url: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=400',
            config: {
              primary_color: '#3B82F6',
              background_color: '#FFFFFF',
              text_color: '#1F2937',
              accent_color: '#EFF6FF',
              font_family: 'Inter',
              layout_style: 'modern'
            },
            is_premium: false,
            is_active: true
          },
          {
            id: 'elegant-purple',
            name: 'Elegante Roxo',
            description: 'Design sofisticado com tons roxos para moda e beleza',
            category: 'elegant',
            preview_image_url: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=400',
            config: {
              primary_color: '#7C3AED',
              background_color: '#FEFEFE',
              text_color: '#1F2937',
              accent_color: '#F3E8FF',
              font_family: 'Playfair Display',
              layout_style: 'elegant'
            },
            is_premium: true,
            is_active: true
          }
        ];
        setTemplates(mockTemplates);
        return;
      }

      const { data, error } = await supabase
        .from('customization_templates')
        .select('*')
        .eq('is_active', true)
        .order('category, name');

      if (error) {
        // Handle case where table doesn't exist yet
        if (error.code === '42P01') {
          console.warn('Templates table not found, using empty array');
          setTemplates([]);
          return;
        }
        throw error;
      }
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setTemplates([]);
    }
  };

  // Fetch fonts
  const fetchFonts = async () => {
    try {
      // Para usuários demo, retornar fontes mock
      if (user?.tenantSlug || user?.isAdmin) {
        const mockFonts: FontOption[] = [
          {
            id: 'inter',
            name: 'Inter',
            family: 'Inter',
            category: 'sans-serif',
            google_font_url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
            is_premium: false,
            preview_text: 'The quick brown fox jumps over the lazy dog'
          },
          {
            id: 'poppins',
            name: 'Poppins',
            family: 'Poppins',
            category: 'sans-serif',
            google_font_url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
            is_premium: false,
            preview_text: 'The quick brown fox jumps over the lazy dog'
          },
          {
            id: 'playfair',
            name: 'Playfair Display',
            family: 'Playfair Display',
            category: 'serif',
            google_font_url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
            is_premium: true,
            preview_text: 'The quick brown fox jumps over the lazy dog'
          }
        ];
        setFonts(mockFonts);
        return;
      }

      const { data, error } = await supabase
        .from('font_options')
        .select('*')
        .order('category, name');

      if (error) {
        // Handle case where table doesn't exist yet
        if (error.code === '42P01') {
          console.warn('Fonts table not found, using default fonts');
          setFonts([
            { 
              id: '1', 
              name: 'Inter', 
              family: 'Inter', 
              category: 'sans-serif', 
              google_font_url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
              is_premium: false, 
              preview_text: 'The quick brown fox jumps over the lazy dog' 
            },
            { 
              id: '2', 
              name: 'Poppins', 
              family: 'Poppins', 
              category: 'sans-serif', 
              google_font_url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
              is_premium: false, 
              preview_text: 'The quick brown fox jumps over the lazy dog' 
            }
          ]);
          return;
        }
        throw error;
      }
      setFonts(data || []);
    } catch (err) {
      console.error('Error fetching fonts:', err);
      // Fallback to default fonts
      setFonts([
        { 
          id: '1', 
          name: 'Inter', 
          family: 'Inter', 
          category: 'sans-serif', 
          google_font_url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
          is_premium: false, 
          preview_text: 'The quick brown fox jumps over the lazy dog' 
        },
        { 
          id: '2', 
          name: 'Poppins', 
          family: 'Poppins', 
          category: 'sans-serif', 
          google_font_url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
          is_premium: false, 
          preview_text: 'The quick brown fox jumps over the lazy dog' 
        }
      ]);
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    if (!activeTenantId) return;

    try {
      // Para usuários demo, retornar histórico mock
      if (user?.tenantSlug) {
        const mockHistory: CustomizationHistory[] = [
          {
            id: 'history-1',
            tenant_id: activeTenantId,
            user_id: user.id,
            action_type: 'template_apply',
            changes: { template_id: 'modern-clean' },
            template_used: 'Moderno Limpo',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'history-2',
            tenant_id: activeTenantId,
            user_id: user.id,
            action_type: 'update',
            changes: { primary_color: '#3B82F6', font_family: 'Inter' },
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setHistory(mockHistory);
        return;
      }

      const { data, error } = await supabase
        .from('customization_history')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // Handle case where table doesn't exist yet
        if (error.code === '42P01') {
          console.warn('History table not found, using empty array');
          setHistory([]);
          return;
        }
        throw error;
      }
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      setHistory([]);
    }
  };

  const fetchCustomization = async () => {
    if (!activeTenantId) {
      setCustomization(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Para usuários demo, criar customização mock
      if (user?.tenantSlug) {
        const mockCustomization = {
          id: `demo-customization-${activeTenantId}`,
          tenant_id: activeTenantId,
          primary_color: '#3B82F6',
          background_color: '#FFFFFF',
          text_color: '#1F2937',
          accent_color: '#EFF6FF',
          font_family: 'Inter',
          font_size_base: 16,
          layout_style: 'modern',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setCustomization(mockCustomization);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('store_customizations')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching customization:', error);
        // If it's an RLS error, try to create default customization
        if (error.code === '42501') {
          console.log('RLS error, using default customization');
          const defaultCustomization = {
            id: `default-${activeTenantId}`,
            tenant_id: activeTenantId,
            primary_color: '#3B82F6',
            background_color: '#FFFFFF',
            text_color: '#1F2937',
            accent_color: '#EFF6FF',
            font_family: 'Inter',
            font_size_base: 16,
            layout_style: 'modern',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setCustomization(defaultCustomization);
          setLoading(false);
          return;
        }
        throw error;
      }

      if (!data) {
        // Use default customization if none exists
        const defaultCustomization = {
          id: `default-${activeTenantId}`,
          tenant_id: activeTenantId,
          primary_color: '#3B82F6',
          background_color: '#FFFFFF',
          text_color: '#1F2937',
          accent_color: '#EFF6FF',
          font_family: 'Inter',
          font_size_base: 16,
          layout_style: 'modern',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setCustomization(defaultCustomization);
      } else {
        setCustomization(data);
      }
    } catch (err) {
      console.error('Error fetching customization:', err);
      // Use default customization as fallback
      const defaultCustomization = {
        id: `fallback-${activeTenantId}`,
        tenant_id: activeTenantId,
        primary_color: '#3B82F6',
        background_color: '#FFFFFF',
        text_color: '#1F2937',
        accent_color: '#EFF6FF',
        font_family: 'Inter',
        font_size_base: 16,
        layout_style: 'modern',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setCustomization(defaultCustomization);
      console.warn('Using fallback customization due to error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCustomization = async (updates: Partial<StoreCustomization>) => {
    if (!activeTenantId || !customization) return;

    // Para usuários demo, apenas atualizar estado local
    if (user?.tenantSlug) {
      const updatedCustomization = { ...customization, ...updates, updated_at: new Date().toISOString() };
      setCustomization(updatedCustomization);
      
      // Simular adição ao histórico
      const newHistoryItem: CustomizationHistory = {
        id: `history-${Date.now()}`,
        tenant_id: activeTenantId,
        user_id: user.id,
        action_type: 'update',
        changes: updates,
        created_at: new Date().toISOString()
      };
      setHistory(prev => [newHistoryItem, ...prev]);
      
      return updatedCustomization;
    }

    const previousConfig = { ...customization };

    try {
      const { data, error } = await supabase
        .from('store_customizations')
        .update(updates)
        .eq('tenant_id', activeTenantId)
        .select()
        .single();

      if (error) throw error;
      setCustomization(data);

      // Record in history
      await supabase
        .from('customization_history')
        .insert([{
          tenant_id: activeTenantId,
          user_id: user?.id,
          action_type: 'update',
          changes: updates,
          previous_config: previousConfig,
          new_config: data
        }]);

      // Refresh history
      fetchHistory();

      return data;
    } catch (err) {
      console.error('Error updating customization:', err);
      throw err;
    }
  };

  const applyTemplate = async (templateId: string) => {
    if (!activeTenantId) return;

    // Para usuários demo, aplicar template localmente
    if (user?.tenantSlug) {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template não encontrado');
      
      const updatedCustomization = {
        ...customization!,
        ...template.config,
        template_id: templateId,
        updated_at: new Date().toISOString()
      };
      setCustomization(updatedCustomization);
      
      // Simular adição ao histórico
      const newHistoryItem: CustomizationHistory = {
        id: `history-${Date.now()}`,
        tenant_id: activeTenantId,
        user_id: user.id,
        action_type: 'template_apply',
        changes: template.config,
        template_used: template.name,
        created_at: new Date().toISOString()
      };
      setHistory(prev => [newHistoryItem, ...prev]);
      
      return { success: true, message: 'Template aplicado com sucesso!' };
    }

    try {
      const { data, error } = await supabase.rpc('apply_customization_template', {
        p_tenant_id: activeTenantId,
        p_template_id: templateId,
        p_user_id: user?.id
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.message);
      }

      // Refresh customization and history
      await fetchCustomization();
      await fetchHistory();

      return data;
    } catch (err) {
      console.error('Error applying template:', err);
      throw err;
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'banner_main' | 'banner_profile'): Promise<string> => {
    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido. Use JPG, PNG ou WebP.');
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Máximo 2MB.');
    }

    // Para usuários demo, simular upload e retornar URL mock
    if (user?.tenantSlug) {
      // Simular delay de upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Retornar URL mock baseada no tipo
      const mockUrls = {
        logo: 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=200&h=80',
        banner_main: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400',
        banner_profile: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800&h=300'
      };
      
      return mockUrls[type];
    }

    try {
      // Call the upload function
      const { data, error } = await supabase.rpc('upload_store_image', {
        p_tenant_id: activeTenantId,
        p_image_type: type,
        p_file_name: file.name,
        p_file_size: file.size,
        p_mime_type: file.type
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.message);
      }

      // Simulate upload delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      return data.url;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    }
  };

  const loadGoogleFont = (fontFamily: string) => {
    const font = fonts.find(f => f.family === fontFamily);
    if (font?.google_font_url) {
      const link = document.createElement('link');
      link.href = font.google_font_url;
      link.rel = 'stylesheet';
      
      // Check if font is already loaded
      const existingLink = document.querySelector(`link[href="${font.google_font_url}"]`);
      if (!existingLink) {
        document.head.appendChild(link);
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchCustomization(),
        fetchTemplates(),
        fetchFonts()
      ]);
      
      if (activeTenantId) {
        await fetchHistory();
      }
    };

    initializeData();
  }, [activeTenantId, user]);

  // Load Google Font when customization changes
  useEffect(() => {
    if (customization?.font_family) {
      loadGoogleFont(customization.font_family);
    }
  }, [customization?.font_family, fonts]);

  return {
    customization,
    templates,
    fonts,
    history,
    loading,
    error,
    updateCustomization,
    applyTemplate,
    uploadImage,
    loadGoogleFont,
    refreshCustomization: fetchCustomization,
  };
};