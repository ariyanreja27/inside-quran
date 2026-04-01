import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurahs, useSurahVerses } from '@/hooks/useQuranData';
import { useNotes, useSettings } from '@/hooks/useAppStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
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

  const isMinLengthMet = content.trim().length >= 10;
  const hasMeaningfulChange = editId ? content.trim() !== originalContent.trim() : true;
  const canSave = selectedSurah && selectedVerse && isMinLengthMet && hasMeaningfulChange;

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-background pb-24"
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
                verses?.map(v => {
                  const isUsed = notes.some(n => n.surahNumber === selectedSurah && n.verseNumber === v.numberInSurah && n.id !== editId);
                  return (
                    <SelectItem 
                      key={v.numberInSurah} 
                      value={v.numberInSurah.toString()} 
                      disabled={isUsed}
                      className="rounded-xl py-3 data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed"
                    >
                      Verse {v.numberInSurah}
                    </SelectItem>
                  );
                })
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
              className="bg-muted/30 border border-border/60 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[80px] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 blur-xl" />
              <p 
                className="arabic-text text-2xl leading-[2.5] text-center text-foreground font-arabic" 
                dangerouslySetInnerHTML={{ __html: (verseData.text || '').replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '<span class="bismillah-text text-xl block -mb-2">﷽</span>') }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor Section */}
        <div className="bg-card border border-border rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
          <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">YOUR NOTE</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground transition-colors outline-none p-1">
                  <Info size={18} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-4 text-sm bg-popover border-border shadow-2xl rounded-[1.5rem] z-[100] outline-none" align="end">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground text-[14px] px-0.5">Markdown Guide</h4>
                  <div className="max-h-[260px] overflow-auto pr-1 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-y-1 pb-2">
                      {[
                        { s: "# H1", d: "Heading 1" },
                        { s: "## H2", d: "Heading 2" },
                        { s: "### H3", d: "Heading 3" },
                        { s: "**bold**", d: "Bold text" },
                        { s: "*italic*", d: "Italic text" },
                        { s: "***text***", d: "Bold & Italic" },
                        { s: "- item", d: "Bullet List" },
                        { s: "1. item", d: "Numbered List" },
                        { s: "- [ ] task", d: "Task List" },
                        { s: "> quote", d: "Blockquote" },
                        { s: "`code`", d: "Inline Code" },
                        { s: "```code```", d: "Code Block" },
                        { s: "[link](url)", d: "Hyperlink" },
                        { s: "---", d: "Divider Line" },
                        { s: "| a | b |", d: "Table Row" },
                        { s: "~~strike~~", d: "Strikethrough" },
                      ].map((item, i) => (
                        <div key={i} className="grid grid-cols-[90px,1fr] gap-x-3 items-center text-[12px] group py-2 border-b border-border/30 last:border-0 px-0.5">
                          <code className="bg-primary/5 text-primary px-1.5 py-0.5 rounded font-mono text-[11px] whitespace-nowrap flex-shrink-0 transition-colors justify-self-start">
                            {item.s}
                          </code>
                          <span className="text-muted-foreground text-right truncate transition-colors">{item.d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="relative">
            <textarea
              disabled={!selectedSurah || !selectedVerse}
              className="w-full bg-background/50 border border-border focus:border-primary rounded-xl p-4 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground min-h-[280px] resize-y outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={selectedVerse ? "Share your reflections here..." : "Select a Surah and Verse first to start writing..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {(!selectedSurah || !selectedVerse) ? (
              <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                {!selectedSurah ? "Please select a Surah first." : "Select a verse number first to write a note."}
              </p>
            ) : content.trim() && content.trim().length < 10 && (
              <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                Need {10 - content.trim().length} more characters.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Sticky Bottom Save Button */}
      <div className="fixed bottom-0 inset-x-0 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))] bg-background/80 backdrop-blur-md border-t border-border/50 z-[70]">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full py-[14px] rounded-full font-medium text-[16px] transition-all flex justify-center items-center ${
              canSave
                ? 'bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(var(--primary),0.25)]'
                : 'bg-secondary text-muted-foreground/80 cursor-not-allowed'
            }`}
          >
            Save Note
          </button>
        </div>
      </div>
    </motion.div>
  );
}
