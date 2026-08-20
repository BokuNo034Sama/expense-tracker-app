import { useState, useMemo } from 'react';
import { useAppStore } from '../../store';
import { useSliceSummary } from '../../hooks/useSliceSummary';
import { PremiumGate } from '../premium/PremiumGate';

export function WhatIfSimulator() {
  const categories   = useAppStore(s => s.categories);
  const sliceSummary = useSliceSummary();
  const [amount,      setAmount]      = useState('');
  const [categoryId,  setCategoryId]  = useState('');

  const projection = useMemo(() => {
    if (!amount || !categoryId) return null;
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) return null;

    const cat = categories.find(c => c.id === categoryId);
    if (!cat?.slice) return null;

    const sliceData = sliceSummary[cat.slice] || { totalSpent: 0, totalLimit: 0, progressPct: 0 };
    const newSpent  = sliceData.totalSpent + amtNum;
    const newPct    = sliceData.totalLimit > 0
      ? (newSpent / sliceData.totalLimit) * 100
      : 0;
    const remaining = sliceData.totalLimit - newSpent;
    const overBudget = newSpent > sliceData.totalLimit;

    return { cat, sliceData, newSpent, newPct, remaining, overBudget };
  }, [amount, categoryId, categories, sliceSummary]);

  return (
    <PremiumGate
      feature="What-If Simulator"
      description="Test a spend before you commit to it"
    >
      <div className="bg-[var(--color-surface)] dark:bg-zinc-800 border-2 border-[var(--color-ink)] dark:border-white rounded-[var(--border-radius)] p-4">
        <p
          style={{ fontFamily: 'var(--font-mono)' }}
          className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)] dark:text-white mb-4"
        >
          ⚡ WHAT_IF_SIMULATOR
        </p>

        <div className="space-y-3">
          <div>
            <label style={{ fontFamily: 'var(--font-mono)' }}
                   className="block text-[10px] font-bold uppercase mb-1 text-[var(--color-ink)] dark:text-white">
              IF_I_SPEND (₦)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
              className="w-full px-3 py-2.5 bg-[var(--color-surface)] dark:bg-zinc-900 border-2 border-[var(--color-ink)] dark:border-white text-[var(--color-ink)] dark:text-white rounded-[var(--border-radius)] text-sm outline-none"
            />
          </div>

          <div>
            <label style={{ fontFamily: 'var(--font-mono)' }}
                   className="block text-[10px] font-bold uppercase mb-1 text-[var(--color-ink)] dark:text-white">
              ON_CATEGORY
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
              className="w-full px-3 py-2.5 bg-[var(--color-surface)] dark:bg-zinc-900 border-2 border-[var(--color-ink)] dark:border-white text-[var(--color-ink)] dark:text-white rounded-[var(--border-radius)] text-xs font-bold uppercase outline-none"
            >
              <option value="">SELECT_CATEGORY</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name.toUpperCase()} ({c.slice})
                </option>
              ))}
            </select>
          </div>
        </div>

        {projection && (
          <div className={`mt-4 p-3 border-2 rounded-[var(--border-radius)] ${
            projection.overBudget
              ? 'border-red-500 bg-red-500/10'
              : 'border-[var(--color-ink)] dark:border-white bg-[#CCFF00]/10'
          }`}>
            <p style={{ fontFamily: 'var(--font-mono)' }}
               className="text-[10px] font-bold uppercase tracking-wider mb-2 text-[var(--color-ink)] dark:text-white">
              PROJECTION_RESULT
            </p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span style={{ fontFamily: 'var(--font-mono)' }}
                      className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase">
                  {projection.cat.slice} after spend
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
                      className="text-[10px] font-bold text-[var(--color-ink)] dark:text-white">
                  {projection.newPct.toFixed(1)}% used
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontFamily: 'var(--font-mono)' }}
                      className="text-[10px] text-[var(--color-ink-muted)] dark:text-zinc-400 uppercase">
                  Remaining
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
                      className={`text-[10px] font-bold ${projection.overBudget ? 'text-red-500' : 'text-[var(--color-ink)] dark:text-white'}`}>
                  {projection.overBudget
                    ? `OVER by ₦${Math.abs(projection.remaining).toLocaleString('en-NG')}`
                    : `₦${projection.remaining.toLocaleString('en-NG')}`}
                </span>
              </div>
            </div>
            {projection.overBudget && (
              <p style={{ fontFamily: 'var(--font-mono)' }}
                 className="text-[9px] text-red-500 font-bold mt-2">
                BUDGET_BREACH_WARNING: This spend exceeds your {projection.cat.slice} limit.
              </p>
            )}
          </div>
        )}
      </div>
    </PremiumGate>
  );
}
