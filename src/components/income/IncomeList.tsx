import { useState } from 'react';
import { useAppStore } from '../../store';
import { parseLocalDate } from '../../lib/format';
import { BentoCard } from '../shared/BentoCard';
import { IncomeForm } from './IncomeForm';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Trash2, Edit2, Plus } from 'lucide-react';
import type { Income } from '../../store/types';

export function IncomeList() {
  const incomes = useAppStore(s => s.incomes);
  const deleteIncome = useAppStore(s => s.deleteIncome);

  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingIncome(null);
    setFormOpen(true);
  };

  return (
    <BentoCard hoverEffect={false} className="w-full dark:bg-[#1A1A1A] dark:border-white dark:border-4 dark:shadow-[4px_4px_0px_0px_#FFFFFF]">
      <div className="flex justify-between items-center pb-4 border-b border-[var(--color-ink)] border-dashed mb-4">
        <h3 
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-lg font-extrabold uppercase tracking-wide text-[var(--color-ink)]"
        >
          INCOME_STREAMS
        </h3>
        <button
          onClick={handleAdd}
          style={{ fontFamily: 'var(--font-display)' }}
          className="px-3 py-1.5 bg-[var(--color-brand-primary)] text-[#000000] border-[var(--border-default)] rounded-[var(--border-radius)] shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] font-bold text-xs uppercase transition-all duration-100 flex items-center gap-1.5"
        >
          <Plus className="h-3 w-3" />
          ADD_INCOME
        </button>
      </div>

      {incomes.length === 0 ? (
        <div 
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-xs text-[var(--color-ink-muted)] py-12 text-center uppercase"
        >
          No incomes recorded. Click ADD_INCOME to add one.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-[var(--border-default)]">
                <th style={{ fontFamily: 'var(--font-display)' }} className="text-left py-2 text-xs font-extrabold uppercase text-[var(--color-ink-muted)]">DATE</th>
                <th style={{ fontFamily: 'var(--font-display)' }} className="text-left py-2 text-xs font-extrabold uppercase text-[var(--color-ink-muted)]">SOURCE</th>
                <th style={{ fontFamily: 'var(--font-display)' }} className="text-left py-2 text-xs font-extrabold uppercase text-[var(--color-ink-muted)]">NOTE</th>
                <th style={{ fontFamily: 'var(--font-display)' }} className="text-right py-2 text-xs font-extrabold uppercase text-[var(--color-ink-muted)]">AMOUNT</th>
                <th className="py-2 w-[80px]"></th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((inc) => (
                <tr key={inc.id} className="border-b border-[var(--color-ink-muted)] border-opacity-20 hover:bg-[rgba(0,0,0,0.02)] transition-colors duration-100">
                  <td style={{ fontFamily: 'var(--font-mono)' }} className="py-3 text-xs font-bold">{parseLocalDate(inc.date).toLocaleDateString()}</td>
                  <td style={{ fontFamily: 'var(--font-display)' }} className="py-3 text-xs font-extrabold uppercase">{inc.source}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }} className="py-3 text-xs text-[var(--color-ink-muted)] truncate max-w-[150px]">{inc.note || '-'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }} className="py-3 text-xs font-bold text-right">{formatNaira(Number(inc.amount))}</td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => handleEdit(inc)}
                        className="p-1 hover:bg-[rgba(0,0,0,0.05)] border border-transparent rounded transition-all duration-100"
                        title="Edit log"
                      >
                        <Edit2 className="h-3 w-3 text-[var(--color-ink)]" />
                      </button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button 
                            className="p-1 hover:bg-[rgba(255,68,68,0.1)] border border-transparent rounded transition-all duration-100"
                            title="Delete log"
                          >
                            <Trash2 className="h-3 w-3 text-[var(--color-danger)]" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 border-[var(--border-default)] dark:border-white rounded-[var(--border-radius)] bg-[var(--color-surface)] dark:bg-[#1A1A1A] shadow-[var(--shadow-card)] dark:shadow-[4px_4px_0px_0px_#FFFFFF] p-4" align="end">
                          <div className="space-y-3">
                            <h4 style={{ fontFamily: 'var(--font-display)' }} className="font-extrabold text-xs uppercase text-[var(--color-ink)]">DELETE_INCOME?</h4>
                            <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-[var(--color-ink-muted)] leading-relaxed uppercase">This action cannot be undone.</p>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={() => deleteIncome(inc.id).catch(console.error)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      <IncomeForm 
        open={formOpen}
        onOpenChange={setFormOpen}
        income={editingIncome}
      />
    </BentoCard>
  );
}
