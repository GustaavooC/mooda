import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ContractInfo {
  tenant_id: string;
  tenant_name: string;
  contract_start_date: string;
  contract_end_date: string;
  contract_duration_days: number;
  contract_status: 'active' | 'expired' | 'suspended' | 'trial';
  days_remaining: number;
  is_expired: boolean;
  days_since_expiry: number;
}

export const useContract = (tenantId?: string) => {
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContractInfo = async () => {
    if (!tenantId) {
      setContractInfo(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Para usuários demo, retornar dados mock
      if (tenantId.includes('-') && tenantId.length === 36) {
        const mockContract: ContractInfo = {
          tenant_id: tenantId,
          tenant_name: 'Loja Demo',
          contract_start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          contract_end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          contract_duration_days: 30,
          contract_status: 'active',
          days_remaining: 15,
          is_expired: false,
          days_since_expiry: 0
        };
        setContractInfo(mockContract);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_contract_info', {
        tenant_uuid: tenantId
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setContractInfo(data[0]);
      } else {
        setContractInfo(null);
      }
    } catch (err) {
      console.error('Error fetching contract info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch contract info');
    } finally {
      setLoading(false);
    }
  };

  const extendContract = async (additionalDays: number) => {
    if (!tenantId) throw new Error('Tenant ID is required');

    try {
      const { data, error } = await supabase.rpc('extend_contract', {
        tenant_uuid: tenantId,
        additional_days: additionalDays
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.message);
      }

      // Refresh contract info
      await fetchContractInfo();
      
      return data;
    } catch (err) {
      console.error('Error extending contract:', err);
      throw err;
    }
  };

  const updateContractStatus = async () => {
    try {
      const { error } = await supabase.rpc('update_contract_status');
      if (error) throw error;
      
      // Refresh contract info after update
      await fetchContractInfo();
    } catch (err) {
      console.error('Error updating contract status:', err);
      throw err;
    }
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'suspended': return 'text-yellow-600 bg-yellow-100';
      case 'trial': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getContractStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'expired': return 'Expirado';
      case 'suspended': return 'Suspenso';
      case 'trial': return 'Trial';
      default: return 'Desconhecido';
    }
  };

  const formatDaysRemaining = (days: number, isExpired: boolean) => {
    if (isExpired) {
      return `Expirado há ${days} dia${days !== 1 ? 's' : ''}`;
    }
    
    if (days === 0) {
      return 'Expira hoje';
    }
    
    if (days === 1) {
      return 'Expira amanhã';
    }
    
    return `${days} dias restantes`;
  };

  useEffect(() => {
    fetchContractInfo();
  }, [tenantId]);

  return {
    contractInfo,
    loading,
    error,
    fetchContractInfo,
    extendContract,
    updateContractStatus,
    getContractStatusColor,
    getContractStatusText,
    formatDaysRemaining,
  };
};