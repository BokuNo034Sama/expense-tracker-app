import React from 'react';

interface PaydayAnchorSelectProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function PaydayAnchorSelect({ value, onChange, disabled }: PaydayAnchorSelectProps) {
  const days = Array.from({ length: 7 }, (_, i) => i + 25); // days 25 to 31

  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        style={{ fontFamily: 'var(--font-mono)' }}
        className="w-full px-4 py-3 bg-[#000000] text-white dark:text-white border-2 border-[#C6EF4E] rounded-none outline-none font-bold text-sm transition-all duration-150 cursor-pointer focus:shadow-[0_0_0_3px_#C6EF4E] disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
      >
        {days.map((day) => (
          <option key={day} value={day} className="bg-[#000000] text-white">
            {day}th Day of Month
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#C6EF4E]">
        ▼
      </div>
    </div>
  );
}
