import { type ReactNode } from "react"
import { Header } from "./Header"

export function Layout({ children, onAddExpense }: { children: ReactNode, onAddExpense?: () => void }) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Header onAddExpense={onAddExpense} />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
