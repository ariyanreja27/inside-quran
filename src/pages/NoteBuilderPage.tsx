import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurahs, useSurahVerses } from '@/hooks/useQuranData';
import { useNotes, useSettings } from '@/hooks/useAppStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LoadingScreen from '@/components/LoadingScreen';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function NoteBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const urlSurah = searchParams.get('surah') ? parseInt(searchParams.get('surah')!) : null;
  const urlVerse = searchParams.get('verse') ? parseInt(searchParams.get('verse')!) : null;

  const { data: surahs } = useSurahs();
  const { notes, addNote, updateNote } = useNotes();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<number | ''>(urlSurah || '');
  const [selectedVerse, setSelectedVerse] = useState<number | ''>(urlVerse || '');
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  
  const { data: verses, isLoading: isVersesLoading } = useSurahVerses(selectedSurah || 1);
  const verseData = verses?.find(v => v.numberInSurah === selectedVerse);

  useEffect(() => {
    if (isLoaded) return;

    if (editId) {
      const existing = notes.find(n => n.id === editId);
      if (existing) {
        setSelectedSurah(existing.surahNumber);
        setSelectedVerse(existing.verseNumber);
        setContent(existing.content);
        setOriginalContent(existing.content);
      }
    }
    setIsLoaded(true);
  }, [editId, notes, isLoaded]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isMinWordsMet = wordCount >= 50;
  const hasMeaningfulChange = editId ? content.trim() !== originalContent.trim() : true;
  const canSave = selectedSurah && selectedVerse && isMinWordsMet && hasMeaningfulChange;

  const handleSave = () => {
    if (!canSave) return;

    if (editId) {
      updateNote(editId, content);
      toast({
        title: "Note Updated",
        description: "Your reflection has been successfully updated.",
      });
    } else {
      addNote(Number(selectedSurah), Number(selectedVerse), content);
      toast({
        title: "Note Saved",
        description: "Your reflection has been added to your journal.",
      });
    }
    navigate(-1);
  };

  if (!isLoaded || !surahs) {
    return <LoadingScreen message="Preparing Note Builder..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-32"
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border/60 pb-2">
        <div className="flex items-center gap-3 px-4 h-16 pt-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl transition text-foreground">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-[20px] font-semibold text-foreground flex-1">
            {editId ? 'Edit Note' : 'Add New Note'}
          </h1>
        </div>
      </div>

      <div className="px-5 mt-8 max-w-lg mx-auto space-y-8">
        {/* SURAH SELECTOR */}
        <div>
          <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">SURAH</label>
          <Select 
            value={selectedSurah ? selectedSurah.toString() : ''} 
            onValueChange={(v) => { setSelectedSurah(Number(v)); setSelectedVerse(''); }}
            disabled={!!editId}
          >
            <SelectTrigger className="w-full h-[56px] rounded-2xl bg-card border border-border px-4 font-medium shadow-sm transition-all focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder="Select a Surah" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] rounded-2xl p-2 border-border shadow-2xl">
              {surahs?.map(s => (
                <SelectItem key={s.number} value={s.number.toString()} className="rounded-xl py-3 cursor-pointer">
                  <div className="flex justify-between items-center w-full min-w-[200px]">
                    <span className="text-[15px] font-medium">{s.number}. {s.name}</span>
                    <span className="font-arabic text-primary text-lg pr-3">{s.nameArabic}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!selectedSurah && (
            <p className="text-destructive text-[12px] font-medium mt-2 ml-1">Please select a Surah first.</p>
          )}
        </div>
        
        {/* VERSE SELECTOR */}
        <div>
          <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">VERSE</label>
          <Select 
            disabled={!selectedSurah || !!editId} 
            value={selectedVerse ? selectedVerse.toString() : ''} 
            onValueChange={(v) => setSelectedVerse(Number(v))}
          >
            <SelectTrigger className="w-full h-[56px] rounded-2xl bg-card border border-border px-4 font-medium shadow-sm transition-all focus:ring-1 focus:ring-primary/20 disabled:opacity-50">
              <SelectValue placeholder={selectedSurah ? "Select a Verse" : "Select a Surah first"} />
            </SelectTrigger>
            <SelectContent className="max-h-[250px] rounded-2xl p-2 border-border shadow-2xl">
              {isVersesLoading ? (
                 <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Loading...</div>
              ) : (
                verses?.map(v => (
                  <SelectItem key={v.numberInSurah} value={v.numberInSurah.toString()} className="rounded-xl py-3 cursor-pointer">
                    Verse {v.numberInSurah}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {!selectedVerse && selectedSurah && (
            <p className="text-destructive text-[12px] font-medium mt-2 ml-1">Select a verse number first to write a note.</p>
          )}
        </div>

        {/* Verse Highlight Card */}
        <AnimatePresence>
          {verseData && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card/50 dark:bg-card/30 rounded-[2rem] p-6 pb-8 flex flex-col items-center justify-center min-h-[100px] shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-border/80 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 blur-xl" />
              <p 
                className="font-arabic text-3xl leading-loose text-center text-foreground mb-4" 
                style={{ fontSize: `${settings.arabicFontSize + 4}px` }}
                dangerouslySetInnerHTML={{ __html: (verseData.text || '').replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '<span class="bismillah-text text-2xl block -mb-4">﷽</span>') }}
              />
              <p className="italic font-display text-muted-foreground text-center text-[14px] leading-relaxed max-w-[90%]">
                "{verseData.translation}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center ml-1">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Your Note (Markdown)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors outline-none">
                    <Info size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-4 text-sm bg-popover border-border shadow-2xl rounded-2xl z-[100] outline-none" align="start">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground text-[14px]">Markdown Guide</h4>
                    <div className="grid grid-cols-2 gap-y-2 text-[12px]">
                      <code>**bold**</code> <code>*italic*</code>
                      <code># Heading 1</code> <code>## Heading 2</code>
                      <code>- bullet list</code> <code>1. list</code>
                      <code>{'>'} quote</code> <code>--- divider</code>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              {!isMinWordsMet && content.trim() && (
                <span className="text-[10px] text-orange-500 font-bold animate-pulse">
                  Need 50 words
                </span>
              )}
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter transition-all",
                isMinWordsMet ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
              )}>
                {wordCount} Words
              </span>
            </div>
          </div>
          
          <div className="relative">
            <textarea
              disabled={!selectedSurah || !selectedVerse}
              className="w-full h-80 bg-card border border-border rounded-[1.5rem] p-5 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/5 transition-all resize-none placeholder:text-muted-foreground/30 shadow-sm disabled:opacity-50 disabled:bg-muted/10 grayscale-[0.5]"
              placeholder={selectedVerse ? "Share your reflections here..." : "Select a Surah and Verse first to start writing..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {(!selectedSurah || !selectedVerse) && (
              <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                {!selectedSurah ? "Please select a Surah first." : "Select a verse number first to write a note."}
              </p>
            )}
          </div>
        </div>

        {/* Live Preview */}
        <AnimatePresence>
          {content.trim() && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pb-10"
            >
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Live Preview</label>
              <div 
                className="bg-card/30 border border-border/50 rounded-[1.5rem] p-6 prose prose-sm max-w-none text-muted-foreground leading-[1.8]
                  prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground 
                  prose-headings:mt-6 prose-headings:mb-3
                  prose-strong:font-bold prose-strong:text-foreground"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Bottom Save Button */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-background/80 backdrop-blur-md border-t border-border/50 z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-[16px] shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-[0.98] active:scale-95 flex items-center justify-center gap-2"
          >
            {editId ? 'Update Note' : 'Save Note'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
