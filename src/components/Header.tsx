import { Link, useLocation } from "react-router-dom"
import { Plus } from "lucide-react"
import { Button } from "./ui/button"
import { ExportMenu } from "./ExportMenu"

export function Header({ onAddExpense }: { onAddExpense?: () => void }) {
  const location = useLocation()
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold tracking-tight text-lg">Expense Tracker</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className={`transition-colors hover:text-foreground/80 ${location.pathname === '/' ? 'text-foreground' : 'text-foreground/60'}`}>Dashboard</Link>
            <Link to="/expenses" className={`transition-colors hover:text-foreground/80 ${location.pathname === '/expenses' ? 'text-foreground' : 'text-foreground/60'}`}>Expenses</Link>
            <Link to="/budgets" className={`transition-colors hover:text-foreground/80 ${location.pathname === '/budgets' ? 'text-foreground' : 'text-foreground/60'}`}>Budgets</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu />
          <Button onClick={onAddExpense} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>
    </header>
  )
}
