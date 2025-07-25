import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface TenantMetrics {
  id: string;
  tenant_id: string;
  metric_date: string;
  total_products: number;
  total_variations: number;
  total_orders: number;
  total_revenue: number;
  active_customers: number;
  page_views: number;
  conversion_rate: number;
  avg_order_value: number;
  created_at: string;
  updated_at: string;
}

export interface SystemMetrics {
  id: string;
  metric_date: string;
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_revenue: number;
  new_signups: number;
  churn_rate: number;
  mrr: number;
  created_at: string;
  updated_at: string;
}

export const useMetrics = (tenantId?: string) => {
  const { user } = useAuth();
  const [tenantMetrics, setTenantMetrics] = useState<TenantMetrics[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate mock metrics for demo users
  const generateMockTenantMetrics = (tenantId: string): TenantMetrics => {
    const baseDate = new Date().toISOString().split('T')[0];
    const mockData = {
      'moda-bella': { products: 45, variations: 180, orders: 127, revenue: 15420.50, customers: 89 },
      'tech-store-pro': { products: 32, variations: 96, orders: 89, revenue: 45230.80, customers: 67 },
      'casa-decoracao': { products: 28, variations: 84, orders: 56, revenue: 12890.30, customers: 45 },
      'esporte-total': { products: 38, variations: 152, orders: 78, revenue: 18750.90, customers: 62 },
      'beleza-natural': { products: 42, variations: 168, orders: 134, revenue: 9870.40, customers: 98 },
      'livraria-saber': { products: 156, variations: 312, orders: 67, revenue: 8450.20, customers: 54 },
      'pet-shop-amigo': { products: 34, variations: 102, orders: 45, revenue: 6780.60, customers: 38 },
      'gourmet-express': { products: 29, variations: 87, orders: 89, revenue: 13450.80, customers: 71 },
      'jardim-verde': { products: 47, variations: 141, orders: 34, revenue: 5670.30, customers: 29 },
      'arte-craft': { products: 23, variations: 69, orders: 12, revenue: 2340.90, customers: 18 }
    };

    const tenantSlug = user?.tenantSlug || 'moda-bella';
    const data = mockData[tenantSlug as keyof typeof mockData] || mockData['moda-bella'];

    return {
      id: `metric-${tenantId}`,
      tenant_id: tenantId,
      metric_date: baseDate,
      total_products: data.products,
      total_variations: data.variations,
      total_orders: data.orders,
      total_revenue: data.revenue,
      active_customers: data.customers,
      page_views: Math.floor(Math.random() * 1000) + 500,
      conversion_rate: Math.floor(Math.random() * 5) + 2,
      avg_order_value: data.revenue / data.orders,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  const generateMockSystemMetrics = (): SystemMetrics => {
    const baseDate = new Date().toISOString().split('T')[0];
    
    return {
      id: 'system-metric-current',
      metric_date: baseDate,
      total_tenants: 10,
      active_tenants: 9,
      total_users: 45,
      total_revenue: 145890.50,
      new_signups: 8,
      churn_rate: 2.5,
      mrr: 12890.40,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  const fetchTenantMetrics = async (id: string, days: number = 30) => {
    try {
      // For demo users, return mock data
      if (user?.tenantSlug) {
        const mockMetric = generateMockTenantMetrics(id);
        const mockHistory = Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return {
            ...mockMetric,
            id: `metric-${id}-${i}`,
            metric_date: date.toISOString().split('T')[0],
            total_products: mockMetric.total_products - Math.floor(Math.random() * 5),
            total_orders: mockMetric.total_orders - Math.floor(Math.random() * 10),
            total_revenue: mockMetric.total_revenue - Math.floor(Math.random() * 1000),
            active_customers: mockMetric.active_customers - Math.floor(Math.random() * 5)
          };
        });
        return mockHistory;
      }

      const { data, error } = await supabase
        .from('tenant_metrics')
        .select('*')
        .eq('tenant_id', id)
        .gte('metric_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('metric_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching tenant metrics:', err);
      throw err;
    }
  };

  const fetchSystemMetrics = async (days: number = 30) => {
    try {
      // For admin demo user, return mock data
      if (user?.isAdmin) {
        const mockMetric = generateMockSystemMetrics();
        const mockHistory = Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return {
            ...mockMetric,
            id: `system-metric-${i}`,
            metric_date: date.toISOString().split('T')[0],
            total_tenants: mockMetric.total_tenants - Math.floor(Math.random() * 2),
            active_tenants: mockMetric.active_tenants - Math.floor(Math.random() * 2),
            total_users: mockMetric.total_users - Math.floor(Math.random() * 5),
            total_revenue: mockMetric.total_revenue - Math.floor(Math.random() * 5000)
          };
        });
        return mockHistory;
      }

      const { data, error } = await supabase
        .from('system_metrics')
        .select('*')
        .gte('metric_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('metric_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching system metrics:', err);
      throw err;
    }
  };

  const refreshMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      if (tenantId) {
        const metrics = await fetchTenantMetrics(tenantId);
        setTenantMetrics(metrics);
      } else {
        const metrics = await fetchSystemMetrics();
        setSystemMetrics(metrics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMetrics();
  }, [tenantId, user]);

  const getCurrentMetrics = () => {
    if (tenantId && tenantMetrics.length > 0) {
      return tenantMetrics[0];
    }
    if (!tenantId && systemMetrics.length > 0) {
      return systemMetrics[0];
    }
    return null;
  };

  const getMetricsComparison = () => {
    const current = getCurrentMetrics();
    if (!current) return null;

    const previous = tenantId 
      ? tenantMetrics[1] 
      : systemMetrics[1];

    if (!previous) return null;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    if (tenantId) {
      const curr = current as TenantMetrics;
      const prev = previous as TenantMetrics;
      
      return {
        products: calculateChange(curr.total_products, prev.total_products),
        variations: calculateChange(curr.total_variations, prev.total_variations),
        orders: calculateChange(curr.total_orders, prev.total_orders),
        revenue: calculateChange(curr.total_revenue, prev.total_revenue),
        customers: calculateChange(curr.active_customers, prev.active_customers),
        pageViews: calculateChange(curr.page_views, prev.page_views),
      };
    } else {
      const curr = current as SystemMetrics;
      const prev = previous as SystemMetrics;
      
      return {
        tenants: calculateChange(curr.total_tenants, prev.total_tenants),
        activeTenants: calculateChange(curr.active_tenants, prev.active_tenants),
        users: calculateChange(curr.total_users, prev.total_users),
        revenue: calculateChange(curr.total_revenue, prev.total_revenue),
        signups: calculateChange(curr.new_signups, prev.new_signups),
        mrr: calculateChange(curr.mrr, prev.mrr),
      };
    }
  };

  return {
    tenantMetrics,
    systemMetrics,
    loading,
    error,
    refreshMetrics,
    getCurrentMetrics,
    getMetricsComparison,
  };
};