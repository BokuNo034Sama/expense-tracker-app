import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { useAppStore } from '../../store';
import { Sparkles, Download, Share2, X, Lock, Palmtree, Search, Soup } from 'lucide-react';

const PERSONA_CONFIGS = {
  vault_keeper: {
    name: "The Vault Keeper",
    slang: "Your savings vault dey breathe fresh air!",
    color: "#0A2F7D", // Sapphire Blue
    jigsaw_style: "minimal_rounded",
    bg_texture: "grid_clean",
    icon: "lock_green"
  },
  enjoyment_officer: {
    name: "Enjoyment Officer",
    slang: "You no gree for financial blindness when chills are active!",
    color: "#FF5733", // Sunset Orange
    jigsaw_style: "bubbly_rounded",
    bg_texture: "confetti",
    icon: "palm_tree"
  },
  audit_master: {
    name: "The Audit Master",
    slang: "Tracking hand too steady. Account balance must align!",
    color: "#B22222", // Ruby Red
    jigsaw_style: "sharp_jigsaw",
    bg_texture: "circuit_lines",
    icon: "magnifying_glass"
  },
  trenches_resident: {
    name: "Trenches Resident",
    slang: "Survival mode active. No let daily billing swallow you!",
    color: "#333333", // Charcoal Gray
    jigsaw_style: "rough_edges",
    bg_texture: "dirt_texture",
    icon: "garri_bowl"
  }
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export function KinyWrapExport() {
  const profile = useAppStore(s => s.profile);
  const expenses = useAppStore(s => s.expenses);
  const incomes = useAppStore(s => s.incomes);
  const categories = useAppStore(s => s.categories);
  const budgetSlices = useAppStore(s => s.budgetSlices);
  const filterMonth = useAppStore(s => s.filterMonth);

  const [isOpen, setIsOpen] = useState(false);
  const [wrapMode, setWrapMode] = useState<'launch-week' | '3-month' | null>(null);
  const [exporting, setExporting] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkWrapStatus = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('wrap') === 'true') {
        setIsOpen(true);
        setWrapMode('launch-week');
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/wrap/check`);
        if (response.ok) {
          const data = await response.json();
          if (data.enabled) {
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

  // ─── Phase 1: Behavior Analytics & Persona Calculations ──────────────────────

  // 1. Savings Slice Percentage
  const savingsSlice = budgetSlices.find(s => s.slice_name === 'Savings' || s.slice_type === 'Saving');
  const savingsPercentage = savingsSlice ? savingsSlice.allocated_percentage : 0;

  // 2. Flex Money Slice Percentage
  const flexSlice = budgetSlices.find(s => s.slice_name === 'Flex Money' || s.slice_type === 'Flex_Money');
  const flexPercentage = flexSlice ? flexSlice.allocated_percentage : 0;

  // 3. Max Streak
  const maxStreak = profile?.max_streak_this_month || 0;

  // 4. Available Cash calculation (Net Surplus / Total Income)
  const baseSalary = parseFloat(String(profile?.estimated_monthly_salary || profile?.monthly_salary || 0));
  const currentMonth = filterMonth || new Date().toISOString().substring(0, 7);
  const currentMonthIncomes = incomes.filter(i => i.date.startsWith(currentMonth));
  const totalIncome = baseSalary + currentMonthIncomes.reduce((sum, i) => sum + Number(i.amount), 0);

  const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const totalExpenses = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const availableCashRatio = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;

  // Analysis engine persona assignment
  const getPersona = (): 'vault_keeper' | 'enjoyment_officer' | 'audit_master' | 'trenches_resident' => {
    if (savingsPercentage > 25) return 'vault_keeper';
    if (flexPercentage > 45) return 'enjoyment_officer';
    if (maxStreak > 15) return 'audit_master';
    if (availableCashRatio < 0.10) return 'trenches_resident';
    return 'vault_keeper'; // default fallback
  };

  const persona = getPersona();
  const config = PERSONA_CONFIGS[persona];

  // ─── Slice Distributions for WakaChart ──────────────────────────────────────
  const sliceSums: Record<string, number> = {};
  currentMonthExpenses.forEach(exp => {
    const cat = categories.find(c => c.id === exp.category_id);
    const sliceName = cat?.slice || 'Uncategorized';
    sliceSums[sliceName] = (sliceSums[sliceName] || 0) + exp.amount;
  });

  const totalSpent = Object.values(sliceSums).reduce((sum, amt) => sum + amt, 0);

  // If no spending, add default visual placeholders based on user track
  let slicesData = Object.entries(sliceSums).map(([name, amount]) => {
    const percentage = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
    return { name, amount, percentage };
  });

  if (slicesData.length === 0) {
    if (profile?.income_type === 'student') {
      slicesData = [
        { name: 'Feeding', amount: 0, percentage: 40 },
        { name: 'Basic Needs', amount: 0, percentage: 35 },
        { name: 'Flex Money', amount: 0, percentage: 25 }
      ];
    } else {
      slicesData = [
        { name: 'Basic Needs', amount: 0, percentage: 50 },
        { name: 'Savings', amount: 0, percentage: 30 },
        { name: 'Flex Money', amount: 0, percentage: 20 }
      ];
    }
  }

  // ─── Theme visual patterns generator ─────────────────────────────────────────
  const getPatternStyle = (bg_texture: string) => {
    switch (bg_texture) {
      case 'grid_clean':
        return {
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        };
      case 'confetti':
        return {
          backgroundImage: `
            radial-gradient(circle, rgba(255, 255, 255, 0.15) 20%, transparent 20%), 
            radial-gradient(circle, rgba(255, 255, 255, 0.1) 20%, transparent 20%)
          `,
          backgroundSize: '15px 15px, 30px 30px',
          backgroundPosition: '0 0, 15px 15px',
        };
      case 'circuit_lines':
        return {
          backgroundImage: `
            linear-gradient(45deg, rgba(255, 255, 255, 0.06) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.06) 75%, rgba(255, 255, 255, 0.06)),
            linear-gradient(45deg, rgba(255, 255, 255, 0.06) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.06) 75%, rgba(255, 255, 255, 0.06))
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px',
        };
      case 'dirt_texture':
        return {
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.03) 1px, transparent 1px, transparent 2px),
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.03) 1px, transparent 1px, transparent 2px)
          `,
          backgroundSize: '3px 3px',
        };
      default:
        return {};
    }
  };

  // ─── Header Decors ───────────────────────────────────────────────────────────
  const getHeaderStyles = () => {
    let headerClass = "pb-3 text-center relative border-b-2 border-black";
    let decoration = null;

    if (config.jigsaw_style === 'minimal_rounded') {
      headerClass += " rounded-t-xl";
    } else if (config.jigsaw_style === 'bubbly_rounded') {
      headerClass += " rounded-t-[2rem] border-b-4 border-dashed";
    } else if (config.jigsaw_style === 'sharp_jigsaw') {
      headerClass += " transform -rotate-1 skew-x-1";
      decoration = (
        <div className="absolute -top-1 left-4 w-12 h-2.5 bg-black border-x border-b border-black" />
      );
    } else if (config.jigsaw_style === 'rough_edges') {
      headerClass += " rounded-[20px_10px_25px_5px] border-b-4 border-double";
    }

    return { headerClass, decoration };
  };

  const { headerClass: headerClassApplied, decoration: headerDecoration } = getHeaderStyles();

  // ─── Icon Selector ──────────────────────────────────────────────────────────
  const getIcon = () => {
    switch (config.icon) {
      case 'lock_green':
        return <Lock className="h-6 w-6 text-[#C6EF4E]" />;
      case 'palm_tree':
        return <Palmtree className="h-6 w-6 text-[#FFD700]" />;
      case 'magnifying_glass':
        return <Search className="h-6 w-6 text-[#FF4D4D]" />;
      case 'garri_bowl':
        return <Soup className="h-6 w-6 text-[#DCDCDC]" />;
      default:
        return <Sparkles className="h-6 w-6 text-white" />;
    }
  };

  // ─── Date Labels helper ──────────────────────────────────────────────────────
  const formatMonthName = (monthStr: string) => {
    try {
      const date = new Date(monthStr + '-02');
      return date.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    } catch {
      return monthStr.toUpperCase();
    }
  };

  const monthLabel = formatMonthName(currentMonth);

  // ─── Sharing Loop Implementation (Phase 3) ──────────────────────────────────
  const exportKinyWrap = async () => {
    const node = cardRef.current;
    if (!node) return;
    
    setExporting(true);
    try {
      const dataUrl = await toPng(node, { 
        quality: 0.98, 
        backgroundColor: '#000000',
        pixelRatio: 3
      });
      
      const link = document.createElement('a');
      link.download = `KINY-Wrap-June-${currentMonth}.png`;
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

    setExporting(true);
    try {
      const dataUrl = await toPng(node, {
        quality: 0.98,
        backgroundColor: '#000000',
        pixelRatio: 3
      });

      const shareText = "My KINY Wrap dropped! My finance no dey bleed abeg. 🛡️ Check your own: https://kiny.os";
      
      const file = dataURLtoFile(dataUrl, 'KINY-Wrap-June.png');

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My KINY Wrap is active!',
          text: shareText
        });
      } else {
        // Fallback: Web/API WhatsApp sharing link
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error('[KINY] Share native failed, fallback to text redirect:', err);
      const fallbackUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent("My KINY Wrap dropped! Check your own: https://kiny.os")}`;
      window.open(fallbackUrl, '_blank');
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('kiny-wrap-dismissed', 'true');
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="flex flex-col items-center max-w-sm w-full space-y-4 my-8">
        
        {/* Card Canvas element (Phase 2 & 3 target) */}
        <div 
          ref={cardRef}
          id="kiny-wrap-june-canvas" 
          className="w-full text-white p-6 border-4 border-black rounded-none font-mono flex flex-col justify-between space-y-5 select-none shadow-[6px_6px_0px_0px_#ffffff] relative overflow-hidden"
          style={{ 
            backgroundColor: config.color,
            ...getPatternStyle(config.bg_texture)
          }}
        >
          {/* 1. Header (Dynamic jigsaw style) */}
          <div className={headerClassApplied}>
            {headerDecoration}
            <div className="flex items-center justify-center gap-1.5 text-white text-sm font-black tracking-wider uppercase">
              <Sparkles className="h-4 w-4 shrink-0 text-[#C6EF4E]" />
              <span>KINY_OS // WRAPPED</span>
              <Sparkles className="h-4 w-4 shrink-0 text-[#C6EF4E]" />
            </div>
            <div className="text-[8px] text-zinc-300 mt-1 uppercase font-bold tracking-widest">
              {wrapMode === 'launch-week' ? 'LAUNCH WEEK SPECIAL' : '3-MONTH DEEP DIVE'}
            </div>
            <div className="text-[10px] bg-black text-white border border-zinc-700 font-extrabold py-0.5 px-2 mt-2 inline-block uppercase">
              {monthLabel}
            </div>
          </div>

          {/* User Tracker Identifiers */}
          <div className="space-y-1 text-xs border-b border-black/40 pb-2 uppercase">
            <div className="flex justify-between font-bold">
              <span className="text-zinc-300">Hustler:</span>
              <span className="text-[#C6EF4E]">{profile?.name || 'USER'}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-zinc-300">Hustle Track:</span>
              <span className="text-white">{profile?.income_type || 'SALARY'}</span>
            </div>
          </div>

          {/* 2. Streak Master Card (Dynamic Icon and Color) */}
          <div className="border-2 border-black bg-zinc-950/95 p-4 rounded-none space-y-2 relative overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-zinc-400 font-bold uppercase">🔥 MAX_STREAK_THIS_MONTH</span>
              <div className="p-1 bg-black border border-zinc-800 rounded-full">
                {getIcon()}
              </div>
            </div>
            <div className="text-xl font-black tracking-wide text-white">
              {maxStreak} consecutive days
            </div>
          </div>

          {/* 3. Cash Waka Chart (Block Chart with isometric highlights) */}
          <div className="border-2 border-black bg-zinc-950/95 p-4 rounded-none space-y-3.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <span className="text-[9px] text-zinc-400 font-bold uppercase">📊 CASH_WAKA_BLOCKS</span>
              <span className="text-zinc-500 text-[8px] font-bold uppercase">DISTRIBUTION</span>
            </div>
            <div className="space-y-3 pt-0.5">
              {[...slicesData].sort((a,b) => b.amount - a.amount).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                    <span className="text-white">{item.name}</span>
                    <span className="text-zinc-400">₦{item.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })} ({item.percentage}%)</span>
                  </div>
                  {/* Isometric bar block style */}
                  <div className="relative h-4 w-full bg-zinc-900 border border-black transform -skew-x-6 overflow-visible">
                    <div 
                      className="h-full border-r border-black relative transition-all duration-300"
                      style={{ 
                        width: `${Math.max(5, item.percentage)}%`,
                        backgroundColor: config.color,
                      }}
                    >
                      <div className="absolute -top-[2px] left-[1px] right-0 h-[1.5px] bg-white opacity-40" />
                      <div className="absolute top-0 right-0 bottom-0 w-[2px] bg-black opacity-30" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Persona Badge & Localized Slang Card */}
          <div className="border-2 border-black bg-white text-black p-4 rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center relative">
            <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">
              YOUR JUNE PERSONA
            </div>
            <div className="text-base font-black uppercase tracking-wide my-1" style={{ color: config.color }}>
              {config.name}
            </div>
            <div className="text-[10px] leading-relaxed font-bold uppercase mt-2 border-t border-dashed border-zinc-300 pt-2 px-1">
              &ldquo;{config.slang}&rdquo;
            </div>
          </div>

          {/* Stamp/Footer details */}
          <div className="pt-1 text-center flex flex-col items-center opacity-85">
            <span className="text-[8px] text-zinc-300 uppercase tracking-widest font-bold">
              POWERED BY KINY.OS // DIGITAL LEDGER
            </span>
            <span className="text-[7px] text-zinc-400 mt-0.5 uppercase font-bold">
              VERIFIED SECURE via SUPABASE PG_CRYPTO
            </span>
          </div>
        </div>

        {/* 5. Share Loop Action Controls */}
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
              disabled={exporting}
              className="w-full py-3 bg-[#25D366] text-white border-2 border-black font-mono font-bold text-xs uppercase shadow-[3px_3px_0px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="h-4 w-4 shrink-0" />
              WhatsApp Share
            </button>
          </div>

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
