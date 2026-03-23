import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { ArrowLeft, Trash2, Edit2, Plus, AlertCircle, Info, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurahs, useSurahVerses } from '@/hooks/useQuranData';
import { useTafsirSources, useCustomTafsirs, useSettings } from '@/hooks/useAppStore';
import type { TafsirRecord } from '@/hooks/useAppStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import LoadingScreen from '@/components/LoadingScreen';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function TafsirBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const urlSurah = searchParams.get('surah') ? parseInt(searchParams.get('surah')!) : null;
  const urlVerse = searchParams.get('verse') ? parseInt(searchParams.get('verse')!) : null;

  const { data: surahs } = useSurahs();
  const { settings } = useSettings();
  const { tafsirRecords, getTafsirRecord, saveTafsirRecord } = useCustomTafsirs();
  const { sources, addSource, updateSource, deleteSource } = useTafsirSources();
  const { toast } = useToast();

  const [selectedSurah, setSelectedSurah] = useState<number | ''>(urlSurah || '');
  const [selectedVerse, setSelectedVerse] = useState<number | ''>(urlVerse || '');
  
  const [activeSourceId, setActiveSourceId] = useState<string>(() => sources.length > 0 ? sources[0].id : '');
  const [notes, setNotes] = useState<Record<string, string>>({});
  
  const [currentId, setCurrentId] = useState<string>(() => generateId());
  const [isLoaded, setIsLoaded] = useState(false);

  // Manage Sources State
  const [isManageSourcesOpen, setIsManageSourcesOpen] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [sourceEditText, setSourceEditText] = useState('');
  const [newSourceName, setNewSourceName] = useState('');

  const { data: currentSurahVerses } = useSurahVerses(selectedSurah || 1);

  // Manage browser back button for Drawer
  const handleDrawerOpenChange = (open: boolean) => {
    if (open) {
      window.history.pushState(null, '', '#manage-sources');
      setIsManageSourcesOpen(true);
    } else {
      if (window.location.hash === '#manage-sources') {
        window.history.back();
      }
      setIsManageSourcesOpen(false);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (isManageSourcesOpen) {
        setIsManageSourcesOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isManageSourcesOpen]);

  // Handle invalid or empty source selection
  useEffect(() => {
    if (sources.length > 0) {
      if (!activeSourceId || !sources.some(s => s.id === activeSourceId)) {
        setActiveSourceId(sources[0].id);
      }
    } else {
      setActiveSourceId('');
    }
  }, [sources, activeSourceId]);

  useEffect(() => {
    if (isLoaded) return;

    let existing: TafsirRecord | undefined;

    if (editId) {
      existing = tafsirRecords.find(t => t.id === editId);
    } else if (urlSurah && urlVerse) {
      existing = getTafsirRecord(urlSurah, urlVerse);
    }

    if (existing) {
      setCurrentId(existing.id);
      setSelectedSurah(existing.surahNumber);
      setSelectedVerse(existing.verseNumber);
      setNotes({ ...existing.tafsirs });
    }

    setIsLoaded(true);
  }, [editId, urlSurah, urlVerse, tafsirRecords, getTafsirRecord, isLoaded]);

  const hasAnyContent = Object.values(notes).some(text => text.trim().length > 0);
  const isSaveDisabled = !selectedSurah || !selectedVerse || !hasAnyContent;

  const handleSave = () => {
    if (!selectedSurah || !selectedVerse) {
      toast({
        title: "Selection Required",
        description: "Please select both a Surah and a Verse.",
        variant: "destructive",
        icon: <AlertCircle size={18} />
      });
      return;
    }
    
    // Clean empty notes and count words
    const cleanedNotes: Record<string, string> = {};
    let totalWordCount = 0;
    
    for (const [sId, text] of Object.entries(notes)) {
      if (text.trim()) {
        cleanedNotes[sId] = text;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        totalWordCount += words.length;
      }
    }

    if (Object.keys(cleanedNotes).length === 0) {
      toast({
        title: "Content Missing",
        description: "Please write at least one note before saving.",
        variant: "destructive",
        icon: <AlertCircle size={18} />
      });
      return;
    }

    if (totalWordCount < 50) {
      toast({
        title: "Too Short",
        description: `Please write a minimum of 50 words. You currently have ${totalWordCount} words.`,
        variant: "destructive",
        icon: <AlertCircle size={18} />
      });
      return;
    }

    const newRecord: TafsirRecord = {
      id: currentId,
      surahNumber: Number(selectedSurah),
      verseNumber: Number(selectedVerse),
      tafsirs: cleanedNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTafsirRecord(newRecord);
    navigate(-1);
  };

  const insertMarkdown = (text: string) => {
    if (!activeSourceId) return;
    setNotes(prev => ({
      ...prev,
      [activeSourceId]: (prev[activeSourceId] || '') + (prev[activeSourceId] ? '\n' : '') + text
    }));
  };

  const handleNoteChange = (text: string) => {
    if (!activeSourceId) return;
    setNotes(prev => ({ ...prev, [activeSourceId]: text }));
  };

  const handlers = useSwipeable({
    onSwipedLeft: (swipeEvent) => {
      const target = swipeEvent.event.target as HTMLElement;
      if (target && target.closest('.no-swipe')) return;
      const currentIndex = sources.findIndex(s => s.id === activeSourceId);
      if (currentIndex < sources.length - 1) {
        setActiveSourceId(sources[currentIndex + 1].id);
      }
    },
    onSwipedRight: (swipeEvent) => {
      const target = swipeEvent.event.target as HTMLElement;
      if (target && target.closest('.no-swipe')) return;
      const currentIndex = sources.findIndex(s => s.id === activeSourceId);
      if (currentIndex > 0) {
        setActiveSourceId(sources[currentIndex - 1].id);
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 40,
  });

  if (!isLoaded || !surahs || (sources.length > 0 && !activeSourceId)) {
    return <LoadingScreen message="Preparing Tafsir Builder..." />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="main-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        {...handlers}
        className="min-h-screen pb-32 bg-background"
      >
      <div className="sticky top-0 z-40 bg-background border-b border-border/60 pb-2">
        <div className="flex items-center gap-3 px-4 h-16 pt-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl transition text-foreground">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-[20px] font-semibold text-foreground flex-1">Add Tafsir</h1>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-md mx-auto space-y-7">
        {/* SURAH & VERSE SELECTOR */}
        <div className="space-y-4">
          <div className="w-full">
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2 ml-1">SURAH</label>
            <Select value={selectedSurah ? selectedSurah.toString() : ''} onValueChange={(v) => { setSelectedSurah(Number(v)); setSelectedVerse(''); }}>
              <SelectTrigger className="w-full bg-card border border-border rounded-2xl h-[56px] px-4 text-[15px] font-medium text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus:ring-1 focus:ring-primary/20 [&>span]:flex-1">
                <SelectValue placeholder="Select Surah" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border rounded-xl shadow-lg p-2 max-h-[300px]">
                {surahs?.map(s => (
                  <SelectItem key={s.number} value={s.number.toString()} className="rounded-lg mb-1 py-3 cursor-pointer">
                    <div className="flex justify-between items-center w-full min-w-[200px]">
                      <span className="text-[15px] font-medium">{s.number}. {s.name}</span>
                      <span className="font-arabic text-primary text-lg pr-3">{s.nameArabic}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full">
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2 ml-1">VERSE</label>
            <Select disabled={!selectedSurah} value={selectedVerse ? selectedVerse.toString() : ''} onValueChange={(v) => setSelectedVerse(Number(v))}>
              <SelectTrigger className="w-full bg-card border border-border rounded-2xl h-[56px] px-4 text-[15px] font-medium text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus:ring-1 focus:ring-primary/20 data-[disabled]:opacity-50">
                <SelectValue placeholder="Verse" />
              </SelectTrigger>
              {selectedSurah && (
                <SelectContent className="bg-popover border-border rounded-xl shadow-lg max-h-[250px]">
                  {currentSurahVerses?.map(a => (
                    <SelectItem key={a.numberInSurah} value={a.numberInSurah.toString()} className="py-3">
                      Verse {a.numberInSurah}
                    </SelectItem>
                  ))}
                </SelectContent>
              )}
            </Select>
          </div>
        </div>

        {/* VERSE CONTEXT DISPLAY */}
        {selectedSurah && selectedVerse && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-muted/30 border border-border/60 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[80px]">
             {(() => {
               const verseObj = currentSurahVerses?.find(v => v.numberInSurah === Number(selectedVerse));
               if (!verseObj) return null;
               return (
                 <p className="arabic-text text-2xl leading-[2.5] text-center text-foreground font-arabic" 
                    dangerouslySetInnerHTML={{ __html: verseObj.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '<span class="bismillah-text text-xl block -mb-2">﷽</span>') }} />
               );
             })()}
          </motion.div>
        )}

        {/* TAFSIR SOURCE TABS */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-widest leading-none">TAFSIR SOURCE</label>
            <button
               onClick={() => handleDrawerOpenChange(true)}
               className="p-1.5 rounded-lg text-muted-foreground transition-colors outline-none"
               aria-label="Manage Sources"
            >
               <Settings2 size={18} />
            </button>
          </div>
          
          <div className="bg-muted/40 rounded-full p-1 border border-border/40 relative">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide no-swipe">
              {sources.map(s => {
                const active = activeSourceId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSourceId(s.id)}
                    className={`relative whitespace-nowrap px-6 py-2 text-[14px] font-semibold rounded-full transition-all z-10 outline-none flex-1 min-w-fit ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    {active && (
                      <motion.div 
                        layoutId="activeSourceIndicator" 
                        className="absolute inset-0 bg-primary rounded-full shadow-md z-[-1]" 
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }} 
                      />
                    )}
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* EDITOR AREA */}
        {activeSourceId && selectedSurah && selectedVerse && (
          <motion.div key={activeSourceId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
            <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
              <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">TAFSIR: {sources.find(s => s.id === activeSourceId)?.name.toUpperCase()}</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-muted-foreground transition-colors p-1 outline-none">
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

            <textarea
              value={notes[activeSourceId] || ''}
              onChange={e => handleNoteChange(e.target.value)}
              dir={settings.language === 'ur' ? 'rtl' : 'ltr'}
              className="w-full bg-background/50 border border-border focus:border-primary rounded-xl p-4 text-[15px] font-display text-foreground placeholder:text-muted-foreground min-h-[220px] resize-y outline-none transition-colors"
              placeholder={`Write your tafsir notes from ${sources.find(s => s.id === activeSourceId)?.name} here...`}
            />
          </motion.div>
        )}
      </div>

      <div className={`fixed bottom-0 left-0 right-0 p-5 pb-8 bg-gradient-to-t from-background via-background/90 to-transparent transition-all duration-300 ${isManageSourcesOpen ? 'z-30 opacity-0 pointer-events-none' : 'z-[45] opacity-100'}`}>
        <button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className={`w-full max-w-md mx-auto py-[14px] rounded-full font-medium text-[16px] transition-all flex justify-center items-center ${isSaveDisabled
              ? 'bg-secondary text-muted-foreground/80 cursor-not-allowed'
              : 'bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(var(--primary),0.25)]'
            }`}
        >
          Save Tafsirs
        </button>
      </div>

      {/* MANAGE SOURCES DRAWER */}
      <Drawer open={isManageSourcesOpen} onOpenChange={handleDrawerOpenChange} repositionInputs={false}>
        <DrawerContent className="rounded-t-[2rem] bg-white border-none focus:outline-none flex flex-col max-h-[85dvh]">
          <div className="flex-1 overflow-y-auto px-7 pt-5 pb-8 scrollbar-hide">
            <DrawerTitle className="font-display text-xl mb-1 text-foreground">Manage Tafsir Sources</DrawerTitle>
            <DrawerDescription className="text-muted-foreground mb-6">Add, rename, or delete the Tafsir sources you want to use.</DrawerDescription>
            
            <div className="space-y-4 mb-8">
              {sources.map(source => (
                <div key={source.id} className="flex items-center gap-2 p-3 bg-muted/30 border border-border rounded-2xl">
                  {editingSourceId === source.id ? (
                    <input
                      autoFocus
                      type="text"
                      className="flex-1 bg-transparent border-none text-[15px] font-medium focus:outline-none px-2 text-foreground"
                      value={sourceEditText}
                      onChange={e => setSourceEditText(e.target.value)}
                      onBlur={() => {
                        if (sourceEditText.trim()) updateSource(source.id, sourceEditText.trim());
                        setEditingSourceId(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (sourceEditText.trim()) updateSource(source.id, sourceEditText.trim());
                          setEditingSourceId(null);
                        }
                      }}
                    />
                  ) : (
                    <span className="flex-1 text-[15px] font-medium px-2 text-foreground">{source.name}</span>
                  )}
                  
                  <button
                    onClick={() => {
                      setEditingSourceId(source.id);
                      setSourceEditText(source.name);
                    }}
                    className="p-2 text-primary/80 rounded-lg transition-colors outline-none"
                  >
                    <Edit2 size={16} />
                  </button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        className="p-2 text-destructive/80 rounded-lg transition-colors outline-none"
                      >
                        <Trash2 size={16} />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="w-[92vw] max-w-[360px] rounded-[1.5rem] z-[100] border-none shadow-2xl p-6 [&>button]:hidden">
                      <DialogHeader className="space-y-2">
                        <DialogTitle className="text-center text-lg font-bold">Delete "{source.name}"?</DialogTitle>
                        <DialogDescription className="text-center text-sm leading-relaxed">
                          Are you sure you want to delete this source?
                          <br /><br />
                          <span className="font-semibold text-destructive/90">WARNING:</span> This will permanently hide and delete all Tafsir notes you have ever written under this source across all verses. This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex flex-col gap-2 mt-4">
                        <DialogClose asChild>
                          <button
                            onClick={() => deleteSource(source.id)}
                            className="w-full h-11 rounded-xl bg-destructive text-destructive-foreground font-semibold text-[15px] transition-all"
                          >
                            Delete
                          </button>
                        </DialogClose>
                        <DialogClose asChild>
                          <button className="w-full h-11 rounded-xl bg-background text-foreground font-medium text-[15px] transition-all border border-border">
                            Cancel
                          </button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border">
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Add New Source</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Tafsir As-Sa'di"
                  value={newSourceName}
                  onChange={e => setNewSourceName(e.target.value)}
                  className="flex-1 bg-muted/30 border border-border rounded-xl p-3 text-[15px] focus:outline-none focus:border-primary transition-colors text-foreground"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newSourceName.trim()) {
                      addSource(newSourceName.trim());
                      setNewSourceName('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newSourceName.trim()) {
                      addSource(newSourceName.trim());
                      setNewSourceName('');
                    }
                  }}
                  disabled={!newSourceName.trim()}
                  className="px-4 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed outline-none"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      </motion.div>
    </AnimatePresence>
  );
}
