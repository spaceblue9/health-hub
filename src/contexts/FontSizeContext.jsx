import { createContext, useState, useEffect, useContext } from 'react';

const FontSizeContext = createContext();

export const FONT_SIZES = [
  { level: 1, label: 'ปกติ', size: '16px' },
  { level: 2, label: 'ใหญ่', size: '18px' },
  { level: 3, label: 'ใหญ่พิเศษ', size: '20px' }
];

export function FontSizeProvider({ children }) {
  const [fontLevel, setFontLevel] = useState(() => {
    const saved = localStorage.getItem('health_hub_font_level');
    return saved ? parseInt(saved) : 1;
  });

  useEffect(() => {
    const sizeConfig = FONT_SIZES.find(f => f.level === fontLevel) || FONT_SIZES[0];
    document.documentElement.style.fontSize = sizeConfig.size;
    localStorage.setItem('health_hub_font_level', fontLevel.toString());
  }, [fontLevel]);

  const increaseFontSize = () => {
    setFontLevel(prev => Math.min(prev + 1, FONT_SIZES.length));
  };

  const decreaseFontSize = () => {
    setFontLevel(prev => Math.max(prev - 1, 1));
  };

  const resetFontSize = () => {
    setFontLevel(1);
  };

  return (
    <FontSizeContext.Provider value={{ fontLevel, setFontLevel, increaseFontSize, decreaseFontSize, resetFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export const useFontSize = () => useContext(FontSizeContext);
