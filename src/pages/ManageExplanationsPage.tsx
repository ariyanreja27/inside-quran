import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, FileText, Search, BookOpen, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExplanations } from '@/hooks/useAppStore';
import { useSurahs } from '@/hooks/useQuranData';
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

export default function ManageExplanationsPage() {
  const navigate = useNavigate();
  const { explanations, deleteExplanation } = useExplanations();
  const { data: surahs } = useSurahs();
  const [searchQuery, setSearchQuery] = useState('');

  // Group explanations by Surah
  const groupedExplanations = explanations.reduce((acc, exp) => {
    if (!acc[exp.surahNumber]) acc[exp.surahNumber] = [];
    acc[exp.surahNumber].push(exp);
    return acc;
  }, {} as Record<number, typeof explanations>);

  const getSurahName = (num: number) => surahs?.find(s => s.number === num)?.name || `Surah ${num}`;
  const getSurahArabic = (num: number) => surahs?.find(s => s.number === num)?.nameArabic || '';

  const filteredSurahNumbers = Object.keys(groupedExplanations)
    .map(Number)
    .filter(num => {
      const name = getSurahName(num).toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || num.toString().includes(query);
    })
    .sort((a, b) => a - b);

  const handleDelete = (id: string) => {
    deleteExplanation(id);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/60 pb-2">
        <div className="flex items-center gap-3 px-4 h-16 pt-2">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 -ml-2 rounded-xl transition hover:bg-accent text-foreground"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-[20px] font-semibold text-foreground flex-1">
            Manage Explanations
          </h1>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-md mx-auto space-y-6">
        
        {/* Search & Add New */}
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search by Surah"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <button 
            onClick={() => navigate('/explanation-builder')}
            className="bg-primary text-primary-foreground px-4 rounded-2xl flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap gap-2 font-medium text-[14px]"
          >
            <Plus size={18} /> Add New
          </button>
        </div>

        {/* Explanations List */}
        {explanations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="text-muted-foreground" />
            </div>
            <p className="text-[15px] font-medium text-foreground mb-1">No explanations yet</p>
            <p className="text-[13px] text-muted-foreground">Start deep-diving into the Quran by adding your first explanation.</p>
          </div>
        ) : filteredSurahNumbers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-[15px] text-muted-foreground">No matching explanations found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredSurahNumbers.map(surahNum => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={`group-${surahNum}`} 
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-border/40">
                    <h3 className="font-semibold text-[14px] text-muted-foreground flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold tabular-nums">
                        {surahNum}
                      </span>
                      {getSurahName(surahNum)}
                    </h3>
                    <span className="font-arabic text-primary/70 text-lg">
                      {getSurahArabic(surahNum)}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {groupedExplanations[surahNum].map(exp => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={exp.id}
                          className="bg-card border border-border rounded-[1.2rem] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4 group hover:border-primary/20 transition-colors"
                        >
                          <div className="flex-1 flex items-center min-w-0 pr-4">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-primary font-medium text-[13px] border border-primary/10 shadow-sm">
                              <Bookmark size={14} className="opacity-70" />
                              Verse {exp.verseRange || (exp.verses || (exp as unknown as Record<string, number[]>).ayahs || []).join(', ')}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <button 
                              onClick={() => navigate(`/explanation-view?id=${exp.id}`)}
                              className="h-9 px-3 flex items-center justify-center gap-1.5 rounded-xl bg-primary/5 text-primary hover:bg-primary/20 transition-colors font-medium text-[13px] border border-primary/10 shadow-sm"
                              aria-label="View"
                            >
                              <BookOpen size={16} />
                              View
                            </button>
                            <button 
                              onClick={() => navigate(`/explanation-builder?id=${exp.id}`)}
                              className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                              aria-label="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button 
                                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                  aria-label="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-[1.5rem]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Explanation?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete your explanation for <strong>Surah {getSurahName(surahNum)} Verse {exp.verseRange || (exp.verses || (exp as unknown as Record<string, number[]>).ayahs || []).join(', ')}</strong>? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex gap-2 sm:gap-0 mt-2">
                                  <AlertDialogCancel className="rounded-xl border-border h-11">Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(exp.id)}
                                    className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground h-11"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
