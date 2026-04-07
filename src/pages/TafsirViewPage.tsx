import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { X, SquarePen, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurahVerses, useSurahs } from '@/hooks/useQuranData';
import { useSettings, useCustomTranslations, useCustomTafsirs, useTafsirSources } from '@/hooks/useAppStore';
import { TajweedText } from '@/components/TajweedText';
import type { TafsirRecord } from '@/hooks/useAppStore';

export default function TafsirViewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const surahNumber = searchParams.get('surah') ? Number(searchParams.get('surah')) : null;
  const verseNumber = searchParams.get('verse') ? Number(searchParams.get('verse')) : null;

  const { tafsirRecords, getTafsirRecord, deleteTafsirRecord } = useCustomTafsirs();
  const { sources } = useTafsirSources();
  const { data: surahs } = useSurahs();
  const { settings } = useSettings();
  const { getCustomTranslation } = useCustomTranslations();

  const [tafsir, setTafsir] = useState<TafsirRecord | null>(null);
  const [activeSourceId, setActiveSourceId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let match: TafsirRecord | undefined;
    if (editId) {
      match = tafsirRecords.find(t => t.id === editId);
    } else if (surahNumber && verseNumber) {
      match = getTafsirRecord(surahNumber, verseNumber);
    }
    setTafsir(match || null);
    
    if (match) {
        // Find the first source that has content
        const availableSources = Object.keys(match.tafsirs).filter(k => match!.tafsirs[k]?.trim().length > 0);
        if (availableSources.length > 0 && !activeSourceId) {
            setActiveSourceId(availableSources[0]);
        }
    }
  }, [editId, surahNumber, verseNumber, tafsirRecords, getTafsirRecord, activeSourceId]);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      if (tafsir) deleteTafsirRecord(tafsir.id);
      navigate(-1);
    }, 300);
  };

  const { data: currentSurahVerses } = useSurahVerses(tafsir?.surahNumber || 1);
  const surah = surahs?.find(s => s.number === tafsir?.surahNumber);
  const verseData = currentSurahVerses?.find(a => a.numberInSurah === tafsir?.verseNumber);

  // Available sources that actually contain notes for this verse
  const activeSourcesList = (tafsir?.sources || sources).filter(s => tafsir?.tafsirs[s.id]?.trim());

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const idx = activeSourcesList.findIndex(s => s.id === activeSourceId);
      if (idx !== -1 && idx < activeSourcesList.length - 1) setActiveSourceId(activeSourcesList[idx + 1].id);
    },
    onSwipedRight: () => {
      const idx = activeSourcesList.findIndex(s => s.id === activeSourceId);
      if (idx > 0) setActiveSourceId(activeSourcesList[idx - 1].id);
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 40,
  });

  if (!tafsir) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
         <p className="text-muted-foreground mb-4">Tafsir not found, or there are no notes here yet.</p>
         <button onClick={() => navigate(`/tafsir-builder${surahNumber && verseNumber ? `?surah=${surahNumber}&verse=${verseNumber}` : ''}`)} className="bg-primary transition text-primary-foreground rounded-full px-6 py-3 font-medium shadow-sm">Add Tafsir</button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {!isDeleting && (
        <motion.div {...handlers} exit={{ opacity: 0, scale: 0.96, y: 20 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="min-h-screen bg-background pb-24">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pt-5 pb-4 mb-6 border-b border-border/50 shadow-sm transform-gpu">
        {/* Top Floating Buttons */}
        <div className="flex items-center justify-between px-5 mb-5">
          <button onClick={() => navigate(-1)} className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground transition shadow-sm outline-none">
            <X size={16} />
          </button>
          
          <div className="flex items-center gap-2">
            <button 
               onClick={() => navigate(`/tafsir-builder?id=${tafsir.id}`)} 
               className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground transition shadow-sm outline-none"
               aria-label="Edit Tafsir"
            >
              <SquarePen size={14} />
            </button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button 
                  className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-destructive transition shadow-sm outline-none"
                  aria-label="Delete Tafsir"
                >
                  <Trash2 size={14} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] border-none bg-white dark:bg-background shadow-2xl p-6">
                <AlertDialogHeader className="space-y-2">
                  <AlertDialogTitle className="text-left text-lg font-bold">Delete Tafsir?</AlertDialogTitle>
                  <AlertDialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                    Are you sure you want to delete the Tafsir for <strong>Surah {surah?.name} {verseNumber}</strong>? Your written notes for this source will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-4">
                  <AlertDialogCancel className="h-10 px-6 rounded-full border-border bg-secondary/10 text-foreground text-[13px] font-medium hover:bg-secondary/20 transition-all">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="h-10 px-6 rounded-full bg-destructive text-destructive-foreground text-[13px] font-bold hover:bg-destructive/90 transition-all"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Tabs Row (Only showing active sources) */}
        <div className="px-5">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide w-full relative">
            {activeSourcesList.map((source) => {
              const isActive = activeSourceId === source.id;
              return (
                <motion.button
                  key={source.id}
                  onClick={() => setActiveSourceId(source.id)}
                  whileTap={{ scale: 0.98 }}
                  className={`relative whitespace-nowrap px-4 py-2 text-[14px] font-semibold rounded-full transition-colors tracking-wide z-10 outline-none ${
                    isActive 
                      ? 'text-primary-foreground' 
                      : 'bg-card text-muted-foreground border border-border'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTafsirViewTab"
                      className="absolute inset-0 bg-primary rounded-full shadow-sm z-[-1]"
                      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    />
                  )}
                  {source.name}
                </motion.button>
              );
            })}
            {activeSourcesList.length === 0 && (
              <p className="text-sm text-muted-foreground w-full text-center py-2">No notes available.</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto overflow-hidden">
        <h2 className="font-display font-medium text-[20px] text-foreground text-center mb-6">Surah {surah?.name.replace('Surah ', '')} : Verse {tafsir.verseNumber}</h2>

        <motion.div
          key={tafsir.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-12"
        >
            <div className="space-y-6">
                
                {/* Verse Text Box */}
                {verseData && (
                  <div className="bg-card/50 dark:bg-card/30 rounded-[2rem] p-6 py-7 flex items-center justify-center shadow-[0_2px_15px_rgba(0,0,0,0.02)] mb-6 border border-border/80 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 blur-xl" />
                    <div 
                      className="arabic-text text-sm text-center text-foreground w-full" 
                      style={{ fontSize: 26, lineHeight: 2.2, wordSpacing: '1px' }}
                    >
                      <TajweedText text={verseData.text} showColors={settings.showTajweed} />
                    </div>
                  </div>
                )}

                {/* Translation */}
                {verseData && (
                  <p className="italic font-display text-muted-foreground text-center text-[16px] leading-relaxed mb-8 px-2" style={{ fontSize: `${settings.translationFontSize}px` }}>
                     "{getCustomTranslation(tafsir.surahNumber, tafsir.verseNumber, settings.language) || verseData.translation}"
                  </p>
                )}

                {/* Explanations Rendering */}
                <div className="space-y-8 mt-10">
                    <AnimatePresence mode="wait">
                       {activeSourceId && tafsir.tafsirs[activeSourceId] && (
                          <motion.div 
                             key={activeSourceId} 
                             initial={{ opacity: 0, scale: 0.98 }} 
                             animate={{ opacity: 1, scale: 1 }} 
                             exit={{ opacity: 0, scale: 0.98 }}
                             transition={{ duration: 0.2 }}
                             className="prose prose-sm max-w-none text-muted-foreground leading-[1.85] text-[16px]
                              prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground 
                              prose-headings:mt-8 prose-headings:mb-4
                              prose-strong:font-bold prose-strong:text-foreground 
                              prose-a:text-primary prose-a:underline-offset-4 prose-a:break-all
                              prose-li:marker:text-primary
                              break-words overflow-x-hidden"
                             dir={settings.language === 'ur' ? 'rtl' : 'ltr'}
                          >
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{tafsir.tafsirs[activeSourceId]}</ReactMarkdown>
                          </motion.div>
                       )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
      </div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
