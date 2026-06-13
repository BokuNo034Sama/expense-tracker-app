import { useState } from 'react';
import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import { ArrowUpRight, TrendingUp, CheckCircle } from 'lucide-react';

export function WealthAnalytics() {
  const totalMonthlyIncome = useAppStore(s => s.totalMonthlyIncome);
  const totalMonthlyExpenses = useAppStore(s => s.totalMonthlyExpenses);
  const netMonthlySurplus = useAppStore(s => s.netMonthlySurplus);
  const investmentTriggers = useAppStore(s => s.investmentTriggers);
  const isDataMasked = useAppStore(s => s.isDataMasked);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const formatNaira = (amount: number) => {
    if (isDataMasked) return '••••••';
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleGoToPlatform = (platform: string, triggerName: string, targetAmount: number) => {
    const cleanName = triggerName.toUpperCase().replace(/\s+/g, '-');
    const copyText = `KINY-INVEST-${platform.toUpperCase()}-${cleanName}-${targetAmount}`;
    navigator.clipboard.writeText(copyText).then(() => {
      setCopiedToken(`Token copied! Directing you to ${platform}...`);
      setTimeout(() => setCopiedToken(null), 3000);
    }).catch(() => {
      setCopiedToken(`Directing you to ${platform}...`);
      setTimeout(() => setCopiedToken(null), 3000);
    });

    const links: Record<string, string> = {
      bamboo: 'https://investbamboo.com',
      cowrywise: 'https://cowrywise.com',
      trove: 'https://troveapp.co',
      piggyvest: 'https://piggyvest.com'
    };

    const targetUrl = links[platform.toLowerCase()] || 'https://google.com';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const surplusPercent = totalMonthlyIncome > 0 
    ? Math.max(0, Math.min(100, (netMonthlySurplus / totalMonthlyIncome) * 100)) 
    : 0;

  return (
    <BentoCard hoverEffect={false} className="col-span-full bg-[#F4F4F0] dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#FFFFFF] p-6 text-black dark:text-white rounded-[var(--border-radius)] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-black dark:border-white pb-4">
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-black uppercase tracking-wide flex items-center gap-2">
            <TrendingUp size={20} className="text-[#C6EF4E]" />
            DEEP_WEALTH_ANALYTICS
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-gray-600 dark:text-gray-400 uppercase font-bold mt-1">
            Real-time threshold monitoring & investment router
          </p>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] bg-black text-[#C6EF4E] dark:bg-white dark:text-black font-extrabold px-2.5 py-1 uppercase rounded border border-black">
          Engine // Online
        </div>
      </div>

      {copiedToken && (
        <div 
          style={{ fontFamily: 'var(--font-mono)' }}
          className="bg-[#C6EF4E] text-black border-2 border-black font-extrabold text-[11px] p-2.5 uppercase text-center rounded animate-[pulse_1s_infinite]"
        >
          {copiedToken}
        </div>
      )}

      {/* Visual Component 1: Net Flow Overview */}
      <div className="border-4 border-black dark:border-white p-4 bg-white dark:bg-zinc-800 rounded-[var(--border-radius)] shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#FFFFFF]">
        <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
          NET_FLOW_SURPLUS_MONITOR
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 font-mono">
          <div className="border-2 border-black dark:border-white p-3 rounded bg-gray-50 dark:bg-zinc-900">
            <span className="text-[10px] text-gray-500 block uppercase font-bold">TOTAL_INCOME</span>
            <span className="text-lg font-black">{formatNaira(totalMonthlyIncome)}</span>
          </div>
          <div className="border-2 border-black dark:border-white p-3 rounded bg-gray-50 dark:bg-zinc-900">
            <span className="text-[10px] text-gray-500 block uppercase font-bold">TOTAL_EXPENSES</span>
            <span className="text-lg font-black text-red-500 dark:text-red-400">{formatNaira(totalMonthlyExpenses)}</span>
          </div>
          <div className="border-2 border-black dark:border-white p-3 rounded bg-gray-50 dark:bg-zinc-900">
            <span className="text-[10px] text-gray-500 block uppercase font-bold">NET_MONTH_SURPLUS</span>
            <span className={`text-lg font-black ${netMonthlySurplus < 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
              {formatNaira(netMonthlySurplus)}
            </span>
          </div>
        </div>

        {/* Progress bar tracking remaining surplus portion of income */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold">
            <span className="uppercase text-gray-500">SURPLUS_EFFICIENCY_RATE:</span>
            <span>{surplusPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full h-6 bg-gray-100 dark:bg-zinc-900 border-2 border-black dark:border-white rounded overflow-hidden p-0.5">
            <div 
              style={{ width: `${surplusPercent}%` }}
              className="h-full bg-[#C6EF4E] dark:bg-lime-500 border-r-2 border-black dark:border-white transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Visual Component 2: Milestone Tracker Cards */}
      <div className="space-y-4">
        <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
          INVESTMENT_MILESTONES
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {investmentTriggers.map((trigger) => {
            const isMet = trigger.status === 'THRESHOLD_MET';
            const pct = Math.max(0, Math.min(100, (trigger.currentProgress / trigger.targetThreshold) * 100));

            return (
              <div 
                key={trigger.id}
                className={`border-4 border-black dark:border-white p-4 rounded-[var(--border-radius)] flex flex-col justify-between min-h-[180px] shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#FFFFFF] relative overflow-hidden transition-all duration-150
                  ${isMet ? 'bg-lime-50/50 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-800'}
                `}
              >
                {/* Met Watermark status */}
                {isMet && (
                  <div className="absolute top-2 right-2 text-green-600 dark:text-green-400 animate-bounce">
                    <CheckCircle size={18} />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[9px] bg-black text-white dark:bg-white dark:text-black font-extrabold px-1.5 py-0.5 rounded uppercase">
                      {trigger.assetClass}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[9px] text-gray-500 font-bold uppercase">
                      via {trigger.targetPlatform}
                    </span>
                  </div>
                  
                  <h4 style={{ fontFamily: 'var(--font-display)' }} className="text-xs font-black uppercase tracking-tight text-gray-900 dark:text-white line-clamp-1">
                    {trigger.name}
                  </h4>
                </div>

                <div className="space-y-2 my-4">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-gray-600 dark:text-gray-400">
                    <span>{formatNaira(trigger.currentProgress)}</span>
                    <span>/ {formatNaira(trigger.targetThreshold)}</span>
                  </div>
                  {/* Aggressive Progress Meter */}
                  <div className="w-full h-4 bg-gray-100 dark:bg-zinc-955 border-2 border-black dark:border-white rounded overflow-hidden p-0.5">
                    <div 
                      style={{ width: `${pct}%` }}
                      className={`h-full border-r border-black dark:border-white transition-all duration-300
                        ${isMet ? 'bg-[#C6EF4E]' : 'bg-black dark:bg-white'}
                      `}
                    />
                  </div>
                </div>

                {/* The Action Callout Button */}
                {isMet ? (
                  <button
                    onClick={() => handleGoToPlatform(trigger.targetPlatform, trigger.name, trigger.targetThreshold)}
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className="w-full py-2 bg-[#C6EF4E] hover:bg-[#b5db3f] text-black border-2 border-black rounded shadow-[2px_2px_0px_0px_#000000] font-black text-[10px] uppercase transition-all duration-100 flex items-center justify-center gap-1 cursor-pointer active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000000]"
                  >
                    [GO TO {trigger.targetPlatform.toUpperCase()}]
                    <ArrowUpRight size={12} />
                  </button>
                ) : (
                  <div 
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className="w-full py-2 bg-gray-100 dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded text-center font-bold text-[9px] uppercase select-none"
                  >
                    PENDING_SURPLUS_THRESHOLD
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </BentoCard>
  );
}
