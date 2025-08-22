import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { addDynamicCredential } from './useAuth';
import { createAdminClient } from '../lib/supabase';

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
      
      // Try to create with real user first, fallback to self-registration
      return await createTenantWithRealUser(tenantData);
    } catch (err) {
      console.error('Error creating tenant:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to create tenant');
    }
  };

  const createTenantWithRealUser = async (tenantData: CreateTenantData) => {
    try {
      console.log('Creating tenant with real user...');
      
      // Use admin client to bypass RLS
      const adminClient = createAdminClient();
      
      // 1. Create user in Supabase Auth
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: tenantData.adminEmail,
        password: tenantData.adminPassword,
        email_confirm: true,
        user_metadata: { 
          name: tenantData.adminName,
          role: 'tenant_owner'
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        // If user creation fails, fallback to self-registration
        return await createTenantForSelfRegistration(tenantData);
      }

      console.log('User created successfully:', authUser.user.id);

      // 2. Create user profile
      const { error: profileError } = await adminClient
        .from('users')
        .insert({
          id: authUser.user.id,
          email: tenantData.adminEmail,
          name: tenantData.adminName
        });

      if (profileError) {
        console.warn('Error creating user profile:', profileError);
      }

      // 1. Create tenant without owner_id (will be set when user registers)
      const { data: tenant, error: tenantError } = await adminClient
        .from('tenants')
        .insert([{
          name: tenantData.name,
          slug: tenantData.slug,
          description: tenantData.description || '',
          status: tenantData.status,
          owner_id: authUser.user.id, // Set real user as owner
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

      // 3. Create tenant_users relationship
      const { error: tenantUserError } = await adminClient
        .from('tenant_users')
        .insert([{
          tenant_id: tenant.id,
          user_id: authUser.user.id,
          role: 'owner',
          is_active: true
        }]);

      if (tenantUserError) {
        console.warn('Error creating tenant user relationship:', tenantUserError);
      }

      // 4. Create subscription
      const { error: subscriptionError } = await adminClient
        .from('tenant_subscriptions')
        .insert([{
          tenant_id: tenant.id,
          plan: 'free',
          status: 'active',
          price_monthly: 0,
          features: {
            max_products: 100,
            max_variations: 500,
            custom_domain: false,
            analytics: true
          },
          limits: {
            products: 100,
            variations: 500,
            storage_gb: 1
          }
        }]);

      if (subscriptionError) {
        console.warn('Error creating subscription:', subscriptionError);
      }

      // 2. Create store customization
      const { error: customizationError } = await adminClient
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
        message: `Loja "${tenantData.name}" criada com sucesso! Usuário real criado no Supabase.`,
        data: {
          tenant_id: tenant.id,
          tenant_slug: tenant.slug,
          user_id: authUser.user.id,
          admin_email: tenantData.adminEmail,
          real_user_created: true
        }
      };
    } catch (error) {
      console.error('Error in tenant creation with real user:', error);
      throw error;
    }
  };

  const createTenantForSelfRegistration = async (tenantData: CreateTenantData) => {
    try {
      console.log('Fallback: Creating tenant for self-registration...');
      
      // Use admin client to bypass RLS
      const adminClient = createAdminClient();
      
      // 1. Create tenant without owner_id (will be set when user registers)
      const { data: tenant, error: tenantError } = await adminClient
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

      console.log('Tenant created for self-registration:', tenant);

      // 2. Create store customization
      const { error: customizationError } = await adminClient
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
        message: `Loja "${tenantData.name}" criada! Envie este link para o administrador se registrar:`,
        data: {
          tenant_id: tenant.id,
          tenant_slug: tenant.slug,
          registration_url: `/auth/signup?tenant=${tenant.slug}&email=${encodeURIComponent(tenantData.adminEmail)}`,
          self_registration: true
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