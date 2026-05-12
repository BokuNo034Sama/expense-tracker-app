import { useState, useEffect } from "react"
import { useAppStore, type Expense } from "@/store/useAppStore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

interface ExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null // if provided, it's edit mode
}

export function ExpenseModal({ open, onOpenChange, expense }: ExpenseModalProps) {
  const { categories, addExpense, updateExpense } = useAppStore()
  
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [vendor, setVendor] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (open) {
      if (expense) {
        setDate(expense.date)
        setVendor(expense.vendor)
        setCategoryId(expense.categoryId)
        setAmount(expense.amount.toString())
        setNote(expense.note || "")
      } else {
        setDate(new Date().toISOString().split('T')[0])
        setVendor("")
        setCategoryId(categories[0]?.id || "")
        setAmount("")
        setNote("")
      }
    }
  }, [open, expense, categories])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendor || !categoryId || !amount || isNaN(Number(amount))) return

    const expenseData = {
      date,
      vendor,
      categoryId,
      amount: Number(amount),
      note
    }

    if (expense) {
      updateExpense(expense.id, expenseData)
    } else {
      addExpense(expenseData)
    }
    
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription>
            {expense ? "Modify your expense details below." : "Enter the details of your new expense."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" required value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Input id="vendor" required placeholder="e.g. Shoprite" value={vendor} onChange={e => setVendor(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input id="amount" type="number" min="0" step="0.01" required placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Input id="note" placeholder="Any extra details..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{expense ? "Save Changes" : "Add Expense"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
