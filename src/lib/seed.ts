export const SEED_CATEGORIES_SALARY = [
  { name: 'Housing / Rent',       icon: 'Home',           slice: 'Basic',   budget_limit: 150000, is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Feeding / Groceries',  icon: 'UtensilsCrossed',slice: 'Basic',   budget_limit: 80000,  is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Transport / Fuel',     icon: 'Car',            slice: 'Basic',   budget_limit: 50000,  is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Utilities / Internet', icon: 'Zap',            slice: 'Basic',   budget_limit: 30000,  is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Savings / Emergency',  icon: 'TrendingUp',     slice: 'Wealth',  budget_limit: 50000,  is_basic: false, is_priority: false, is_subscription: false },
] as const;

export const SEED_CATEGORIES_BUSINESS = [
  { name: 'Business Inventory',   icon: 'Package',        slice: 'Side_Hustle', budget_limit: 200000, is_basic: false, is_priority: false, is_subscription: false },
  { name: 'Logistics / Waybill',  icon: 'Truck',          slice: 'Side_Hustle', budget_limit: 70000,  is_basic: false, is_priority: false, is_subscription: false },
  { name: 'Marketing / Ads',      icon: 'Megaphone',      slice: 'Side_Hustle', budget_limit: 40000,  is_basic: false, is_priority: false, is_subscription: false },
  { name: 'Personal Welfare',     icon: 'Heart',          slice: 'Family',      budget_limit: 60000,  is_basic: false, is_priority: false, is_subscription: false },
] as const;

export const SEED_CATEGORIES_STUDENT = [
  { name: 'Food / Provisions',       icon: 'UtensilsCrossed', slice: 'Basic',     budget_limit: 25000, is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Handouts / Books',        icon: 'BookOpen',        slice: 'Family',    budget_limit: 15000, is_basic: false, is_priority: false, is_subscription: false },
  { name: 'Transport / Campus Run',  icon: 'Car',             slice: 'Basic',     budget_limit: 10000, is_basic: true,  is_priority: false, is_subscription: false },
  { name: 'Chop Life / Flexing',     icon: 'Sparkles',        slice: 'Chop_Life', budget_limit: 15000, is_basic: false, is_priority: false, is_subscription: false },
] as const;

export function applyPriorityFlags(
  cats: Array<{ slice: string; is_basic: boolean; name: string; [key: string]: any }>,
  purpose: string
) {
  return cats.map(c => ({
    ...c,
    is_priority:
      (purpose === 'saving'  && c.slice === 'Wealth') ||
      (purpose === 'habit'   && (c.slice === 'Subscription' || c.name === 'Other')) ||
      (purpose === 'clarity' && c.is_basic),
  }));
}
