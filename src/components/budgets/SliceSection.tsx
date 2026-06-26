import type { Category, Slice } from '../../store/types';
import { CategoryCard } from './CategoryCard';

interface SliceSectionProps {
  slice: Slice;
  categories: Category[];
  categorySpends: { [id: string]: number };
  onEditCategory: (cat: Category) => void;
}

export function SliceSection({ slice, categories, categorySpends, onEditCategory }: SliceSectionProps) {
  const sliceCategories = categories.filter(c => c.slice === slice);

  if (sliceCategories.length === 0) return null;

  const getSliceTitle = () => {
    if (!slice) return '';
    switch (slice) {
      case 'Basic':
        return 'BASIC_NEEDS (ESSENTIALS)';
      case 'Family':
        return 'FAMILY_&_HOUSEHOLD';
      case 'Wealth':
        return 'WEALTH_BUILDING (SAVINGS/INVEST)';
      case 'Subscription':
        return 'SUBSCRIPTIONS_&_MEMBERSHIPS';
      default:
        return String(slice).replace('_', ' ').toUpperCase();
    }
  };

  return (
    <div className="space-y-4">
      <h3 
        style={{ fontFamily: 'var(--font-display)' }}
        className="text-sm font-extrabold uppercase tracking-widest text-[var(--color-ink-muted)] border-b border-[var(--color-ink)] border-opacity-10 pb-1"
      >
        {getSliceTitle()}
      </h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sliceCategories.map(cat => (
          <CategoryCard 
            key={cat.id} 
            category={cat} 
            spent={categorySpends[cat.id] || 0} 
            onEdit={onEditCategory} 
          />
        ))}
      </div>
    </div>
  );
}
