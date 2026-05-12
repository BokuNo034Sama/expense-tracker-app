import { useMemo, useState } from "react"
import { useAppStore } from "@/store/useAppStore"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { format, subDays } from "date-fns"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export function SpendingChart() {
  const { expenses } = useAppStore()
  const [period, setPeriod] = useState("30")

  const chartData = useMemo(() => {
    const days = parseInt(period)
    const result = []
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(new Date(), i)
      const dateStr = format(d, "MMM dd")
      const dateIso = format(d, "yyyy-MM-dd")
      
      const dayTotal = expenses
        .filter(e => e.date === dateIso)
        .reduce((sum, e) => sum + e.amount, 0)
        
      result.push({ date: dateStr, amount: dayTotal })
    }
    return result
  }, [expenses, period])

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Spending Trend</CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="14">Last 14 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => `₦${value}`} />
              <Tooltip 
                cursor={{ fill: 'transparent' }} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Amount']}
              />
              <Bar dataKey="amount" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
