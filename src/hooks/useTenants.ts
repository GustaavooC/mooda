import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { addDynamicCredential } from './useAuth';
import axios from 'axios';

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

      // Criar tenant manualmente (mais confiável)
      console.log('Creating tenant manually...');
      return await createTenantManually(tenantData);
    } catch (err) {
      console.error('Error creating tenant:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to create tenant');
    }
  };

  const createTenantManually = async (tenantData: CreateTenantData) => {
    try {
      console.log('Creating tenant manually...');
      
      // 1. Criar usuário no Supabase Auth primeiro
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: tenantData.adminEmail,
        password: tenantData.adminPassword,
        email_confirm: true,
        user_metadata: { name: tenantData.adminName }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      console.log('Auth user created:', authUser.user);

      // 2. Criar o tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([{
          name: tenantData.name,
          slug: tenantData.slug,
          description: tenantData.description || '',
          status: tenantData.status,
          owner_id: authUser.user.id,
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

      // 3. Criar perfil do usuário
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: tenantData.adminEmail,
          name: tenantData.adminName
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Não falha aqui, apenas avisa
        console.warn('Profile creation failed, but continuing...');
      }

      // 4. Vincular usuário ao tenant
      const { error: tenantUserError } = await supabase
        .from('tenant_users')
        .insert({
          tenant_id: tenant.id,
          user_id: authUser.user.id,
          role: 'owner',
          is_active: true
        });

      if (tenantUserError) {
        console.error('Error creating tenant user:', tenantUserError);
        throw tenantUserError;
      }

      // 5. Criar customização da loja
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

        // 6. Criar credenciais demo como fallback
        const newUserData = {
          id: authUser.user.id,
          email: tenantData.adminEmail,
          name: tenantData.adminName,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantName: tenant.name,
          user_metadata: { name: tenantData.adminName }
        };

        // Adicionar as credenciais ao sistema de demo como fallback
        addDynamicCredential(tenantData.adminEmail, tenantData.adminPassword, newUserData);

        await fetchTenants(); // Atualizar lista de tenants

        return {
          success: true,
          message: `Loja criada com sucesso! Usuário criado no Supabase e pode fazer login com: ${tenantData.adminEmail} / ${tenantData.adminPassword}`,
          data: {
            tenant_id: tenant.id,
            user_id: authUser.user.id,
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