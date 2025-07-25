import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

      // First check if function exists and call it
      const { data: functionResult, error: functionError } = await supabase.rpc('create_tenant_with_user', {
        p_tenant_name: tenantData.name,
        p_tenant_slug: tenantData.slug,
        p_tenant_description: tenantData.description || '',
        p_tenant_settings: tenantData.settings,
        p_admin_email: tenantData.adminEmail,
        p_admin_name: tenantData.adminName,
        p_admin_password: tenantData.adminPassword
      });

      console.log('Create tenant function result:', { functionResult, functionError });

      if (functionError) {
        console.error('Function error:', functionError);
        
        // If function doesn't exist, create manually
        if (functionError.code === '42883') {
          console.log('Function not found, creating tenant manually...');
          return await createTenantManually(tenantData);
        }
        
        throw functionError;
      }

      if (!functionResult || typeof functionResult !== 'object' || !functionResult.success) {
        const message = functionResult?.message || 'Erro ao criar loja';
        throw new Error(message);
      }

      console.log('Tenant created successfully:', functionResult);
      return functionResult;
    } catch (err) {
      console.error('Error creating tenant:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to create tenant');
    }
  };

  const createTenantManually = async (tenantData: CreateTenantData) => {
    try {
      console.log('Creating tenant manually...');
      
      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([{
          name: tenantData.name,
          slug: tenantData.slug,
          description: tenantData.description || '',
          status: tenantData.status,
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

      // Note: In a real implementation, you would need to create the user in auth.users
      // For now, we'll just return success
      return {
        success: true,
        message: 'Loja criada com sucesso (usuário deve ser criado manualmente)',
        data: {
          tenant_id: tenant.id,
          user_id: null,
          subscription_id: null
        }
      };
    } catch (error) {
      console.error('Error in manual tenant creation:', error);
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
