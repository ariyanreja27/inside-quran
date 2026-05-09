import React from 'react';

export function AyahMarker({ number }: { number: string }) {
  return (
    <span className="inline-flex items-center justify-center relative align-middle" style={{ width: '1.3em', height: '1.3em', margin: '0 0.15em' }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-sm text-amber-700/60 dark:text-amber-500/60" fill="currentColor">
        {/* Outer dotted ring */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" opacity="0.5" />
        
        {/* Main geometric star/flower */}
        <path d="M50 8 C55 20 65 25 75 25 C75 35 80 45 92 50 C80 55 75 65 75 75 C65 75 55 80 50 92 C45 80 35 75 25 75 C25 65 20 55 8 50 C20 45 25 35 25 25 C35 25 45 20 50 8 Z" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinejoin="round" 
        />
        
        {/* Inner circle */}
        <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
        
        {/* Inner intricate pattern (simplified lines) */}
        <path d="M50 18 L50 25 M50 82 L50 75 M18 50 L25 50 M82 50 L75 50 M28 28 L33 33 M72 72 L67 67 M28 72 L33 67 M72 28 L67 33" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          opacity="0.6" 
        />
      </svg>
      {/* Number placed in center */}
      <span className="absolute inset-0 flex items-center justify-center font-bold text-amber-950 dark:text-amber-100" style={{ fontSize: '0.6em', marginTop: '0.1em' }}>
        {number}
      </span>
    </span>
  );
}
