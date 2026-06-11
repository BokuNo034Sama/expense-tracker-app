import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";
import { BentoCard } from "./shared/BentoCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export function SpendingChart() {
  const expenses = useAppStore(s => s.expenses);
  const [period, setPeriod] = useState("30");

  const chartData = useMemo(() => {
    const days = parseInt(period);
    const result = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, "MMM dd");
      const dateIso = format(d, "yyyy-MM-dd");
      
      const dayTotal = expenses
        .filter(e => e.date === dateIso)
        .reduce((sum, e) => sum + Number(e.amount), 0);
        
      result.push({ date: dateStr, amount: dayTotal });
    }
    return result;
  }, [expenses, period]);

  return (
    <BentoCard hoverEffect={false} className="col-span-full lg:col-span-2 flex flex-col justify-between">
      <div className="flex flex-row items-center justify-between pb-4 border-b border-[var(--color-ink)] border-dashed mb-4">
        <h3 
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-lg font-extrabold uppercase tracking-wide text-[var(--color-ink)]"
        >
          SPENDING_TREND
        </h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger 
            style={{ fontFamily: 'var(--font-mono)' }}
            className="w-[140px] h-9 text-xs border-[var(--border-default)] rounded-[var(--border-radius)] bg-[var(--color-surface)] shadow-[var(--shadow-btn-active)] font-bold uppercase"
          >
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="border-[var(--border-default)] rounded-[var(--border-radius)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
            <SelectItem style={{ fontFamily: 'var(--font-mono)' }} className="text-xs uppercase font-bold" value="7">LAST 7 DAYS</SelectItem>
            <SelectItem style={{ fontFamily: 'var(--font-mono)' }} className="text-xs uppercase font-bold" value="14">LAST 14 DAYS</SelectItem>
            <SelectItem style={{ fontFamily: 'var(--font-mono)' }} className="text-xs uppercase font-bold" value="30">LAST 30 DAYS</SelectItem>
            <SelectItem style={{ fontFamily: 'var(--font-mono)' }} className="text-xs uppercase font-bold" value="90">LAST 90 DAYS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="var(--color-ink-muted)" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: 'var(--color-ink)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }} 
            />
            <YAxis 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={value => `₦${value.toLocaleString()}`} 
              tick={{ fill: 'var(--color-ink)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
              contentStyle={{ 
                backgroundColor: 'var(--color-surface)', 
                border: 'var(--border-default)', 
                borderRadius: 'var(--border-radius)',
                boxShadow: 'var(--shadow-card)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 'bold'
              }}
              formatter={(value: any) => [`₦${value.toLocaleString()}`, 'SPENT']}
              labelFormatter={(label) => `DATE: ${label}`}
            />
            <Bar 
              dataKey="amount" 
              fill="var(--color-primary)" 
              stroke="var(--color-ink)"
              strokeWidth={2}
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </BentoCard>
  );
}
