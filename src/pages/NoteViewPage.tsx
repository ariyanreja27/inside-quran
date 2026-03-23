import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, SquarePen, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotes, useSettings } from '@/hooks/useAppStore';
import { useSurahs, useSurahVerses } from '@/hooks/useQuranData';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

export default function NoteViewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  
  const { notes, deleteNote } = useNotes();
  const { data: surahs } = useSurahs();
  const { settings } = useSettings();
  
  const note = notes.find(n => n.id === id);
  const surah = surahs?.find(s => s.number === note?.surahNumber);
  
  const { data: verses, isLoading: isVersesLoading } = useSurahVerses(note?.surahNumber || 0);
  const verse = verses?.find(v => v.numberInSurah === note?.verseNumber);

  if (!note) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground mb-4">Note not found, or it has been deleted.</p>
        <button 
          onClick={() => navigate('/manage?tab=notes')}
          className="bg-primary transition text-primary-foreground rounded-full px-6 py-3 font-medium shadow-sm"
        >
          Back to Notes
        </button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteNote(note.id);
    navigate('/manage?tab=notes', { replace: true });
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="min-h-screen bg-background pb-24"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pt-5 pb-4 mb-6 border-b border-border/50 shadow-sm transform-gpu">
          <div className="flex items-center justify-between px-5">
            <button 
              onClick={() => navigate(-1)} 
              className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground transition shadow-sm outline-none"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate(`/manage?tab=notes&edit=${note.id}`)} 
                className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground transition shadow-sm outline-none"
                aria-label="Edit Note"
              >
                <SquarePen size={14} />
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button 
                    className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-destructive/80 transition shadow-sm outline-none"
                    aria-label="Delete Note"
                  >
                    <Trash2 size={14} />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-[1.5rem]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this reflection? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex gap-2 sm:gap-0 mt-2">
                    <AlertDialogCancel className="rounded-xl border-border h-11">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="rounded-xl bg-destructive text-destructive-foreground h-11"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <div className="px-5 max-w-lg mx-auto overflow-hidden">
          <h2 className="font-display font-medium text-[20px] text-foreground text-center mb-6">
            Surah {surah?.name.replace('Surah ', '')} : Verse {note.verseNumber}
          </h2>

          <div className="space-y-6">
            {/* Verse Text Box */}
            <div className="bg-card/50 dark:bg-card/30 rounded-[2rem] p-6 pb-8 flex items-center justify-center min-h-[100px] shadow-[0_2px_15px_rgba(0,0,0,0.02)] mb-8 border border-border/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 blur-xl" />
              {isVersesLoading ? (
                <div className="w-full h-12 bg-muted/20 animate-pulse rounded-full" />
              ) : (
                <p 
                  className="font-arabic text-3xl leading-loose text-center text-foreground" 
                  style={{ fontSize: `${settings.arabicFontSize + 6}px` }}
                  dangerouslySetInnerHTML={{ __html: (verse?.text || '').replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '<span class="bismillah-text text-2xl block -mb-4">﷽</span>') }}
                />
              )}
            </div>

            {/* Translation */}
            <div className="px-2 mb-8">
              {isVersesLoading ? (
                <div className="h-4 w-3/4 mx-auto bg-muted/20 animate-pulse rounded" />
              ) : (
                <p 
                  className="italic font-display text-muted-foreground text-center text-[16px] leading-relaxed"
                  style={{ fontSize: `${settings.translationFontSize}px` }}
                >
                  "{verse?.translation}"
                </p>
              )}
            </div>

            {/* Note Content */}
            <div className="space-y-8 mt-10">
              <div 
                className="prose prose-sm max-w-none text-muted-foreground leading-[1.85] text-[16px]
                  prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground 
                  prose-headings:mt-8 prose-headings:mb-4
                  prose-strong:font-bold prose-strong:text-foreground 
                  prose-a:text-primary prose-a:underline-offset-4
                  prose-li:marker:text-primary"
                dir={settings.language === 'ur' ? 'rtl' : 'ltr'}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
