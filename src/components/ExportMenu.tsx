import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Download } from "lucide-react";
import { unparse } from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { mapCategory, mapExpense, parseLocalDate } from "../lib/format";

export function ExportMenu() {
  const expenses = useAppStore(s => s.expenses);
  const categories = useAppStore(s => s.categories);
  const [isOpen, setIsOpen] = useState(false);

  // Map to camelCase
  const mappedExpenses = expenses.map(mapExpense);
  const mappedCategories = categories.map(mapCategory);

  const handleExportCSV = () => {
    const data = mappedExpenses.map(e => ({
      Date: format(parseLocalDate(e.date), "yyyy-MM-dd"),
      Vendor: e.vendor,
      Category: mappedCategories.find(c => c.id === e.categoryId)?.name || "Unknown",
      "Amount (₦)": e.amount,
      Note: e.note || ""
    }));

    const csv = unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `kiny-expenses-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    setIsOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("courier", "bold");
    doc.text("KINY — PERSONAL FINANCE OS", 14, 15);
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    doc.text(`GENERATED_ON: ${format(new Date(), "MMM dd, yyyy")}`, 14, 22);

    const tableData = mappedExpenses.map(e => [
      format(parseLocalDate(e.date), "MMM dd, yyyy"),
      e.vendor.toUpperCase(),
      (mappedCategories.find(c => c.id === e.categoryId)?.name || "Unknown").toUpperCase(),
      `N${e.amount.toLocaleString()}`,
      (e.note || "").toUpperCase()
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["DATE", "VENDOR", "CATEGORY", "AMOUNT", "NOTE"]],
      body: tableData,
      theme: 'grid',
      styles: { font: 'courier', fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.5 },
      headStyles: { fillColor: [198, 239, 78], textColor: [0, 0, 0], fontStyle: 'bold' } // Kiny primary lime
    });

    doc.save(`kiny-expenses-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          style={{ fontFamily: 'var(--font-display)' }}
          className="inline-flex items-center gap-1.5 px-3 py-2 border-[var(--border-default)] rounded-[var(--border-radius)] bg-[var(--color-surface)] text-[var(--color-ink)] text-xs font-bold shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] uppercase transition-all duration-100"
        >
          <Download className="h-3.5 w-3.5" />
          EXPORT
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 border-[var(--border-default)] rounded-[var(--border-radius)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-1.5" align="end">
        <div className="flex flex-col gap-1">
          <button
            onClick={handleExportCSV}
            style={{ fontFamily: 'var(--font-mono)' }}
            className="w-full text-left py-2 px-3 hover:bg-[var(--color-primary)] hover:text-[var(--color-ink)] text-xs font-bold uppercase rounded-[calc(var(--border-radius)-4px)] transition-colors duration-100"
          >
            EXPORT_AS_CSV
          </button>
          <button
            onClick={handleExportPDF}
            style={{ fontFamily: 'var(--font-mono)' }}
            className="w-full text-left py-2 px-3 hover:bg-[var(--color-primary)] hover:text-[var(--color-ink)] text-xs font-bold uppercase rounded-[calc(var(--border-radius)-4px)] transition-colors duration-100"
          >
            EXPORT_AS_PDF
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
