import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { addDynamicCredential } from './useAuth';
import { createClient } from '@supabase/supabase-js';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  domain?: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  owner_id?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  subscription?: {
    plan: string;
    status: string;
    price_monthly: number;
  };
}

interface CreateTenantData {
  name: string;
  slug: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  settings: Record<string, any>;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  contractDurationDays?: number;
}

// Create admin client with service role key
const createAdminClient = () => {
  // Try to get service role key from environment
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (serviceRoleKey && serviceRoleKey !== import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.log('Using service role key for admin operations');
    return createClient(
      import.meta.env.VITE_SUPABASE_URL,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  
  console.log('Service role key not available, using regular client');
  return supabase;
};

export const useTenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          subscription:tenant_subscriptions(plan, status, price_monthly)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const createTenant = async (tenantData: CreateTenantData) => {
    try {
      console.log('Creating tenant with data:', tenantData);
      
      // Create tenant without user - user will register themselves
      return await createTenantForSelfRegistration(tenantData);
    } catch (err) {
      console.error('Error creating tenant:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to create tenant');
    }
  };

  const createTenantForSelfRegistration = async (tenantData: CreateTenantData) => {
    try {
      console.log('Creating tenant for self-registration...');
      
      // 1. Create tenant without owner_id (will be set when user registers)
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([{
          name: tenantData.name,
          slug: tenantData.slug,
          description: tenantData.description || '',
          status: tenantData.status,
          owner_id: null, // Will be set when user registers
          settings: tenantData.settings,
          contract_duration_days: tenantData.contractDurationDays || 30
        }])
        .select()
        .single();

      if (tenantError) {
        console.error('Error creating tenant:', tenantError);
        throw tenantError;
      }

      console.log('Tenant created:', tenant);

      // 2. Create store customization
      const { error: customizationError } = await supabase
        .from('store_customizations')
        .insert([{
          tenant_id: tenant.id,
          primary_color: '#3B82F6',
          background_color: '#FFFFFF',
          text_color: '#1F2937',
          accent_color: '#EFF6FF',
          font_family: 'Inter',
          font_size_base: 16,
          layout_style: 'modern'
        }]);

      if (customizationError) {
        console.warn('Error creating customization:', customizationError);
      }

      await fetchTenants();

      return {
        success: true,
        message: `Loja "${tenantData.name}" criada com sucesso! O administrador deve criar sua conta em: /auth/signup?tenant=${tenant.slug}`,
        data: {
          tenant_id: tenant.id,
          tenant_slug: tenant.slug,
          registration_url: `/auth/signup?tenant=${tenant.slug}`,
          admin_email: tenantData.adminEmail
        }
      };
    } catch (error) {
      console.error('Error in tenant creation for self-registration:', error);
      throw error;
    }
  };

  const updateTenant = async (id: string, updates: Partial<Tenant>) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchTenants();
      return data;
    } catch (err) {
      console.error('Error updating tenant:', err);
      throw new Error('Failed to update tenant');
    }
  };

  const deleteTenant = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTenants();
    } catch (err) {
      console.error('Error deleting tenant:', err);
      throw new Error('Failed to delete tenant');
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  return {
    tenants,
    loading,
    error,
    fetchTenants,
    createTenant,
    updateTenant,
    deleteTenant,
  };
};