export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          occupation: string
          monthly_salary: number
          avatar_initials: string
          purpose: 'clarity' | 'saving' | 'habit'
          target_savings_rate: 15 | 20 | 30 | 40 | null
          has_completed_onboarding: boolean
          theme: 'light' | 'dark'
          has_seen_investment_nudge: boolean
          created_at: string
          updated_at: string
           is_premium: boolean | null
          has_supported_creator: boolean | null
          financial_streak: number | null
          last_logged_date: string | null
        }
        Insert: {
          id: string
          name?: string
          occupation?: string
          monthly_salary?: number
          avatar_initials?: string
          purpose?: 'clarity' | 'saving' | 'habit'
          target_savings_rate?: 15 | 20 | 30 | 40 | null
          has_completed_onboarding?: boolean
          theme?: 'light' | 'dark'
          has_seen_investment_nudge?: boolean
          created_at?: string
          updated_at?: string
          is_premium?: boolean | null
          has_supported_creator?: boolean | null
          financial_streak?: number | null
          last_logged_date?: string | null
        }
        Update: {
          id?: string
          name?: string
          occupation?: string
          monthly_salary?: number
          avatar_initials?: string
          purpose?: 'clarity' | 'saving' | 'habit'
          target_savings_rate?: 15 | 20 | 30 | 40 | null
          has_completed_onboarding?: boolean
          theme?: 'light' | 'dark'
          has_seen_investment_nudge?: boolean
          created_at?: string
          updated_at?: string
          is_premium?: boolean | null
          has_supported_creator?: boolean | null
          financial_streak?: number | null
          last_logged_date?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          slice: 'Basic' | 'Family' | 'Wealth' | 'Subscription'
          budget_limit: number
          is_basic: boolean
          is_priority: boolean
          is_subscription: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string
          slice?: 'Basic' | 'Family' | 'Wealth' | 'Subscription'
          budget_limit?: number
          is_basic?: boolean
          is_priority?: boolean
          is_subscription?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string
          slice?: 'Basic' | 'Family' | 'Wealth' | 'Subscription'
          budget_limit?: number
          is_basic?: boolean
          is_priority?: boolean
          is_subscription?: boolean
          created_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          date: string
          vendor: string
          amount: number
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          date: string
          vendor: string
          amount: number
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          date?: string
          vendor?: string
          amount?: number
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          id: string
          user_id: string
          source: 'Salary' | 'Business' | 'Gifting'
          amount: number
          date: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source?: 'Salary' | 'Business' | 'Gifting'
          amount: number
          date: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source?: 'Salary' | 'Business' | 'Gifting'
          amount?: number
          date?: string
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      investment_interests: {
        Row: {
          id: string
          user_id: string
          type: 'Stocks' | 'Mutual Funds' | 'ETFs'
          wealth_balance_at_click: number
          clicked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'Stocks' | 'Mutual Funds' | 'ETFs'
          wealth_balance_at_click?: number
          clicked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'Stocks' | 'Mutual Funds' | 'ETFs'
          wealth_balance_at_click?: number
          clicked_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
