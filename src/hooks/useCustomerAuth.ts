import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  phone?: string;
  address?: any;
}

export const useCustomerAuth = (tenantId?: string) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if customer is logged in (using localStorage for demo)
    const checkCustomerAuth = () => {
      if (!tenantId) {
        setLoading(false);
        return;
      }

      const customerData = localStorage.getItem(`customer_${tenantId}`);
      if (customerData) {
        try {
          const parsedCustomer = JSON.parse(customerData);
          setCustomer(parsedCustomer);
        } catch (error) {
          console.error('Error parsing customer data:', error);
          localStorage.removeItem(`customer_${tenantId}`);
        }
      }
      setLoading(false);
    };

    checkCustomerAuth();
  }, [tenantId]);

  const signIn = async (email: string, password: string) => {
    if (!tenantId) throw new Error('Tenant ID is required');

    try {
      console.log('Attempting sign in for:', { email, tenantId });

      // Para usuários demo, simular autenticação
      if (tenantId.includes('-') && tenantId.length === 36) {
        // Simular delay de autenticação
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockCustomer = {
          id: `demo-customer-${Date.now()}`,
          tenant_id: tenantId,
          email: email,
          name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          phone: '(11) 99999-9999'
        };
        
        // Store customer data in localStorage
        localStorage.setItem(`customer_${tenantId}`, JSON.stringify(mockCustomer));
        setCustomer(mockCustomer);
        
        return { data: mockCustomer, error: null };
      }

      // Usar a função RPC para verificar se customer existe
      const { data: customerData, error } = await supabase
        .rpc('check_customer_exists', {
          p_tenant_id: tenantId,
          p_email: email
        });

      console.log('Customer check result:', { customerData, error });

      if (error) {
        console.error('Error checking customer:', error);
        throw error;
      }

      if (!customerData || customerData.length === 0) {
        throw new Error('Cliente não encontrado. Verifique seu e-mail ou crie uma conta.');
      }

      const customer = customerData[0];
      const customerObj = {
        id: customer.customer_id,
        tenant_id: tenantId,
        email: customer.customer_email,
        name: customer.customer_name,
        phone: customer.customer_phone
      };

      // Store customer data in localStorage
      localStorage.setItem(`customer_${tenantId}`, JSON.stringify(customerObj));
      setCustomer(customerObj);

      return { data: customerObj, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  const signUp = async (customerData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }) => {
    if (!tenantId) throw new Error('Tenant ID is required');

    try {
      console.log('Attempting sign up for:', { 
        email: customerData.email, 
        name: customerData.name,
        tenantId 
      });

      // Para usuários demo, simular criação de conta
      if (tenantId.includes('-') && tenantId.length === 36) {
        // Simular delay de criação
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newCustomer = {
          id: `demo-customer-${Date.now()}`,
          tenant_id: tenantId,
          email: customerData.email,
          name: customerData.name,
          phone: customerData.phone || ''
        };
        
        // Store customer data in localStorage
        localStorage.setItem(`customer_${tenantId}`, JSON.stringify(newCustomer));
        setCustomer(newCustomer);
        
        return { data: newCustomer, error: null };
      }

      // Usar a função RPC para criar customer com validação
      const { data: result, error } = await supabase
        .rpc('create_customer_safe', {
          p_tenant_id: tenantId,
          p_email: customerData.email,
          p_name: customerData.name,
          p_phone: customerData.phone || null
        });

      console.log('Customer creation result:', { result, error });

      if (error) {
        console.error('Error creating customer:', error);
        throw error;
      }

      if (!result || result.length === 0) {
        throw new Error('Erro ao criar conta. Tente novamente.');
      }

      const customerResult = result[0];
      
      if (!customerResult.created) {
        throw new Error('Este e-mail já está cadastrado. Faça login ou use outro e-mail.');
      }

      const newCustomer = {
        id: customerResult.customer_id,
        tenant_id: tenantId,
        email: customerResult.customer_email,
        name: customerResult.customer_name,
        phone: customerResult.customer_phone
      };

      // Store customer data in localStorage
      localStorage.setItem(`customer_${tenantId}`, JSON.stringify(newCustomer));
      setCustomer(newCustomer);

      return { data: newCustomer, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  const signOut = () => {
    if (tenantId) {
      localStorage.removeItem(`customer_${tenantId}`);
    }
    setCustomer(null);
  };

  const isAuthenticated = !!customer;

  return {
    customer,
    loading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
  };
};