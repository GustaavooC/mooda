import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase environment variables. URL: ${supabaseUrl}, Key: ${!!supabaseAnonKey}`)
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          domain: string | null
          status: 'active' | 'inactive' | 'suspended' | 'trial'
          owner_id: string | null
          settings: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          domain?: string | null
          status?: 'active' | 'inactive' | 'suspended' | 'trial'
          owner_id?: string | null
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          domain?: string | null
          status?: 'active' | 'inactive' | 'suspended' | 'trial'
          owner_id?: string | null
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      tenant_users: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          role: string
          permissions: Record<string, any>
          invited_by: string | null
          invited_at: string | null
          joined_at: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          role?: string
          permissions?: Record<string, any>
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          role?: string
          permissions?: Record<string, any>
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string
          is_active?: boolean
          created_at?: string
        }
      }
      tenant_subscriptions: {
        Row: {
          id: string
          tenant_id: string
          plan: 'free' | 'basic' | 'premium' | 'enterprise'
          status: string
          price_monthly: number
          features: Record<string, any>
          limits: Record<string, any>
          trial_ends_at: string | null
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          plan?: 'free' | 'basic' | 'premium' | 'enterprise'
          status?: string
          price_monthly?: number
          features?: Record<string, any>
          limits?: Record<string, any>
          trial_ends_at?: string | null
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          plan?: 'free' | 'basic' | 'premium' | 'enterprise'
          status?: string
          price_monthly?: number
          features?: Record<string, any>
          limits?: Record<string, any>
          trial_ends_at?: string | null
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
      tenant_metrics: {
        Row: {
          id: string
          tenant_id: string
          metric_date: string
          total_products: number
          total_variations: number
          total_orders: number
          total_revenue: number
          active_customers: number
          page_views: number
          conversion_rate: number
          avg_order_value: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          metric_date?: string
          total_products?: number
          total_variations?: number
          total_orders?: number
          total_revenue?: number
          active_customers?: number
          page_views?: number
          conversion_rate?: number
          avg_order_value?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          metric_date?: string
          total_products?: number
          total_variations?: number
          total_orders?: number
          total_revenue?: number
          active_customers?: number
          page_views?: number
          conversion_rate?: number
          avg_order_value?: number
          created_at?: string
          updated_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          user_id: string
          role: string
          permissions: Record<string, any>
          is_super_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: string
          permissions?: Record<string, any>
          is_super_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          permissions?: Record<string, any>
          is_super_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      system_metrics: {
        Row: {
          id: string
          metric_date: string
          total_tenants: number
          active_tenants: number
          total_users: number
          total_revenue: number
          new_signups: number
          churn_rate: number
          mrr: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          metric_date?: string
          total_tenants?: number
          active_tenants?: number
          total_users?: number
          total_revenue?: number
          new_signups?: number
          churn_rate?: number
          mrr?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          metric_date?: string
          total_tenants?: number
          active_tenants?: number
          total_users?: number
          total_revenue?: number
          new_signups?: number
          churn_rate?: number
          mrr?: number
          created_at?: string
          updated_at?: string
        }
      }
      colors: {
        Row: {
          id: string
          name: string
          hex_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          hex_code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          hex_code?: string
          created_at?: string
        }
      }
      sizes: {
        Row: {
          id: string
          name: string
          category: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          sort_order: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          sort_order?: number
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          tenant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          tenant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          tenant_id?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category_id: string | null
          brand: string | null
          sku: string | null
          is_active: boolean
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category_id?: string | null
          brand?: string | null
          sku?: string | null
          is_active?: boolean
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category_id?: string | null
          brand?: string | null
          sku?: string | null
          is_active?: boolean
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      product_variations: {
        Row: {
          id: string
          product_id: string
          color_id: string
          size_id: string
          price: number
          promotional_price: number | null
          stock_quantity: number
          sku: string | null
          is_active: boolean
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          color_id: string
          size_id: string
          price: number
          promotional_price?: number | null
          stock_quantity: number
          sku?: string | null
          is_active?: boolean
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          color_id?: string
          size_id?: string
          price?: number
          promotional_price?: number | null
          stock_quantity?: number
          sku?: string | null
          is_active?: boolean
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          variation_id: string | null
          image_url: string
          alt_text: string | null
          sort_order: number
          is_primary: boolean
          tenant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          variation_id?: string | null
          image_url: string
          alt_text?: string | null
          sort_order: number
          is_primary?: boolean
          tenant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          variation_id?: string | null
          image_url?: string
          alt_text?: string | null
          sort_order?: number
          is_primary?: boolean
          tenant_id?: string
          created_at?: string
        }
      }
      store_customizations: {
        Row: {
          id: string
          tenant_id: string
          logo_url: string | null
          banner_main_url: string | null
          banner_profile_url: string | null
          primary_color: string
          background_color: string
          text_color: string
          accent_color: string
          font_family: string
          font_size_base: number
          layout_style: string
          template_id: string | null
          custom_css: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          logo_url?: string | null
          banner_main_url?: string | null
          banner_profile_url?: string | null
          primary_color?: string
          background_color?: string
          text_color?: string
          accent_color?: string
          font_family?: string
          font_size_base?: number
          layout_style?: string
          template_id?: string | null
          custom_css?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          logo_url?: string | null
          banner_main_url?: string | null
          banner_profile_url?: string | null
          primary_color?: string
          background_color?: string
          text_color?: string
          accent_color?: string
          font_family?: string
          font_size_base?: number
          layout_style?: string
          template_id?: string | null
          custom_css?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customization_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          preview_image_url: string | null
          config: Record<string, any>
          is_premium: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          preview_image_url?: string | null
          config: Record<string, any>
          is_premium?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          preview_image_url?: string | null
          config?: Record<string, any>
          is_premium?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      font_options: {
        Row: {
          id: string
          name: string
          family: string
          category: string
          google_font_url: string | null
          is_premium: boolean
          preview_text: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          family: string
          category: string
          google_font_url?: string | null
          is_premium?: boolean
          preview_text: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          family?: string
          category?: string
          google_font_url?: string | null
          is_premium?: boolean
          preview_text?: string
          created_at?: string
        }
      }
      customization_history: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          action_type: string
          changes: Record<string, any>
          previous_config: Record<string, any> | null
          new_config: Record<string, any> | null
          template_used: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          action_type: string
          changes: Record<string, any>
          previous_config?: Record<string, any> | null
          new_config?: Record<string, any> | null
          template_used?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string | null
          action_type?: string
          changes?: Record<string, any>
          previous_config?: Record<string, any> | null
          new_config?: Record<string, any> | null
          template_used?: string | null
          created_at?: string
        }
      }
    }
  }
}