import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  isAdmin?: boolean;
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
  user_metadata?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Demo credentials mapping
let DEMO_CREDENTIALS = {
  'admin@mooda.com': {
    password: 'admin123',
    user: {
      id: 'admin-user-id',
      email: 'admin@mooda.com',
      name: 'Administrador do Sistema',
      isAdmin: true,
      user_metadata: { name: 'Administrador do Sistema' }
    }
  },
  'loja@moda-bella.com': {
    password: 'loja123',
    user: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      email: 'loja@moda-bella.com',
      name: 'Maria Silva - Moda Bella',
      tenantId: '11111111-1111-1111-1111-111111111111',
      tenantSlug: 'moda-bella',
      tenantName: 'Moda Bella',
      user_metadata: { name: 'Maria Silva - Moda Bella' }
    }
  },
  'admin@tech-store-pro.com': {
    password: 'loja123',
    user: {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      email: 'admin@tech-store-pro.com',
      name: 'João Tech - Tech Store Pro',
      tenantId: '22222222-2222-2222-2222-222222222222',
      tenantSlug: 'tech-store-pro',
      tenantName: 'Tech Store Pro',
      user_metadata: { name: 'João Tech - Tech Store Pro' }
    }
  },
  'gerente@casa-decoracao.com': {
    password: 'loja123',
    user: {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      email: 'gerente@casa-decoracao.com',
      name: 'Ana Decoração - Casa & Decoração',
      tenantId: '33333333-3333-3333-3333-333333333333',
      tenantSlug: 'casa-decoracao',
      tenantName: 'Casa & Decoração',
      user_metadata: { name: 'Ana Decoração - Casa & Decoração' }
    }
  },
  'dono@esporte-total.com': {
    password: 'loja123',
    user: {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      email: 'dono@esporte-total.com',
      name: 'Carlos Esporte - Esporte Total',
      tenantId: '44444444-4444-4444-4444-444444444444',
      tenantSlug: 'esporte-total',
      tenantName: 'Esporte Total',
      user_metadata: { name: 'Carlos Esporte - Esporte Total' }
    }
  },
  'admin@beleza-natural.com': {
    password: 'loja123',
    user: {
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      email: 'admin@beleza-natural.com',
      name: 'Fernanda Beleza - Beleza Natural',
      tenantId: '55555555-5555-5555-5555-555555555555',
      tenantSlug: 'beleza-natural',
      tenantName: 'Beleza Natural',
      user_metadata: { name: 'Fernanda Beleza - Beleza Natural' }
    }
  },
  'livreiro@livraria-saber.com': {
    password: 'loja123',
    user: {
      id: '10101010-1010-1010-1010-101010101010',
      email: 'livreiro@livraria-saber.com',
      name: 'Pedro Livros - Livraria Saber',
      tenantId: '66666666-6666-6666-6666-666666666666',
      tenantSlug: 'livraria-saber',
      tenantName: 'Livraria Saber',
      user_metadata: { name: 'Pedro Livros - Livraria Saber' }
    }
  },
  'veterinario@pet-shop-amigo.com': {
    password: 'loja123',
    user: {
      id: '20202020-2020-2020-2020-202020202020',
      email: 'veterinario@pet-shop-amigo.com',
      name: 'Juliana Pet - Pet Shop Amigo',
      tenantId: '77777777-7777-7777-7777-777777777777',
      tenantSlug: 'pet-shop-amigo',
      tenantName: 'Pet Shop Amigo',
      user_metadata: { name: 'Juliana Pet - Pet Shop Amigo' }
    }
  },
  'chef@gourmet-express.com': {
    password: 'loja123',
    user: {
      id: '30303030-3030-3030-3030-303030303030',
      email: 'chef@gourmet-express.com',
      name: 'Ricardo Gourmet - Gourmet Express',
      tenantId: '88888888-8888-8888-8888-888888888888',
      tenantSlug: 'gourmet-express',
      tenantName: 'Gourmet Express',
      user_metadata: { name: 'Ricardo Gourmet - Gourmet Express' }
    }
  },
  'jardineiro@jardim-verde.com': {
    password: 'loja123',
    user: {
      id: '40404040-4040-4040-4040-404040404040',
      email: 'jardineiro@jardim-verde.com',
      name: 'Camila Verde - Jardim Verde',
      tenantId: '99999999-9999-9999-9999-999999999999',
      tenantSlug: 'jardim-verde',
      tenantName: 'Jardim Verde',
      user_metadata: { name: 'Camila Verde - Jardim Verde' }
    }
  },
  'artista@arte-craft.com': {
    password: 'loja123',
    user: {
      id: '50505050-5050-5050-5050-505050505050',
      email: 'artista@arte-craft.com',
      name: 'Lucas Arte - Arte & Craft',
      tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      tenantSlug: 'arte-craft',
      tenantName: 'Arte & Craft',
      user_metadata: { name: 'Lucas Arte - Arte & Craft' }
    }
  }
};
// Function to load dynamic credentials
const loadDynamicCredentials = () => {
  try {
    const storedCredentials = localStorage.getItem('demo_credentials');
    if (storedCredentials) {
      const dynamicCredentials = JSON.parse(storedCredentials);
      DEMO_CREDENTIALS = { ...DEMO_CREDENTIALS, ...dynamicCredentials };
    }
  } catch (error) {
    console.warn('Error loading dynamic credentials:', error);
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      
      // Load dynamic credentials first
      loadDynamicCredentials();
      
      // Check demo credentials first
      const demoCredential = DEMO_CREDENTIALS[email as keyof typeof DEMO_CREDENTIALS];
      if (demoCredential && demoCredential.password === password) {
        console.log('Demo login successful for:', email);
        setUser(demoCredential.user);
        
        // Store in localStorage for persistence
        localStorage.setItem('demo_user', JSON.stringify(demoCredential.user));
        
        return { data: { user: demoCredential.user }, error: null };
      }
      
      // If not demo credentials, try Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        throw new Error('Credenciais inválidas');
      }

      if (data.user) {
        console.log('Supabase login successful for:', email);
        
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.warn('Profile not found, creating one:', profileError);
          // Create profile if it doesn't exist
          await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name || data.user.email!.split('@')[0]
            });
        }

        // Check if user is admin
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        // Get user's tenant info
        const { data: tenantUser } = await supabase
          .from('tenant_users')
          .select(`
            *,
            tenant:tenants(*)
          `)
          .eq('user_id', data.user.id)
          .eq('is_active', true)
          .maybeSingle();

        console.log('Tenant user data:', tenantUser);
        console.log('Admin user data:', adminUser);

        const userData = {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.name || data.user.user_metadata?.name || data.user.email!.split('@')[0],
          avatar_url: profile?.avatar_url || data.user.user_metadata?.avatar_url,
          isAdmin: !!adminUser,
          tenantId: tenantUser?.tenant?.id,
          tenantSlug: tenantUser?.tenant?.slug,
          tenantName: tenantUser?.tenant?.name,
          user_metadata: data.user.user_metadata
        };
        
        console.log('Final user data:', userData);
        setUser(userData);
        return { data, error: null };
      }
      
      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return { data: null, error };

    if (data.user) {
      // Create user profile
      await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          name,
        });
    }
    
    return { data, error: null };
  };

  const signOut = async () => {
    // Clear demo user from localStorage
    localStorage.removeItem('demo_user');
    
    // Also try to sign out from Supabase
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Supabase signout error (expected for demo users):', error);
    }
    
    setUser(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Load dynamic credentials
        loadDynamicCredentials();
        
        // Check for demo user in localStorage first
        const demoUser = localStorage.getItem('demo_user');
        if (demoUser) {
          const userData = JSON.parse(demoUser);
          console.log('Restored demo user from localStorage:', userData.email);
          setUser(userData);
          setLoading(false);
          return;
        }
        
        // Get initial session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch user profile and set user state
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // Check if user is admin
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          // Get user's tenant info
          const { data: tenantUser } = await supabase
            .from('tenant_users')
            .select(`
              *,
              tenant:tenants(*)
            `)
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single();

          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name,
            avatar_url: profile?.avatar_url,
            isAdmin: !!adminUser,
            tenantId: tenantUser?.tenant?.id,
            tenantSlug: tenantUser?.tenant?.slug,
            tenantName: tenantUser?.tenant?.name,
            user_metadata: session.user.user_metadata
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
      setLoading(false);
    };
    
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      // Skip auth state changes for demo users
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        return;
      }
      
      if (session?.user) {
        // Fetch user profile and set user state
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Check if user is admin
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        // Get user's tenant info
        const { data: tenantUser } = await supabase
          .from('tenant_users')
          .select(`
            *,
            tenant:tenants(*)
          `)
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: profile?.name,
          avatar_url: profile?.avatar_url,
          isAdmin: !!adminUser,
          tenantId: tenantUser?.tenant?.id,
          tenantSlug: tenantUser?.tenant?.slug,
          tenantName: tenantUser?.tenant?.name,
          user_metadata: session.user.user_metadata
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};