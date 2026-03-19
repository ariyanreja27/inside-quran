import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Surah } from '@/types/quran';

interface SurahCardProps {
  surah: Surah;
  isFavorite: boolean;
  onToggleFavorite: (n: number) => void;
}

export default function SurahCard({ surah, isFavorite, onToggleFavorite }: SurahCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(surah.number * 0.01, 0.5) }}
    >
      <Link to={`/surah/${surah.number}`} className="block">
        <div className="surah-card flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary text-primary font-display font-semibold text-sm">
            {surah.number}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-foreground text-sm truncate">
                {surah.englishName}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {surah.revelationType}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {surah.englishNameTranslation} • {surah.numberOfAyahs} ayahs
            </p>
          </div>
          <p className="arabic-text text-lg text-primary font-arabic">{surah.name}</p>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(surah.number);
            }}
            className="p-1.5 rounded-full transition-colors hover:bg-secondary"
          >
            <Star
              size={16}
              className={isFavorite ? 'fill-gold text-gold' : 'text-muted-foreground'}
            />
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
