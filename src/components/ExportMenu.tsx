import { useState, useEffect, useRef } from "react";
import { useAppStore, getCycleBoundaries } from "@/store/useAppStore";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Download } from "lucide-react";
import { unparse } from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { mapCategory, mapExpense, parseLocalDate } from "../lib/format";

export function ExportMenu() {
  const expenses = useAppStore(s => s.expenses);
  const categories = useAppStore(s => s.categories);
  const profile = useAppStore(s => s.profile);
  const [isOpen, setIsOpen] = useState(false);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Map to camelCase
  const mappedExpenses = expenses.map(mapExpense);
  const mappedCategories = categories.map(mapCategory);

  // Calculate Financial Discipline Score
  const currentStreak = profile?.current_streak || 0;
  // Streak score: 0 if 0, otherwise baseline of 40 + 10 points per day up to 100
  const streakScore = currentStreak > 0 ? Math.min(100, 40 + currentStreak * 10) : 0;

  // Monthly spent vs budget
  const currentCycle = getCycleBoundaries(profile);
  const monthlyExpenses = expenses.filter(e => {
    if (!e || !e.date || typeof e.date !== 'string') return false;
    const d = new Date(e.date);
    return d >= currentCycle.startDate && d <= currentCycle.endDate;
  });

  const categorySpends: { [id: string]: number } = {};
  monthlyExpenses.forEach(e => {
    if (e && e.category_id) {
      categorySpends[e.category_id] = (categorySpends[e.category_id] || 0) + Number(e.amount || 0);
    }
  });

  const budgetedCategories = categories.filter(c => c && Number(c.budget_limit || 0) > 0);
  let budgetCompliance = 100;
  if (budgetedCategories.length > 0) {
    const complianceSum = budgetedCategories.reduce((sum, cat) => {
      const spent = categorySpends[cat.id] || 0;
      const limit = Number(cat.budget_limit);
      if (spent <= limit) {
        return sum + 100;
      } else {
        const penalty = Math.max(0, 100 - ((spent - limit) / limit) * 100);
        return sum + penalty;
      }
    }, 0);
    budgetCompliance = complianceSum / budgetedCategories.length;
  }

  const disciplineScore = Math.round((streakScore + budgetCompliance) / 2);
  const totalMonthlySpend = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

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

  useEffect(() => {
    if (!isCardDialogOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-res canvas sizes
    canvas.width = 1080;
    canvas.height = 1080;

    // Draw background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1080, 1080);

    // Draw thick toxic lime border
    ctx.strokeStyle = '#C6EF4E';
    ctx.lineWidth = 30;
    ctx.strokeRect(15, 15, 1050, 1050);

    // Draw secondary inner border
    ctx.strokeStyle = '#C6EF4E';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 1000, 1000);

    // Draw Title: KINY CAMPUS FLEX
    ctx.fillStyle = '#C6EF4E';
    ctx.font = '900 36px monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText('KINY_CAMPUS_FLEX', 80, 80);

    // Draw Subtitle / App Tag
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 20px monospace';
    ctx.fillText('FINANCIAL_DISCIPLINE_OS', 80, 130);

    // Date
    const dateStr = format(new Date(), "yyyy-MM-dd").toUpperCase();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#C6EF4E';
    ctx.font = '700 20px monospace';
    ctx.fillText(`REPORT_DATE: ${dateStr}`, 1000, 80);

    // Underline divider
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 175);
    ctx.lineTo(1000, 175);
    ctx.stroke();

    // Draw User Information
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 48px monospace';
    const userName = (profile?.name || 'STUDENT').toUpperCase();
    ctx.fillText(userName, 80, 210);

    ctx.fillStyle = '#C6EF4E';
    ctx.font = '700 24px monospace';
    const occupationName = (profile?.occupation || 'CAMPUS HUSTLER').toUpperCase();
    ctx.fillText(`[ ${occupationName} ]`, 80, 275);

    // Main Score Box
    const boxX = 80;
    const boxY = 350;
    const boxW = 920;
    const boxH = 400;
    const shadowOffset = 20;

    // Draw shadow first
    ctx.fillStyle = '#C6EF4E';
    ctx.fillRect(boxX + shadowOffset, boxY + shadowOffset, boxW, boxH);

    // Draw card box
    ctx.fillStyle = '#000000';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#C6EF4E';
    ctx.lineWidth = 8;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Inside Score Card Box:
    // Score Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px monospace';
    ctx.fillText('FINANCIAL_DISCIPLINE_SCORE', boxX + 50, boxY + 50);

    // Score Value
    ctx.fillStyle = '#C6EF4E';
    ctx.font = '900 160px monospace';
    ctx.fillText(`${disciplineScore}%`, boxX + 50, boxY + 110);

    // Status / Emoji
    let statusText = '';
    let emojiStr = '';
    if (disciplineScore < 40) {
      statusText = 'SAPA_STATUS: CRITICAL';
      emojiStr = '🚨';
    } else if (disciplineScore < 66) {
      statusText = 'STATUS: AVOIDING_DEBT';
      emojiStr = '😅';
    } else if (disciplineScore < 86) {
      statusText = 'STATUS: CAMPUS_BALLER';
      emojiStr = '💰';
    } else {
      statusText = 'STATUS: KINY_CAMPUS_LEGEND';
      emojiStr = '👑';
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px monospace';
    ctx.fillText(`${statusText} ${emojiStr}`, boxX + 50, boxY + 310);

    // Metrics Row
    const statBoxY = 810;
    const colW = 280;
    const spacing = 40;

    // Col 1: Logging Streak
    drawStatBox(ctx, boxX, statBoxY, colW, 140, 'LOGGING_STREAK', `${currentStreak} DAYS`, shadowOffset - 8);

    // Col 2: Budget Compliance
    drawStatBox(ctx, boxX + colW + spacing, statBoxY, colW, 140, 'COMPLIANCE', `${Math.round(budgetCompliance)}%`, shadowOffset - 8);

    // Col 3: Monthly Spend
    const formattedSpend = '₦' + totalMonthlySpend.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    drawStatBox(ctx, boxX + (colW + spacing) * 2, statBoxY, colW, 140, 'MONTHLY_SPEND', formattedSpend, shadowOffset - 8);

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888888';
    ctx.font = '700 18px monospace';
    ctx.fillText('GENERATE YOURS AT KINY.APP | TRACK STREAKS, AVOID SAPA', 540, 1010);

  }, [isCardDialogOpen, profile, disciplineScore, budgetCompliance, currentStreak, totalMonthlySpend]);

  const drawStatBox = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    value: string,
    shadow: number
  ) => {
    // shadow
    ctx.fillStyle = '#C6EF4E';
    ctx.fillRect(x + shadow, y + shadow, w, h);

    // box
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);

    // label text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#888888';
    ctx.font = '900 16px monospace';
    ctx.fillText(label, x + 20, y + 30);

    // value text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px monospace';
    ctx.fillText(value, x + 20, y + 80);
  };

  const handleDownloadCard = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `kiny-campus-flex-${profile?.name || 'student'}.png`;
      link.href = url;
      link.click();
    }
  };

  const handleOpenFlexCardDialog = () => {
    setIsOpen(false);
    setIsCardDialogOpen(true);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            style={{ fontFamily: 'var(--font-display)' }}
            className="inline-flex items-center gap-1.5 px-3 py-2 border-[var(--border-default)] rounded-[var(--border-radius)] bg-[var(--color-surface)] text-[var(--color-ink)] text-xs font-bold shadow-[var(--shadow-btn)] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[var(--shadow-btn-active)] uppercase transition-all duration-100 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            EXPORT
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 border-[var(--border-default)] rounded-[var(--border-radius)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-1.5 font-mono text-xs font-bold uppercase" align="end">
          <div className="flex flex-col gap-1">
            <button
              onClick={handleExportCSV}
              className="w-full text-left py-2 px-3 hover:bg-[var(--color-brand-primary)] hover:text-[#000000] rounded-[calc(var(--border-radius)-4px)] transition-colors duration-100 cursor-pointer"
            >
              EXPORT_AS_CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="w-full text-left py-2 px-3 hover:bg-[var(--color-brand-primary)] hover:text-[#000000] rounded-[calc(var(--border-radius)-4px)] transition-colors duration-100 cursor-pointer"
            >
              EXPORT_AS_PDF
            </button>
            {profile?.income_type === 'student' && (
              <button
                onClick={handleOpenFlexCardDialog}
                className="w-full text-left py-2 px-3 hover:bg-[#C6EF4E] hover:text-[#000000] text-xs font-extrabold uppercase rounded-[calc(var(--border-radius)-4px)] text-[#C6EF4E] transition-colors duration-100 cursor-pointer"
              >
                CAMPUS_FLEX_CARD
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
        <DialogContent className="sm:max-w-md bg-black text-white border-4 border-[#C6EF4E] rounded-none p-6 font-mono">
          <DialogHeader className="border-b border-[#C6EF4E] border-dashed pb-3">
            <DialogTitle className="text-lg font-black uppercase text-[#C6EF4E]">
              CAMPUS_FLEX_CARD_PREVIEW
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 uppercase font-bold">
              Preview your shareable Financial Discipline Score Card.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4 gap-4">
            <canvas
              ref={canvasRef}
              id="campus-flex-canvas"
              className="w-full max-w-[320px] aspect-square border-2 border-[#C6EF4E]"
            />
            <p className="text-[10px] text-zinc-500 uppercase text-center font-bold">
              1080x1080 high-res card ready for WhatsApp Status or Twitter.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#C6EF4E] border-dashed pt-4">
            <button
              onClick={() => setIsCardDialogOpen(false)}
              className="px-4 py-2 border-2 border-white text-white font-bold text-xs uppercase hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              CLOSE
            </button>
            <button
              onClick={handleDownloadCard}
              className="px-4 py-2 bg-[#C6EF4E] text-black font-black text-xs uppercase hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
            >
              DOWNLOAD_CARD_PNG
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
