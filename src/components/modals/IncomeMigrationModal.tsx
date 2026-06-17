import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAppStore } from '../../store';
import { BentoCard } from '../shared/BentoCard';
import { HelpCircle } from 'lucide-react';

export function IncomeMigrationModal() {
  const user = useAppStore(s => s.auth.user);
  const fetchProfile = useAppStore(s => s.fetchProfile);
  
  const [selectedType, setSelectedType] = useState<'WEEKEND_SHIFT' | 'FLUID_ROLLING'>('WEEKEND_SHIFT');
  const [selectedDay, setSelectedDay] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleMigrationSubmit = async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          income_type: selectedType,
          anchor_day: selectedType === 'WEEKEND_SHIFT' ? selectedDay : 1,
          fluid_window_days: selectedType === 'FLUID_ROLLING' ? 30 : null,
          last_reset_date: new Date().toISOString().split('T')[0] // Seed the cycle baseline
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Refresh the local store state so the modal closes reactively
      await fetchProfile();
    } catch (err) {
      console.error('[KINY] Migration failed:', err);
      setErrorMsg((err as Error).message || 'Profile migration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#000000] p-4 overflow-y-auto">
      <div className="w-full max-w-[460px]">
        <BentoCard hoverEffect={false} className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_#C6EF4E] rounded-none space-y-6">
          
          {/* Header */}
          <div className="border-b-4 border-black pb-4 text-left">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-black uppercase tracking-wide text-black flex items-center gap-2">
              ⚠️ PROFILE_MIGRATION_REQUIRED
            </h2>
            <p style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-gray-700 font-bold mt-1 uppercase">
              Configure cycle anchors to activate the new Kiny OS dynamic financial cycle engine
            </p>
          </div>

          {/* Form Content */}
          <div className="space-y-4 text-left">
            <div>
              <label 
                style={{ fontFamily: 'var(--font-mono)' }}
                className="block text-xs font-black tracking-wider text-black uppercase mb-2"
              >
                SELECT_INCOME_CYCLE_MODEL
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedType('WEEKEND_SHIFT')}
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className={`py-3 px-4 text-xs font-black border-2 border-black transition-all duration-100 uppercase text-center flex flex-col justify-center items-center gap-1 cursor-pointer ${
                    selectedType === 'WEEKEND_SHIFT'
                      ? 'bg-[#C6EF4E] text-black shadow-[4px_4px_0px_0px_#000000] translate-x-[1px] translate-y-[1px]'
                      : 'bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000000]'
                  }`}
                >
                  <span className="font-extrabold text-[13px]">[ SALARY_EARNER ]</span>
                  <span className="text-[9px] opacity-75 font-semibold font-mono">WEEKEND_SHIFT PAYDAY</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('FLUID_ROLLING')}
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className={`py-3 px-4 text-xs font-black border-2 border-black transition-all duration-100 uppercase text-center flex flex-col justify-center items-center gap-1 cursor-pointer ${
                    selectedType === 'FLUID_ROLLING'
                      ? 'bg-[#C6EF4E] text-black shadow-[4px_4px_0px_0px_#000000] translate-x-[1px] translate-y-[1px]'
                      : 'bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000000]'
                  }`}
                >
                  <span className="font-extrabold text-[13px]">[ BUSINESS_OWNER ]</span>
                  <span className="text-[9px] opacity-75 font-semibold font-mono">FLUID_ROLLING WINDOW</span>
                </button>
              </div>
            </div>

            {/* Conditional Sub-options */}
            {selectedType === 'WEEKEND_SHIFT' ? (
              <div className="p-4 border-2 border-black bg-yellow-50/50 space-y-2">
                <label 
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="block text-xs font-black tracking-wider text-black uppercase"
                >
                  PAYDAY_ANCHOR_DAY (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={selectedDay}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setSelectedDay(isNaN(val) ? 1 : Math.max(1, Math.min(31, val)));
                  }}
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="w-full px-3 py-2 bg-white border-2 border-black text-black outline-none focus:shadow-[2px_2px_0px_0px_#000000] font-bold text-sm"
                />
                <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[9px] text-gray-500 font-bold uppercase leading-relaxed">
                  Reset boundary will Shift Friday if anchor day falls on Saturday, or Monday if on Sunday.
                </p>
              </div>
            ) : (
              <div className="p-4 border-2 border-black bg-green-50/50 space-y-1">
                <div style={{ fontFamily: 'var(--font-mono)' }} className="text-xs font-black uppercase text-black flex items-center gap-1">
                  <HelpCircle size={14} /> ROLLING_WINDOW_CONFIGURATION
                </div>
                <div style={{ fontFamily: 'var(--font-mono)' }} className="text-[11px] text-gray-700 font-extrabold uppercase mt-1">
                  Active window width: <span className="bg-[#C6EF4E] text-black px-1.5 py-0.5 border border-black font-black">30 DAYS WINDOW</span>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[9px] text-gray-500 font-bold uppercase mt-2 leading-relaxed">
                  Calculates running totals and surplus indicators dynamically for the past 30 days. No monthly rollover blocks enforced.
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleMigrationSubmit}
            disabled={isLoading}
            style={{ fontFamily: 'var(--font-display)' }}
            className={`w-full py-4 text-sm font-black tracking-widest uppercase border-4 border-black transition-all duration-100 flex items-center justify-center gap-2 cursor-pointer ${
              isLoading
                ? 'bg-gray-200 text-gray-500 cursor-wait animate-pulse'
                : 'bg-black text-[#C6EF4E] shadow-[4px_4px_0px_0px_#C6EF4E] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#C6EF4E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#C6EF4E]'
            }`}
          >
            {isLoading ? 'INITIALIZING_CYCLE_ENGINE...' : '[ INITIALIZE_CYCLE_ENGINE ]'}
          </button>

          {/* Errors */}
          {errorMsg && (
            <div 
              style={{ fontFamily: 'var(--font-mono)' }}
              className="bg-red-50 border-2 border-red-500 text-red-600 p-3 text-xs font-bold text-center uppercase"
            >
              MIGRATION_ERROR: {errorMsg}
            </div>
          )}
        </BentoCard>
      </div>
    </div>
  );
}
