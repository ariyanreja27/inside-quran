import { Verse, Word } from '@/types/quran';
import { useSettings } from '@/hooks/useAppStore';

interface WordByWordVerseProps {
  verse: Verse;
  showTransliteration: boolean;
  onWordClick?: (word: Word) => void;
}

export function WordByWordVerse({ verse, showTransliteration, onWordClick }: WordByWordVerseProps) {
  const { settings } = useSettings();

  return (
    <div className="flex flex-wrap flex-row-reverse justify-center gap-y-8 gap-x-4 py-4 w-full">
      {verse.words?.map((word) => (
        <button 
          key={word.id} 
          onClick={() => onWordClick?.(word)}
          className="flex flex-col items-center min-w-[60px] hover:bg-secondary/20 rounded-2xl p-2 transition-all active:scale-95"
          aria-label={`Word detail: ${word.transliteration}`}
        >
          <span 
            className="arabic-text text-foreground mb-1"
            style={{ 
              fontSize: `${settings.arabicFontSize}px`,
              lineHeight: 1.5
            }}
          >
            {word.text}
          </span>
          <div className="flex flex-col items-center gap-1.5 mt-1">
            {showTransliteration && (
              <span className="text-[12px] text-primary/80 font-serif italic text-center leading-snug tracking-tight">
                {word.transliteration}
              </span>
            )}
            <span className="text-[13px] text-muted-foreground font-normal text-center leading-snug max-w-[100px]">
              {word.translation}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
