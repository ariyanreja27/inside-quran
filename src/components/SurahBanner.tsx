import React from 'react';

interface SurahBannerProps {
  surahNumber: number;
}

export function SurahBanner({ surahNumber }: SurahBannerProps) {
  return (
    <div className="relative w-full max-w-[600px] mx-auto my-6 flex items-center justify-center">
      {/* Background Ornate Frame SVG */}
      <svg 
        viewBox="0 0 800 120" 
        className="w-full h-auto drop-shadow-sm text-amber-800/80 dark:text-amber-500/80" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Main Box outline */}
        <rect x="5" y="5" width="790" height="110" rx="10" stroke="currentColor" strokeWidth="2" fill="url(#banner-bg)" opacity="0.9" />
        
        {/* Inner Box outline */}
        <rect x="15" y="15" width="770" height="90" rx="5" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />

        {/* Left Rosette */}
        <g transform="translate(60, 60)">
          <circle cx="0" cy="0" r="40" fill="#fff" fillOpacity="0.8" className="dark:fill-black" />
          <path d="M0 -35 C10 -15 20 -10 35 0 C20 10 10 15 0 35 C-10 15 -20 10 -35 0 C-20 -10 -10 -15 0 -35 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
          <path d="M0 -25 C5 -10 10 -5 25 0 C10 5 5 10 0 25 C-5 10 -10 5 -25 0 C-10 -5 -5 -10 0 -25 Z" stroke="currentColor" strokeWidth="1" fill="none" />
          <circle cx="0" cy="0" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        </g>

        {/* Right Rosette */}
        <g transform="translate(740, 60)">
          <circle cx="0" cy="0" r="40" fill="#fff" fillOpacity="0.8" className="dark:fill-black" />
          <path d="M0 -35 C10 -15 20 -10 35 0 C20 10 10 15 0 35 C-10 15 -20 10 -35 0 C-20 -10 -10 -15 0 -35 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
          <path d="M0 -25 C5 -10 10 -5 25 0 C10 5 5 10 0 25 C-5 10 -10 5 -25 0 C-10 -5 -5 -10 0 -25 Z" stroke="currentColor" strokeWidth="1" fill="none" />
          <circle cx="0" cy="0" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        </g>

        {/* Decorative floral lines on left and right borders connecting to center */}
        <path d="M 100 60 Q 150 20 200 60 T 300 60" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M 100 60 Q 150 100 200 60 T 300 60" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />

        <path d="M 700 60 Q 650 20 600 60 T 500 60" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M 700 60 Q 650 100 600 60 T 500 60" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />

        {/* Center Name Box */}
        <path d="M 280 15 L 520 15 L 540 60 L 520 105 L 280 105 L 260 60 Z" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeWidth="1.5" />

        <defs>
          <pattern id="banner-bg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="currentColor" fillOpacity="0.03" />
            <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
          </pattern>
        </defs>
      </svg>

      {/* Actual Text Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="surah-calligraphy text-amber-950 dark:text-amber-100 drop-shadow-sm transform -translate-y-1">
          surah{surahNumber.toString().padStart(3, '0')} surah-icon
        </span>
      </div>
    </div>
  );
}
