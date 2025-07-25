import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  domain?: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  permissions: Record<string, any>;
  is_active: boolean;
  tenant?: Tenant;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  tenantUser: TenantUser | null;
  loading: boolean;
  error: string | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  refreshTenant: () => Promise<void>;
  isAdmin: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
  tenantSlug?: string;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children, tenantSlug }) => {
  const { user } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenantUser, setTenantUser] = useState<TenantUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchTenantBySlug = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Loja não encontrada ou inativa');
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error fetching tenant:', err);
      throw err;
    }
  };

  const fetchUserTenant = async () => {
    try {
      console.log('Fetching tenant for user:', user);
      
      if (!user) return null;

      // Check if user is admin
      setIsAdmin(!!user.isAdmin);

      // For demo users, use the tenant info from the user object
      if (user.tenantId && user.tenantSlug) {
        console.log('Using demo tenant data from user:', {
          tenantId: user.tenantId,
          tenantSlug: user.tenantSlug,
          tenantName: user.tenantName
        });

        // Create mock tenant for demo users
        const mockTenant: Tenant = {
          id: user.tenantId,
          name: user.tenantName || 'Demo Tenant',
          slug: user.tenantSlug,
          description: `Loja demo: ${user.tenantName}`,
          status: 'active',
          settings: {
            theme: 'default',
            currency: 'BRL',
            colors: {
              primary: '#3B82F6',
              secondary: '#EFF6FF'
            }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const mockTenantUser: TenantUser = {
          id: 'demo-tenant-user',
          tenant_id: mockTenant.id,
          user_id: user.id,
          role: 'owner',
          permissions: {
            manage_products: true,
            manage_orders: true,
            manage_settings: true
          },
          is_active: true,
          tenant: mockTenant
        };

        return mockTenantUser;
      }

      // Get user's tenant from database
      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      console.log('Database tenant query result:', { data, error });
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching tenant:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching user tenant:', err);
      throw err;
    }
  };

  const refreshTenant = async () => {
    try {
      setLoading(true);
      setError(null);

      if (tenantSlug) {
        // Public store view - fetch by slug
        const tenant = await fetchTenantBySlug(tenantSlug);
        setCurrentTenant(tenant);
        setTenantUser(null);
      } else {
        // Admin/dashboard view - fetch user's tenant
        const userTenant = await fetchUserTenant();
        if (userTenant?.tenant) {
          setCurrentTenant(userTenant.tenant);
          setTenantUser(userTenant);
        } else {
          setCurrentTenant(null);
          setTenantUser(null);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tenant';
      setError(errorMessage);
      setCurrentTenant(null);
      setTenantUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTenant();
  }, [tenantSlug, user]);

  const value: TenantContextType = {
    currentTenant,
    tenantUser,
    loading,
    error,
    setCurrentTenant,
    refreshTenant,
    isAdmin,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};