import { useState, useMemo } from 'react';
import { useAppStore } from '../../store';
import { parseLocalDate } from '../../lib/format';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Trash2, Edit2, ArrowUpDown } from 'lucide-react';
import type { Expense } from '../../store/types';

interface ExpenseTableProps {
  onEdit: (expense: Expense) => void;
}

export function ExpenseTable({ onEdit }: ExpenseTableProps) {
  const expenses = useAppStore(s => s.expenses);
  const categories = useAppStore(s => s.categories);
  const deleteExpense = useAppStore(s => s.deleteExpense);

  const [sortField, setSortField] = useState<'date' | 'vendor' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const toggleSort = (field: 'date' | 'vendor' | 'amount') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Filter by Category
    if (filterCategoryId !== 'all') {
      result = result.filter(e => e.category_id === filterCategoryId);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'vendor') {
        comparison = a.vendor.localeCompare(b.vendor);
      } else if (sortField === 'amount') {
        comparison = Number(a.amount) - Number(b.amount);
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [expenses, sortField, sortOrder, filterCategoryId]);

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--color-surface)] p-3 border-[var(--border-default)] rounded-[var(--border-radius)]">
        <div className="flex items-center gap-2">
          <label 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs font-bold uppercase text-[var(--color-ink)]"
          >
            FILTER_CATEGORY:
          </label>
          <select
            value={filterCategoryId}
            onChange={e => setFilterCategoryId(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)' }}
            className="px-3 py-1.5 border-[var(--border-default)] rounded-[var(--border-radius)] bg-[var(--color-surface)] text-xs font-bold uppercase text-[var(--color-ink)] outline-none focus:shadow-[var(--shadow-btn-active)]"
          >
            <option value="all">ALL_CATEGORIES</option>
            <option value="">UNCATEGORIZED</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)' }} className="text-xs font-bold uppercase text-[var(--color-ink-muted)]">
          {filteredExpenses.length} RECORD(S) FOUND
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto border-2 border-black dark:border-white rounded-[12px] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-[var(--border-default)] bg-[var(--color-surface)]">
              <th 
                onClick={() => toggleSort('date')}
                style={{ fontFamily: 'var(--font-display)' }} 
                className="text-left p-2 sm:p-3.5 text-[10px] sm:text-xs font-extrabold uppercase text-[var(--color-ink)] cursor-pointer select-none hover:bg-[rgba(0,0,0,0.03)] whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  DATE
                  <ArrowUpDown className="h-3 w-3 text-[var(--color-ink-muted)] shrink-0" />
                </div>
              </th>
              <th 
                onClick={() => toggleSort('vendor')}
                style={{ fontFamily: 'var(--font-display)' }} 
                className="text-left p-2 sm:p-3.5 text-[10px] sm:text-xs font-extrabold uppercase text-[var(--color-ink)] cursor-pointer select-none hover:bg-[rgba(0,0,0,0.03)] whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  VENDOR
                  <ArrowUpDown className="h-3 w-3 text-[var(--color-ink-muted)] shrink-0" />
                </div>
              </th>
              <th style={{ fontFamily: 'var(--font-display)' }} className="text-left p-2 sm:p-3.5 text-[10px] sm:text-xs font-extrabold uppercase text-[var(--color-ink-muted)] whitespace-nowrap">CATEGORY</th>
              <th style={{ fontFamily: 'var(--font-display)' }} className="text-left p-2 sm:p-3.5 text-[10px] sm:text-xs font-extrabold uppercase text-[var(--color-ink-muted)] whitespace-nowrap hidden md:table-cell">NOTE</th>
              <th 
                onClick={() => toggleSort('amount')}
                style={{ fontFamily: 'var(--font-display)' }} 
                className="text-right p-2 sm:p-3.5 text-[10px] sm:text-xs font-extrabold uppercase text-[var(--color-ink)] cursor-pointer select-none hover:bg-[rgba(0,0,0,0.03)] whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  AMOUNT
                  <ArrowUpDown className="h-3 w-3 text-[var(--color-ink-muted)] shrink-0" />
                </div>
              </th>
              <th className="p-2 sm:p-3.5 w-[60px] sm:w-[80px]"></th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td 
                  colSpan={6} 
                  style={{ fontFamily: 'var(--font-mono)' }} 
                  className="py-12 text-center text-xs text-[var(--color-ink-muted)] uppercase"
                >
                  No transaction records found.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => {
                const cat = categories.find(c => c.id === exp.category_id);
                const categoryName = cat?.name || 'Uncategorized';

                return (
                  <tr key={exp.id} className="border-b border-[var(--color-ink-muted)] border-opacity-20 hover:bg-[rgba(0,0,0,0.015)] transition-colors duration-100">
                    <td style={{ fontFamily: 'var(--font-mono)' }} className="p-2 sm:p-3.5 text-[10px] sm:text-xs font-bold whitespace-nowrap">{parseLocalDate(exp.date).toLocaleDateString()}</td>
                    <td style={{ fontFamily: 'var(--font-display)' }} className="p-2 sm:p-3.5 text-[10px] sm:text-xs font-extrabold uppercase text-[var(--color-ink)] whitespace-nowrap truncate max-w-[100px] sm:max-w-none">{exp.vendor}</td>
                    <td style={{ fontFamily: 'var(--font-display)' }} className="p-2 sm:p-3.5 text-[10px] sm:text-xs font-semibold uppercase text-[var(--color-ink-muted)] whitespace-nowrap">{categoryName}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }} className="p-2 sm:p-3.5 text-[10px] sm:text-xs text-[var(--color-ink-muted)] max-w-[120px] sm:max-w-[180px] truncate hidden md:table-cell">{exp.note || '-'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }} className="p-2 sm:p-3.5 text-[10px] sm:text-xs font-bold text-right text-[var(--color-ink)] whitespace-nowrap">{formatNaira(Number(exp.amount))}</td>
                    <td className="p-2 sm:p-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => onEdit(exp)}
                          className="p-1 hover:bg-[rgba(0,0,0,0.05)] border border-transparent rounded transition-all duration-100"
                          title="Edit transaction"
                        >
                          <Edit2 className="h-3 w-3 text-[var(--color-ink)]" />
                        </button>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <button 
                              className="p-1 hover:bg-[rgba(255,68,68,0.1)] border border-transparent rounded transition-all duration-100"
                              title="Delete transaction"
                            >
                              <Trash2 className="h-3 w-3 text-[var(--color-danger)]" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 border-[var(--border-default)] rounded-[var(--border-radius)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-4" align="end">
                            <div className="space-y-3">
                              <h4 style={{ fontFamily: 'var(--font-display)' }} className="font-extrabold text-xs uppercase text-[var(--color-ink)]">DELETE_RECORD?</h4>
                              <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-[var(--color-ink-muted)] leading-relaxed uppercase">This action cannot be undone.</p>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  onClick={() => deleteExpense(exp.id).catch(console.error)}
                                  style={{ fontFamily: 'var(--font-display)' }}
                                  className="px-3 py-1.5 bg-[var(--color-danger)] text-white border-[var(--border-default)] rounded-[var(--border-radius)] font-bold text-[10px] uppercase shadow-[var(--shadow-btn-active)]"
                                >
                                  DELETE
                                </button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
