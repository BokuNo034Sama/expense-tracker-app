import { useState, useEffect } from "react"
import { useAppStore, type Category } from "@/store/useAppStore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
}

export function CategoryModal({ open, onOpenChange, category }: CategoryModalProps) {
  const { addCategory, updateCategory } = useAppStore()
  
  const [name, setName] = useState("")
  const [budgetLimit, setBudgetLimit] = useState("")

  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name)
        setBudgetLimit(category.budgetLimit.toString())
      } else {
        setName("")
        setBudgetLimit("")
      }
    }
  }, [open, category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    const categoryData = {
      name,
      icon: category?.icon || "Folder", // simple default
      budgetLimit: Number(budgetLimit) || 0
    }

    if (category) {
      updateCategory(category.id, categoryData)
    } else {
      addCategory(categoryData)
    }
    
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>
            {category ? "Modify your budget category." : "Create a new budget category."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input id="name" required placeholder="e.g. Travel" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Monthly Budget Limit (₦)</Label>
            <Input id="budget" type="number" min="0" step="0.01" placeholder="0 = No limit" value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{category ? "Save Changes" : "Add Category"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
