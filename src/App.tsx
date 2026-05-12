import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Layout } from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import Expenses from "./pages/Expenses"
import Budgets from "./pages/Budgets"
import { useState } from "react"
import { ExpenseModal } from "./components/ExpenseModal"

function App() {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)

  return (
    <BrowserRouter>
      <Layout onAddExpense={() => setIsAddExpenseOpen(true)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/budgets" element={<Budgets />} />
        </Routes>
        <ExpenseModal open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen} />
      </Layout>
    </BrowserRouter>
  )
}

export default App
