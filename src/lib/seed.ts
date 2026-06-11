// Column names match Supabase snake_case schema
export const SEED_CATEGORIES = [
  { name: 'Food & Dining',    icon: 'UtensilsCrossed', slice: 'Basic',        budget_limit: 50000,  is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Transport',        icon: 'Car',             slice: 'Basic',        budget_limit: 30000,  is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Health',           icon: 'HeartPulse',      slice: 'Basic',        budget_limit: 20000,  is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Utilities',        icon: 'Zap',             slice: 'Basic',        budget_limit: 25000,  is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Shopping',         icon: 'ShoppingBag',     slice: 'Family',       budget_limit: 40000,  is_basic: false, is_priority: false, is_subscription: false },
  { name: 'Education',        icon: 'GraduationCap',   slice: 'Family',       budget_limit: 30000,  is_basic: false, is_priority: false, is_subscription: false },
  { name: 'Savings & Invest', icon: 'TrendingUp',      slice: 'Wealth',       budget_limit: 100000, is_basic: false, is_priority: false, is_subscription: false },
  { name: 'Netflix',          icon: 'Tv',              slice: 'Subscription', budget_limit: 5000,   is_basic: false, is_priority: false, is_subscription: true  },
  { name: 'DSTV',             icon: 'Tv',              slice: 'Subscription', budget_limit: 10000,  is_basic: false, is_priority: false, is_subscription: true  },
  { name: 'GOTV',             icon: 'Tv',              slice: 'Subscription', budget_limit: 4000,   is_basic: false, is_priority: false, is_subscription: true  },
  { name: 'MTN Data',         icon: 'Wifi',            slice: 'Subscription', budget_limit: 6000,   is_basic: false, is_priority: false, is_subscription: true  },
  { name: 'Airtel Data',      icon: 'Wifi',            slice: 'Subscription', budget_limit: 6000,   is_basic: false, is_priority: false, is_subscription: true  },
  { name: 'Spotify',          icon: 'Music',           slice: 'Subscription', budget_limit: 3000,   is_basic: false, is_priority: false, is_subscription: true  },
  { name: 'Other',            icon: 'MoreHorizontal',  slice: 'Family',       budget_limit: 10000,  is_basic: false, is_priority: false, is_subscription: false },
] as const;

export function applyPriorityFlags<T extends { name: string; slice: string; is_basic: boolean }>(cats: readonly T[], purpose: string): (T & { is_priority: boolean })[] {
  return cats.map(c => ({
    ...c,
    is_priority:
      (purpose === 'saving'  && c.slice === 'Wealth') ||
      (purpose === 'habit'   && (c.slice === 'Subscription' || c.name === 'Other')) ||
      (purpose === 'clarity' && c.is_basic),
  }));
}
