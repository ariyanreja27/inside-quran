import React from 'react';

// Common mapping for core Tajweed rules based on the specific reference app
// We intentionally leave out madda, silent letters, and hamzatul wasl so they inherit standard colors and prevent 'rainbow' clutter.
const tajweedColorMap: Record<string, string> = {
  g: '#F57C00', // Ghunnah (Nasalisation) - Orange
  f: '#1976D2', // Ikhfa (Lenition/Hiding) - Blue
  c: '#1976D2', // Ikhfa Shafawi - Blue
  a: '#2E7D32', // Idgham with Ghunnah - Green
  w: '#2E7D32', // Idgham Mutajanisayn / Mutaqaribayn - Green
  u: '#757575', // Idgham without Ghunnah - Gray
  i: '#9C27B0', // Iqlab (Assimilation/Flipping) - Purple/Magenta
  q: '#D32F2F', // Qalqalah (Echoing) - Red
};

interface TajweedTextProps {
  text: string;
  showColors: boolean;
  waqf?: string; // kept in type for compatibility but no longer rendered
}

export function TajweedText({ text, showColors }: TajweedTextProps) {
  const parseTajweed = (textStr: string) => {
    if (!textStr) return null;
    
    // Normalize Alif Wasla (ٱ U+0671) & Alef with wavy hamza (ٲ U+0672) → plain Alif (ا U+0627)
    // These glyphs often render incorrectly in various fonts
    const normalized = textStr.replace(/[\u0671\u0672]/g, '\u0627');

    // Quick check: if not using quran-tajweed edition, just return text
    if (!normalized.includes('[')) return normalized;

    // Matches: [ruleCode[:id][textToColorize]]
    // E.g., [h:1[ٱ] => code = h, content = ٱ
    const regex = /\[([a-z]+)(?::\d+)?\[([^\]]+)\]/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(normalized)) !== null) {
      if (match.index > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`} className="font-arabic">
            {normalized.substring(lastIndex, match.index)}
          </span>
        );
      }

      const code = match[1];
      const content = match[2];

      if (showColors) {
        // Apply inline color if found, else apply default inherit
        const color = tajweedColorMap[code] || 'inherit';
        elements.push(
          <span key={`tj-${match.index}`} style={{ color }} className="font-arabic transition-colors duration-300">
            {content}
          </span>
        );
      } else {
        elements.push(
          <span key={`tj-${match.index}`} className="font-arabic">
            {content}
          </span>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < normalized.length) {
      elements.push(
        <span key={`text-${lastIndex}`} className="font-arabic">
          {normalized.substring(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  return (
    <>
      {parseTajweed(text)}
    </>
  );
}
