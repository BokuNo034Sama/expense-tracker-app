import { useState } from "react"
import { motion } from "framer-motion"
import { useAppStore, type Expense } from "@/store/useAppStore"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, ArrowUpDown } from "lucide-react"
import { ExpenseModal } from "@/components/ExpenseModal"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function Expenses() {
  const { expenses, categories, deleteExpense } = useAppStore()
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || "Unknown"

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setIsEditOpen(true)
  }

  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}>
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Sort by Date
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No expenses found.
                </TableCell>
              </TableRow>
            ) : (
              sortedExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell>
                  <TableCell className="font-medium">{expense.vendor}</TableCell>
                  <TableCell>{getCategoryName(expense.categoryId)}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{expense.note}</TableCell>
                  <TableCell className="text-right font-medium">₦{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56" align="end">
                          <div className="space-y-4">
                            <h4 className="font-medium text-sm">Delete expense?</h4>
                            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="destructive" onClick={() => deleteExpense(expense.id)}>Delete</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ExpenseModal 
        open={isEditOpen} 
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) setTimeout(() => setEditingExpense(null), 200)
        }} 
        expense={editingExpense} 
      />
    </motion.div>
  )
}
