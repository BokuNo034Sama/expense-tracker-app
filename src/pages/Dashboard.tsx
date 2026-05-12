import { motion, type Variants } from "framer-motion"
import { useAppStore } from "@/store/useAppStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SpendingChart } from "@/components/SpendingChart"
import { format } from "date-fns"
import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const { expenses, categories } = useAppStore()

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  
  const categorySpending = expenses.reduce((acc, e) => {
    acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  const topCategoryId = Object.keys(categorySpending).reduce((a, b) => categorySpending[a] > categorySpending[b] ? a : b, "")
  const topCategoryName = categories.find(c => c.id === topCategoryId)?.name || "N/A"
  const topCategoryAmount = categorySpending[topCategoryId] || 0

  const recentExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div variants={item}>
          <Card className="transition-transform hover:scale-[1.01]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="transition-transform hover:scale-[1.01]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenses.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="transition-transform hover:scale-[1.01]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Category</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="m2 7 4.5-4.5 4.5 4.5M2 17l4.5 4.5 4.5-4.5M22 12H11M22 7l-4.5-4.5L13 7M22 17l-4.5 4.5L13 17"/></svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{topCategoryName}</div>
              <p className="text-xs text-muted-foreground">₦{topCategoryAmount.toLocaleString()} spent</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          <SpendingChart />
        </motion.div>

        <motion.div variants={item} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">Recent Expenses</CardTitle>
              <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                <Link to="/expenses"><ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentExpenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent expenses.</p>
                ) : (
                  recentExpenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{expense.vendor}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(expense.date), "MMM dd, yyyy")}</p>
                      </div>
                      <div className="font-medium text-sm">₦{expense.amount.toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
