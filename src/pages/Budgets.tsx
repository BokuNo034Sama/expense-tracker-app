import { useState } from "react"
import { motion } from "framer-motion"
import { useAppStore, type Category } from "@/store/useAppStore"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { CategoryModal } from "@/components/CategoryModal"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function Budgets() {
  const { categories, expenses, deleteCategory } = useAppStore()
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsEditOpen(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
        <Button size="sm" onClick={() => { setEditingCategory(null); setIsEditOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(category => {
          const categoryExpenses = expenses.filter(e => e.categoryId === category.id)
          const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
          const percentage = category.budgetLimit > 0 ? Math.min((spent / category.budgetLimit) * 100, 100) : 0
          const isOverBudget = category.budgetLimit > 0 && spent > category.budgetLimit

          return (
            <Card key={category.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(category)}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="end">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Delete category?</h4>
                        {categoryExpenses.length > 0 ? (
                          <p className="text-sm text-destructive font-medium">Warning: You have {categoryExpenses.length} expenses in this category. Deleting it might orphan them!</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="destructive" onClick={() => deleteCategory(category.id)}>Delete</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                {category.budgetLimit > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">of ₦{category.budgetLimit.toLocaleString()} limit</p>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isOverBudget ? 'bg-destructive' : 'bg-primary'}`} 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No limit set</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <CategoryModal 
        open={isEditOpen} 
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) setTimeout(() => setEditingCategory(null), 200)
        }} 
        category={editingCategory} 
      />
    </motion.div>
  )
}
