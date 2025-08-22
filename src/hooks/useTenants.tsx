import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { addDynamicCredential } from './useAuth';

// Define the Tenant interface based on your database schema
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
  subscription?: { plan: string };
  contract_start_date?: string;
  contract_end_date?: string;
  contract_duration_days?: number;
  contract_status?: string;
}

export const useTenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          subscription:tenant_subscriptions(plan)
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

  const createTenant = async (tenantData: {
    name: string;
    slug: string;
    description: string;
    status: string;
    settings: Record<string, any>;
    adminEmail: string;
    adminName: string;
    adminPassword: string;
    contractDurationDays: number;
  }) => {
    try {
      console.log('Creating tenant with data:', tenantData);
      
      // Use admin client for tenant creation
      const client = supabase;
      
      // First, create the tenant
      const { data: tenantResult, error: tenantError } = await client
        .from('tenants')
        .insert({
          name: tenantData.name,
          slug: tenantData.slug,
          description: tenantData.description,
          status: tenantData.status,
          settings: tenantData.settings,
          contract_duration_days: tenantData.contractDurationDays
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Error creating tenant:', tenantError);
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
      }

      console.log('Tenant created:', tenantResult);

      let realUserCreated = false;
      let authUser = null;

      // Try to create real user with Supabase Auth
      try {
        if (supabaseAdmin) {
          console.log('Creating real user with admin client...');
          
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: tenantData.adminEmail,
            password: tenantData.adminPassword,
            email_confirm: true,
            user_metadata: {
              name: tenantData.adminName,
              tenant_id: tenantResult.id,
              tenant_slug: tenantResult.slug,
              tenant_name: tenantResult.name
            }
          });

          if (authError) {
            console.warn('Auth user creation failed:', authError);
          } else {
            console.log('✅ Real user created:', authData.user?.email);
            authUser = authData.user;
            realUserCreated = true;

            // Update tenant with owner_id
            await client
              .from('tenants')
              .update({ owner_id: authUser.id })
              .eq('id', tenantResult.id);

            // Create user profile
            await client
              .from('users')
              .insert({
                id: authUser.id,
                email: authUser.email!,
                name: tenantData.adminName
              });

            // Create tenant_user relationship
            await client
              .from('tenant_users')
              .insert({
                tenant_id: tenantResult.id,
                user_id: authUser.id,
                role: 'owner',
                is_active: true
              });

            console.log('✅ User profile and relationships created');
          }
        }
      } catch (authError) {
        console.warn('Real user creation failed, will use demo mode:', authError);
      }

      // Always add to demo credentials for immediate testing
      const demoUserId = authUser?.id || `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const demoUserData = {
        id: demoUserId,
        email: tenantData.adminEmail,
        name: tenantData.adminName,
        tenantId: tenantResult.id,
        tenantSlug: tenantResult.slug,
        tenantName: tenantResult.name,
        user_metadata: { name: tenantData.adminName }
      };

      addDynamicCredential(tenantData.adminEmail, tenantData.adminPassword, demoUserData);
      console.log('✅ Demo credentials added for immediate testing');

      return {
        success: true,
        message: realUserCreated 
          ? 'Loja e usuário real criados com sucesso!' 
          : 'Loja criada com sucesso! (modo demo)',
        data: {
          tenant: tenantResult,
          user: authUser,
          real_user_created: realUserCreated,
          registration_url: `/auth/signin?email=${encodeURIComponent(tenantData.adminEmail)}&password=${encodeURIComponent(tenantData.adminPassword)}`
        }
      };

    } catch (err) {
      console.error('Error creating tenant:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to create tenant');
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
  };
};