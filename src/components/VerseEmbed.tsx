import { useSurahVerses, useSurahs } from '@/hooks/useQuranData';
import { useSettings } from '@/hooks/useAppStore';
import { TajweedText } from './TajweedText';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface VerseEmbedProps {
  surah: number;
  ayah: number;
}

export function VerseEmbed({ surah: surahNumber, ayah: verseNumber }: VerseEmbedProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: verses, isLoading } = useSurahVerses(surahNumber);
  const { data: surahs } = useSurahs();
  const { settings } = useSettings();

  const verse = verses?.find(v => v.numberInSurah === verseNumber);
  const surahMeta = surahs?.find(s => s.number === surahNumber);

  if (isLoading) {
    return (
      <div className="my-6 p-4 rounded-2xl bg-muted/20 animate-pulse h-24 border border-border/50" />
    );
  }

  if (!verse) {
    return (
      <div className="my-6 p-3 rounded-xl bg-destructive/5 text-destructive text-[12px] border border-destructive/10">
        Verse [[{surahNumber}:{verseNumber}]] not found.
      </div>
    );
  }

  return (
    <div
      className="my-8 overflow-hidden rounded-[1.5rem] bg-card/60 border border-border/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
    >
      {/* Header Info - Clickable to toggle */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3 border-b border-border/40 bg-muted/30 flex justify-between items-center transition-colors hover:bg-muted/50 text-left outline-none"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="text-primary"
          >
            <ChevronDown size={14} />
          </motion.div>
          <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
            {surahMeta?.name} ({surahNumber}:{verseNumber})
          </span>
        </div>
        <span className="font-arabic text-primary text-[14px]">{surahMeta?.nameArabic}</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="p-6 space-y-5 border-t border-border/10">
              {/* Arabic Text - Reduced Font Size */}
              <div 
                className="arabic-text text-center text-foreground leading-[2.2]"
                style={{ fontSize: 19, wordSpacing: '1px' }}
              >
                <TajweedText text={verse.text} showColors={settings.showTajweed} />
              </div>

              {/* Translation */}
              <p className="text-[13px] leading-relaxed text-muted-foreground italic text-center px-4">
                "{verse.translation}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
