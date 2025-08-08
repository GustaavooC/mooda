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
  user_metadata?: Record<string, unknown>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: unknown; error: unknown }>;
  signUp: (
    email: string,
    password: string,
    metadata?: { name?: string; store_name?: string; store_slug?: string }
  ) => Promise<{ data: unknown; error: unknown }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Demo credentials mapping
let DEMO_CREDENTIALS = {};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to load and merge all credentials
  const loadAllCredentials = () => {
    try {
      const storedCredentials = localStorage.getItem('demo_credentials');
      if (storedCredentials) {
        const dynamicCredentials = JSON.parse(storedCredentials);
        console.log('Loading dynamic credentials:', Object.keys(dynamicCredentials));
        return { ...DEMO_CREDENTIALS, ...dynamicCredentials };
      }
    } catch (error) {
      console.warn('Error loading dynamic credentials:', error);
    }
    return DEMO_CREDENTIALS;
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ data: unknown; error: unknown }> => {
    try {
      console.log('Attempting sign in for:', email);
      
      // Load all credentials (static + dynamic)
      const allCredentials = loadAllCredentials();
      console.log('Available credentials:', Object.keys(allCredentials));
      
      // Check demo credentials first
      const demoCredential = allCredentials[email as keyof typeof allCredentials];
      console.log('Found credential for', email, ':', !!demoCredential);
      
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

  const signUp = async (
    email: string,
    password: string,
    metadata: { name?: string; store_name?: string; store_slug?: string } = {}
  ): Promise<{ data: unknown; error: unknown }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: metadata.name }
        }
      });

      if (error) return { data: null, error };

      if (data.user) {
        // Create user profile
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          name: metadata.name || data.user.email!.split('@')[0]
        });

        // Create tenant and link user if store info provided
        if (metadata.store_name && metadata.store_slug) {
          const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({
              name: metadata.store_name,
              slug: metadata.store_slug,
              status: 'active',
              owner_id: data.user.id,
              settings: {}
            })
            .select()
            .single();

          if (!tenantError && tenant) {
            await supabase.from('tenant_users').insert({
              tenant_id: tenant.id,
              user_id: data.user.id,
              role: 'owner',
              is_active: true
            });

            // Create default store customization
            await supabase.from('store_customizations').insert({
              tenant_id: tenant.id,
              primary_color: '#3B82F6',
              background_color: '#FFFFFF',
              text_color: '#1F2937',
              accent_color: '#EFF6FF',
              font_family: 'Inter',
              font_size_base: 16,
              layout_style: 'modern'
            });
          }
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
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
        // Load all credentials at startup
        const allCredentials = loadAllCredentials();
        console.log('Initialized with credentials:', Object.keys(allCredentials));
        
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