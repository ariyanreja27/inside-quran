import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, SquarePen, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotes, useSettings } from '@/hooks/useAppStore';
import { useSurahs, useSurahVerses } from '@/hooks/useQuranData';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TajweedText } from '@/components/TajweedText';
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                onClick={() => navigate(`/note-builder?id=${note.id}`)} 
                className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground transition shadow-sm outline-none"
                aria-label="Edit Note"
              >
                <SquarePen size={14} />
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button 
                    className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-destructive transition shadow-sm outline-none"
                    aria-label="Delete Note"
                  >
                    <Trash2 size={14} />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] border-none bg-white dark:bg-background shadow-2xl p-6">
                <AlertDialogHeader className="space-y-2">
                  <AlertDialogTitle className="text-left text-lg font-bold">Delete Note?</AlertDialogTitle>
                  <AlertDialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                    Are you sure you want to delete the personal note for <strong>Surah {surah?.name} {note.verseNumber}</strong>? This note will be permanently erased.
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
        </div>

        <div className="px-5 max-w-lg mx-auto overflow-hidden">
          <h2 className="font-display font-medium text-[20px] text-foreground text-center mb-6">
            Surah {surah?.name.replace('Surah ', '')} : Verse {note.verseNumber}
          </h2>

          <div className="space-y-6">
            {/* Verse Text Box */}
            <div className="bg-card/50 dark:bg-card/30 rounded-[2rem] p-6 py-7 flex items-center justify-center shadow-[0_2px_15px_rgba(0,0,0,0.02)] mb-6 border border-border/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 blur-xl" />
              {isVersesLoading ? (
                <div className="w-full h-12 bg-muted/20 animate-pulse rounded-full" />
              ) : (
                <div 
                  className="arabic-text text-sm text-center text-foreground w-full" 
                  style={{ fontSize: 26, lineHeight: 2.2, wordSpacing: '1px' }}
                >
                  <TajweedText text={verse?.text || ''} showColors={settings.showTajweed} />
                </div>
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
                  prose-a:text-primary prose-a:underline-offset-4 prose-a:break-all
                  prose-li:marker:text-primary
                  break-words overflow-x-hidden"
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
