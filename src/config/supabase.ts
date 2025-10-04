import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase configuration missing. Database features will be disabled.'
  )
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth0_id: string
          email: string
          name: string | null
          picture: string | null
          subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth0_id: string
          email: string
          name?: string | null
          picture?: string | null
          subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth0_id?: string
          email?: string
          name?: string | null
          picture?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          status: string
          price_id: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          status: string
          price_id: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          status?: string
          price_id?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          updated_at?: string
        }
      }
    }
  }
}
