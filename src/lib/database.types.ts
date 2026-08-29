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
          premium_expires_at: string | null
          premium_plan: string | null
          notification_style: string | null
          has_supported_creator: boolean | null
          financial_streak: number | null
          last_logged_date: string | null
          enabled_slices: string[] | null
          estimated_monthly_salary: number | null
          income_type: 'salary' | 'business' | 'student' | 'WEEKEND_SHIFT' | 'FLUID_ROLLING' | null
          anchor_day: number | null
          fluid_window_days: number | null
          last_reset_date: string | null
          current_streak: number | null
          max_streak_this_month: number | null
          last_tracked_date: string | null
          tip_dismissed_permanently?: boolean
          tip_last_shown_at?: string | null
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
          premium_expires_at?: string | null
          premium_plan?: string | null
          notification_style?: string | null
          has_supported_creator?: boolean | null
          financial_streak?: number | null
          last_logged_date?: string | null
          enabled_slices?: string[] | null
          estimated_monthly_salary?: number | null
          income_type?: 'salary' | 'business' | 'student' | 'WEEKEND_SHIFT' | 'FLUID_ROLLING' | null
          anchor_day?: number | null
          fluid_window_days?: number | null
          last_reset_date?: string | null
          current_streak?: number | null
          max_streak_this_month?: number | null
          last_tracked_date?: string | null
          tip_dismissed_permanently?: boolean | null
          tip_last_shown_at?: string | null
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
          premium_expires_at?: string | null
          premium_plan?: string | null
          notification_style?: string | null
          has_supported_creator?: boolean | null
          financial_streak?: number | null
          last_logged_date?: string | null
          enabled_slices?: string[] | null
          estimated_monthly_salary?: number | null
          income_type?: 'salary' | 'business' | 'student' | 'WEEKEND_SHIFT' | 'FLUID_ROLLING' | null
          anchor_day?: number | null
          fluid_window_days?: number | null
          last_reset_date?: string | null
          current_streak?: number | null
          max_streak_this_month?: number | null
          last_tracked_date?: string | null
          tip_dismissed_permanently?: boolean | null
          tip_last_shown_at?: string | null
        }
        Relationships: []
      }
      budget_slices: {
        Row: {
          id: string
          user_id: string
          slice_name: string
          slice_type: string
          allocated_percentage: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          slice_name: string
          slice_type: string
          allocated_percentage: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          slice_name?: string
          slice_type?: string
          allocated_percentage?: number
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          slice: string
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
          slice?: string
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
          slice?: string
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
      monthly_snapshots: {
        Row: {
          id: string
          user_id: string
          month_year: string
          total_income: number
          total_expense: number
          savings_rate: number
          top_category: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month_year: string
          total_income: number
          total_expense: number
          savings_rate: number
          top_category: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month_year?: string
          total_income?: number
          total_expense?: number
          savings_rate?: number
          top_category?: string
          created_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          token: string
          device_hint: string | null
          last_seen: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          device_hint?: string | null
          last_seen?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          device_hint?: string | null
          last_seen?: string | null
          created_at?: string
        }
        Relationships: []
      }
      squads: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code?: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      squad_members: {
        Row: {
          id: string
          squad_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          squad_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          squad_id?: string
          user_id?: string
          joined_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      join_squad_by_code: {
        Args: {
          p_invite_code: string
        }
        Returns: Database['public']['Tables']['squads']['Row']
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
