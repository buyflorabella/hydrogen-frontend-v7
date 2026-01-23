import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

interface FeatureFlags {
  bookmarkIcon: boolean;
  abandonedCartPopup: boolean;
  abandonedCartTrigger: 'exit' | 'tab-switch';
  discountDisplay: boolean;
  wishlistIcon: boolean;
  whatsappWidget: boolean;
  surveyPopup: boolean;
}

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  updateFlag: (key: keyof FeatureFlags, value: boolean | string) => void;
  resetFlags: () => void;
}

const defaultFlags: FeatureFlags = {
  bookmarkIcon: true,
  abandonedCartPopup: false,
  abandonedCartTrigger: 'exit',
  discountDisplay: true,
  wishlistIcon: true,
  whatsappWidget: false,
  surveyPopup: false,
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved: string | null = localStorage.getItem('featureFlags');
    if (saved) {
      try {
        setFlags(JSON.parse(saved) as FeatureFlags);
      } catch (e) {
        console.error("Failed to parse FeatureFlags from localStorage:", e);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('featureFlags', JSON.stringify(flags));
    }
  }, [flags, isHydrated]);

  const updateFlag = (key: keyof FeatureFlags, value: boolean | string) => {
    setFlags(prev => ({ 
      ...prev, 
      [key]: value 
    }));
  };

  const resetFlags = () => {
    setFlags(defaultFlags);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('featureFlags');
    }
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, updateFlag, resetFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return context;
}