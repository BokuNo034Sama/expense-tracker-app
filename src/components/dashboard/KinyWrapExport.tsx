import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { useAppStore } from '../../store';
import { Sparkles, Download, Share2, X } from 'lucide-react';

export function KinyWrapExport() {
  const profile = useAppStore(s => s.profile);
  const expenses = useAppStore(s => s.expenses);
  const categories = useAppStore(s => s.categories);
  const filterMonth = useAppStore(s => s.filterMonth);

  const [isOpen, setIsOpen] = useState(false);
  const [wrapMode, setWrapMode] = useState<'launch-week' | '3-month' | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkWrapStatus = async () => {
      // Check query parameter ?wrap=true
      const params = new URLSearchParams(window.location.search);
      if (params.get('wrap') === 'true') {
        setIsOpen(true);
        setWrapMode('launch-week');
        return;
      }

      try {
        const response = await fetch('/api/wrap/check');
        if (response.ok) {
          const data = await response.json();
          if (data.enabled) {
            // Check if dismissed in this session
            const dismissed = sessionStorage.getItem('kiny-wrap-dismissed');
            if (!dismissed) {
              setIsOpen(true);
              setWrapMode(data.mode);
            }
          }
        }
      } catch (err) {
        console.error('[KINY] Failed to check wrap status:', err);
      }
    };

    checkWrapStatus();
  }, []);

  if (!isOpen) return null;

  // ─── Data Analytics Calculations ─────────────────────────────────────────────

  // Max Streak
  const maxStreak = profile?.max_streak_this_month || 0;

  // Custom Slang Text
  const getSlangText = (track: string | undefined | null, streak: number) => {
    const isHigh = streak >= 5;
    if (track === 'student') {
      return isHigh 
        ? 'SAPAPROOF LEVEL! You dey defend your urgent 2k like champion!' 
        : 'SAPA DEY CHOKE! Your urgent 2k need backup, log those trace-out cash flows!';
    } else if (track === 'business') {
      return isHigh 
        ? 'CASHFLOW GENERAL! Your market dey run with speed!' 
        : 'CUSTOMER NO DEY? Keep tab on that capital before inventory dissolve!';
    } else { // 'salary' or default
      return isHigh 
        ? 'GLADIATOR LEVEL! Payday never reach but your budget defense is rock solid!' 
        : 'SALARY DETECTOR! No let your hard-earned monthly alert melt away like vapor!';
    }
  };

  const slangText = getSlangText(profile?.income_type, maxStreak);

  // Highest volume slice bucket
  const currentMonth = filterMonth || new Date().toISOString().substring(0, 7);
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));

  const sliceSums: Record<string, number> = {};
  monthlyExpenses.forEach(exp => {
    const cat = categories.find(c => c.id === exp.category_id);
    const sliceName = cat?.slice || 'Uncategorized';
    sliceSums[sliceName] = (sliceSums[sliceName] || 0) + exp.amount;
  });

  let highestSlice = 'No Spending';
  let highestAmount = 0;
  Object.entries(sliceSums).forEach(([slice, amt]) => {
    if (amt > highestAmount) {
      highestAmount = amt;
      highestSlice = slice;
    }
  });

  // PRD Requirement: Fallback e.g. "Feeding" for students, "Family" for workers
  let displaySlice = highestSlice;
  if (highestSlice === 'No Spending' || highestSlice === 'Uncategorized') {
    displaySlice = profile?.income_type === 'student' ? 'Feeding' : 'Basic Needs';
  }

  // Formatting helper for Date
  const formatMonthName = (monthStr: string) => {
    try {
      const date = new Date(monthStr + '-02'); // force Lagos/local parse
      return date.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    } catch {
      return monthStr.toUpperCase();
    }
  };

  const monthLabel = formatMonthName(currentMonth);

  // ─── Export handlers ─────────────────────────────────────────────────────────

  const exportKinyWrap = async () => {
    const node = cardRef.current;
    if (!node) return;
    
    setExporting(true);
    try {
      const dataUrl = await toPng(node, { quality: 0.95, backgroundColor: '#000000' });
      
      const link = document.createElement('a');
      link.download = `KINY-Wrap-${currentMonth}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('[KINY] Export image failed:', err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const shareKinyWrap = async () => {
    const node = cardRef.current;
    if (!node) return;

    setSharing(true);
    setShareSuccess(false);
    try {
      const text = `Check out my KINY Wrapped for ${monthLabel}! 🔥 Max Streak: ${maxStreak} days. 📊 Top Sector: ${displaySlice}. Managed on Kiny OS.`;

      // Try to generate PNG and share file (Web Share API)
      const dataUrl = await toPng(node, { quality: 0.95, backgroundColor: '#000000' });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `kiny-wrapped-${currentMonth}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `KINY Wrapped - ${monthLabel}`,
          text: text,
        });
        setShareSuccess(true);
      } else {
        // Fallback to pre-filled WhatsApp link
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (err) {
      console.error('[KINY] Sharing wrap failed:', err);
      // Try fallback to text share anyway
      const text = `Check out my KINY Wrapped for ${monthLabel}! 🔥 Max Streak: ${maxStreak} days. 📊 Top Sector: ${displaySlice}. Managed on Kiny OS.`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    } finally {
      setSharing(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('kiny-wrap-dismissed', 'true');
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="flex flex-col items-center max-w-sm w-full space-y-4 my-8">
        
        {/* Card Component (Captured Area) */}
        <div 
          ref={cardRef}
          id="kiny-wrap-card" 
          className="w-full bg-[#000000] text-white p-6 border-4 border-[#C6EF4E] rounded-none font-mono flex flex-col justify-between space-y-6 select-none shadow-[6px_6px_0px_0px_#ffffff]"
        >
          {/* Header */}
          <div className="border-b-2 border-dashed border-[#C6EF4E] pb-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[#C6EF4E] text-base font-black tracking-wider uppercase">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>KINY_OS // WRAPPED</span>
              <Sparkles className="h-4 w-4 shrink-0" />
            </div>
            <div className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-widest">
              {wrapMode === 'launch-week' ? 'LAUNCH WEEK SPECIAL' : '3-MONTH DEEP DIVE'}
            </div>
            <div className="text-[10px] bg-[#C6EF4E] text-black font-extrabold py-0.5 px-2 mt-2 inline-block uppercase">
              {monthLabel}
            </div>
          </div>

          {/* User Meta */}
          <div className="space-y-1 text-xs border-b border-zinc-800 pb-2 uppercase">
            <div className="flex justify-between font-bold">
              <span className="text-zinc-500">Hustler:</span>
              <span className="text-[#C6EF4E]">{profile?.name || 'USER'}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-zinc-500">Hustle Track:</span>
              <span className="text-white">{profile?.income_type || 'SALARY'}</span>
            </div>
          </div>

          {/* Card 1: Streak Badge */}
          <div className="border-2 border-white bg-zinc-950 p-4 rounded-none space-y-2 relative overflow-hidden shadow-[3px_3px_0px_0px_#C6EF4E]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">🔥 MAX_STREAK_THIS_MONTH</span>
              <span className="bg-[#C6EF4E] text-black text-[9px] font-black px-1.5 py-0.5 uppercase">
                ACTIVE
              </span>
            </div>
            <div className="text-xl font-black tracking-wide text-white">
              {maxStreak} consecutive days
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-2 text-[10px] leading-relaxed text-zinc-300 uppercase font-bold text-center">
              &ldquo;{slangText}&rdquo;
            </div>
          </div>

          {/* Card 2: Highest Volume Slice */}
          <div className="border-2 border-white bg-zinc-950 p-4 rounded-none space-y-2 shadow-[3px_3px_0px_0px_#C6EF4E]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">📊 TOP_SPENDING_SECTOR</span>
              <span className="text-[#C6EF4E] text-[10px] font-bold uppercase">VOLUME</span>
            </div>
            <div className="text-lg font-black tracking-wide uppercase text-[#C6EF4E]">
              {displaySlice}
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-zinc-300">
              <span>TOTAL SPENT:</span>
              <span className="text-white">₦{highestAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Stamp/Footer */}
          <div className="pt-2 border-t border-zinc-900 text-center flex flex-col items-center">
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">
              POWERED BY KINY.OS // DIGITAL LEDGER
            </span>
            <span className="text-[7px] text-zinc-600 mt-0.5 uppercase font-bold">
              VERIFIED SECURE via SUPABASE PG_CRYPTO
            </span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col gap-2 w-full pt-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={exportKinyWrap}
              disabled={exporting}
              className={`w-full py-3 bg-[#C6EF4E] text-black border-2 border-black font-mono font-bold text-xs uppercase shadow-[3px_3px_0px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                exporting ? 'animate-pulse cursor-wait' : ''
              }`}
            >
              <Download className="h-4 w-4 shrink-0" />
              {exporting ? 'EXPORTING...' : 'Download Card'}
            </button>

            <button
              onClick={shareKinyWrap}
              disabled={sharing}
              className={`w-full py-3 bg-[#25D366] text-white border-2 border-black font-mono font-bold text-xs uppercase shadow-[3px_3px_0px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                sharing ? 'animate-pulse cursor-wait' : ''
              }`}
            >
              <Share2 className="h-4 w-4 shrink-0" />
              {sharing ? 'SHARING...' : 'WhatsApp Share'}
            </button>
          </div>

          {shareSuccess && (
            <p className="text-[10px] font-mono text-center text-green-400 font-bold uppercase animate-bounce">
              Share completed successfully!
            </p>
          )}

          <button
            onClick={handleClose}
            className="w-full py-2.5 bg-zinc-900 text-zinc-300 hover:text-white border-2 border-black font-mono font-bold text-xs uppercase hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer rounded"
          >
            <X className="h-4 w-4 shrink-0" />
            Dismiss Wrap
          </button>
        </div>

      </div>
    </div>
  );
}
