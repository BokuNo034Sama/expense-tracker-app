import { useState } from "react"
import { useAppStore } from "@/store/useAppStore"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Button } from "./ui/button"
import { Download } from "lucide-react"
import { unparse } from "papaparse"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"

export function ExportMenu() {
  const { expenses, categories } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)

  const handleExportCSV = () => {
    const data = expenses.map(e => ({
      Date: format(new Date(e.date), "yyyy-MM-dd"),
      Vendor: e.vendor,
      Category: categories.find(c => c.id === e.categoryId)?.name || "Unknown",
      "Amount (₦)": e.amount,
      Note: e.note || ""
    }))

    const csv = unparse(data)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
    setIsOpen(false)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text("Expense Report", 14, 15)
    doc.setFontSize(10)
    doc.text(`Generated on ${format(new Date(), "MMM dd, yyyy")}`, 14, 22)

    const tableData = expenses.map(e => [
      format(new Date(e.date), "MMM dd, yyyy"),
      e.vendor,
      categories.find(c => c.id === e.categoryId)?.name || "Unknown",
      `N${e.amount.toLocaleString()}`,
      e.note || ""
    ])

    autoTable(doc, {
      startY: 30,
      head: [["Date", "Vendor", "Category", "Amount", "Note"]],
      body: tableData,
    })

    doc.save(`expenses-${format(new Date(), "yyyy-MM-dd")}.pdf`)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="end">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" className="justify-start font-normal" onClick={handleExportCSV}>Export as CSV</Button>
          <Button variant="ghost" className="justify-start font-normal" onClick={handleExportPDF}>Export as PDF</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
