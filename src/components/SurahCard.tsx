import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { SurahMeta } from '@/data/quranMeta';

interface SurahCardProps {
  surah: SurahMeta;
  isFavorite: boolean;
  onToggleFavorite: (n: number) => void;
}

export default function SurahCard({ surah, isFavorite, onToggleFavorite }: SurahCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(surah.number * 0.02, 0.8), duration: 0.35 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      <Link 
        to={`/surah/${surah.number}`} 
        className="block group rounded-lg bg-card shadow-sm border border-border transition-all duration-200 hover:bg-accent/40 active:bg-accent/60 outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        <div className="flex items-center gap-4 p-4 pr-14">
          {/* Surah number circle */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full border border-border flex items-center justify-center bg-muted/30">
            <span className="text-xs font-mono text-muted-foreground tabular-nums">{surah.number}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[14.5px] text-foreground truncate">{surah.name}</span>
            </div>
            <span className="text-[12px] text-muted-foreground">{surah.meaning} • {surah.ayahCount} Ayahs</span>
          </div>

          {/* Arabic name */}
          <span className="font-arabic text-[22px] text-primary flex-shrink-0">{surah.nameArabic}</span>
        </div>
      </Link>

      {/* Favorite toggle - absolutely positioned to prevent link interactions */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite(surah.number);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full active:scale-90 transition-all focus:outline-none [-webkit-tap-highlight-color:transparent]"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Star
          className={`w-[18px] h-[18px] transition-colors ${isFavorite ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
        />
      </button>
    </motion.div>
  );
}
