import { createContext, useContext, useState, type ReactNode } from 'react';

interface UpgradeDrawerContextValue {
  isOpen:    boolean;
  openFrom:  string; // which feature triggered the open
  open:  (featureName: string) => void;
  close: () => void;
}

const UpgradeDrawerContext = createContext<UpgradeDrawerContextValue>({
  isOpen: false, openFrom: '', open: () => {}, close: () => {}
});

export function UpgradeDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen,   setIsOpen]   = useState(false);
  const [openFrom, setOpenFrom] = useState('');

  return (
    <UpgradeDrawerContext.Provider value={{
      isOpen,
      openFrom,
      open:  (name) => { setOpenFrom(name); setIsOpen(true); },
      close: () => setIsOpen(false),
    }}>
      {children}
    </UpgradeDrawerContext.Provider>
  );
}

export const useUpgradeDrawer = () => useContext(UpgradeDrawerContext);
