import React from 'react';

interface PagePillProps {
  leftText: string;
  rightText: string;
}

export function PagePill({ leftText, rightText }: PagePillProps) {
  return (
    <div className="relative inline-flex items-center justify-center my-6 h-8 min-w-[200px]">
      {/* Background Ornate Frame SVG */}
      <svg 
        className="absolute inset-0 w-full h-full drop-shadow-sm text-amber-800/60 dark:text-amber-500/60" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <rect x="2" y="2" width="100%" height="100%" rx="14" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.05" />
        <rect x="4" y="4" width="calc(100% - 8px)" height="calc(100% - 8px)" rx="12" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6" />
      </svg>
      
      {/* Side Decorative Elements (Left) */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-8 text-amber-800/80 dark:text-amber-500/80">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" opacity="0.2">
          <circle cx="12" cy="12" r="8" />
        </svg>
        <svg viewBox="0 0 24 24" className="w-5 h-5 absolute" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 4 L16 12 L12 20 L8 12 Z" />
        </svg>
      </div>

      {/* Side Decorative Elements (Right) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-8 text-amber-800/80 dark:text-amber-500/80">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" opacity="0.2">
          <circle cx="12" cy="12" r="8" />
        </svg>
        <svg viewBox="0 0 24 24" className="w-5 h-5 absolute" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 4 L16 12 L12 20 L8 12 Z" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center w-full px-8 h-full">
        <div className="flex-1 text-center font-display text-[11px] font-bold text-amber-950 dark:text-amber-100 tracking-wider">
          {leftText}
        </div>
        <div className="w-px h-4 bg-amber-800/30 mx-2" />
        <div className="flex-1 text-center font-display text-[11px] font-bold text-amber-950 dark:text-amber-100 tracking-wider">
          {rightText}
        </div>
      </div>
    </div>
  );
}
