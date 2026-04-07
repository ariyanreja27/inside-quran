import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { ArrowLeft, Trash2, Edit2, Plus, AlertCircle, Info, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurahs, useSurahVerses } from '@/hooks/useQuranData';
import { useTafsirSources, useCustomTafsirs, useSettings } from '@/hooks/useAppStore';
import type { TafsirRecord, TafsirSource } from '@/hooks/useAppStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import LoadingScreen from '@/components/LoadingScreen';
import { TajweedText } from '@/components/TajweedText';
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
  const [localSources, setLocalSources] = useState<TafsirSource[]>(sources);
  const [lastLoadedVerse, setLastLoadedVerse] = useState<string>('');
  const [showManageError, setShowManageError] = useState(false);

  useEffect(() => {
    if (selectedSurah && selectedVerse) setShowManageError(false);
  }, [selectedSurah, selectedVerse]);

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
    if (localSources.length > 0) {
      if (!activeSourceId || !localSources.some(s => s.id === activeSourceId)) {
        setActiveSourceId(localSources[0].id);
      }
    } else {
      setActiveSourceId('');
    }
  }, [localSources, activeSourceId]);

  // Sync localSources and notes with existing record when verse changes
  useEffect(() => {
    if (!isLoaded || !selectedSurah || !selectedVerse) return;
    
    const verseKey = `${selectedSurah}-${selectedVerse}`;
    if (verseKey === lastLoadedVerse) return;
    
    const record = getTafsirRecord(selectedSurah, selectedVerse);
    if (record) {
      setCurrentId(record.id);
      setNotes({ ...record.tafsirs });
      if (record.sources && record.sources.length > 0) {
        setLocalSources(record.sources);
      } else {
        setLocalSources(sources);
      }
    } else {
      setCurrentId(generateId());
      setNotes({});
      // If no record or no source customization, use global defaults
      setLocalSources(sources);
    }
    setLastLoadedVerse(verseKey);
  }, [isLoaded, selectedSurah, selectedVerse, getTafsirRecord, sources, lastLoadedVerse]);

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
      if (existing.sources && existing.sources.length > 0) {
        setLocalSources(existing.sources);
      }
      setLastLoadedVerse(`${existing.surahNumber}-${existing.verseNumber}`);
    }

    setIsLoaded(true);
  }, [editId, urlSurah, urlVerse, tafsirRecords, getTafsirRecord, isLoaded]);

  const hasAnyContent = localSources.some(s => (notes[s.id] || '').trim().length > 0);
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
    
    // Clean empty notes, verify they belong to an active source, and count characters
    const cleanedNotes: Record<string, string> = {};
    let totalTextLength = 0;
    
    for (const [sId, text] of Object.entries(notes)) {
      if (text.trim() && localSources.some(s => s.id === sId)) {
        cleanedNotes[sId] = text.trim();
        totalTextLength += text.trim().length;
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

    if (totalTextLength < 10) {
      toast({
        title: "Too Short",
        description: `Please write a minimum of 10 characters. You currently have ${totalTextLength} characters.`,
        variant: "destructive",
        icon: <AlertCircle size={18} />
      });
      return;
    }

    const record: TafsirRecord = {
      id: currentId,
      surahNumber: selectedSurah as number,
      verseNumber: selectedVerse as number,
      tafsirs: cleanedNotes,
      sources: localSources,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveTafsirRecord(record);
    toast({
      title: "Saved Successfully",
      description: "Tafsir notes and sources have been saved for this verse.",
      variant: "default",
    });
    navigate(-1);
  };

  // Local Source Management Helpers
  const handleAddLocalSource = (name: string) => {
    setLocalSources(prev => [...prev, { id: Date.now().toString(), name }]);
  };

  const handleUpdateLocalSource = (id: string, name: string) => {
    setLocalSources(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleDeleteLocalSource = (id: string) => {
    setLocalSources(prev => prev.filter(s => s.id !== id));
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
      const currentIndex = localSources.findIndex(s => s.id === activeSourceId);
      if (currentIndex < localSources.length - 1) {
        setActiveSourceId(localSources[currentIndex + 1].id);
      }
    },
    onSwipedRight: (swipeEvent) => {
      const target = swipeEvent.event.target as HTMLElement;
      if (target && target.closest('.no-swipe')) return;
      const currentIndex = localSources.findIndex(s => s.id === activeSourceId);
      if (currentIndex > 0) {
        setActiveSourceId(localSources[currentIndex - 1].id);
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 40,
  });

  if (!isLoaded || !surahs || (localSources.length > 0 && !activeSourceId)) {
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
            {!selectedSurah && (
              <p className="text-destructive text-[12px] font-medium mt-2 ml-1">Please select a Surah first.</p>
            )}
          </div>
          <div className="w-full">
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2 ml-1">VERSE</label>
            <Select disabled={!selectedSurah} value={selectedVerse ? selectedVerse.toString() : ''} onValueChange={(v) => setSelectedVerse(Number(v))}>
              <SelectTrigger className="w-full bg-card border border-border rounded-2xl h-[56px] px-4 text-[15px] font-medium text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus:ring-1 focus:ring-primary/20 data-[disabled]:opacity-50">
                <SelectValue placeholder="Verse" />
              </SelectTrigger>
              {selectedSurah && (
                <SelectContent className="bg-popover border-border rounded-xl shadow-lg max-h-[250px]">
                  {currentSurahVerses?.map(a => {
                    const isUsed = tafsirRecords.some(t => t.surahNumber === selectedSurah && t.verseNumber === a.numberInSurah && t.id !== editId);
                    return (
                      <SelectItem 
                        key={a.numberInSurah} 
                        value={a.numberInSurah.toString()} 
                        disabled={isUsed}
                        className="py-3 data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed"
                      >
                        Verse {a.numberInSurah}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              )}
            </Select>
            {!selectedVerse && selectedSurah && (
              <p className="text-destructive text-[12px] font-medium mt-2 ml-1">Select a verse number first to write a Tafsir.</p>
            )}
          </div>
        </div>

        {/* VERSE CONTEXT DISPLAY */}
        {selectedSurah && selectedVerse && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-muted/30 border border-border/60 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[80px]"
          >
              {(() => {
               const verseObj = currentSurahVerses?.find(v => v.numberInSurah === Number(selectedVerse));
               if (!verseObj) return null;
               return (
                 <p className="arabic-text text-2xl leading-[2.5] text-center text-foreground font-arabic">
                   <TajweedText text={verseObj.text} showColors={settings.showTajweed} />
                 </p>
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
              {localSources.map(s => {
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
        <div className="bg-card border border-border rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
          <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">
              TAFSIR: {localSources.find(s => s.id === activeSourceId)?.name.toUpperCase() || 'SELECT SOURCE'}
            </span>
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
            disabled={!selectedSurah || !selectedVerse || !activeSourceId}
            dir={settings.language === 'ur' ? 'rtl' : 'ltr'}
            className="w-full bg-background/50 border border-border focus:border-primary rounded-xl p-4 text-[15px] font-display text-foreground placeholder:text-muted-foreground min-h-[220px] resize-y outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={!selectedSurah || !selectedVerse ? "Select a Surah and Verse first to start writing..." : !activeSourceId ? "Add a source to start writing..." : `Write your tafsir notes from ${localSources.find(s => s.id === activeSourceId)?.name} here...`}
          />
          {selectedSurah && selectedVerse && activeSourceId && (notes[activeSourceId]?.trim() || '').length > 0 && (notes[activeSourceId]?.trim() || '').length < 10 && (
            <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
              Need {10 - (notes[activeSourceId]?.trim() || '').length} more characters.
            </p>
          )}
        </div>
      </div>

      {/* STICKY BOTTOM SAVE BUTTON */}
      <div className={`fixed bottom-0 inset-x-0 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))] bg-background/80 backdrop-blur-md border-t border-border/50 transition-all duration-300 ${isManageSourcesOpen ? 'z-30 opacity-0 pointer-events-none' : 'z-[70] opacity-100'}`}>
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={`w-full py-[14px] rounded-full font-medium text-[16px] transition-all flex justify-center items-center ${isSaveDisabled
                ? 'bg-secondary text-muted-foreground/80 cursor-not-allowed'
                : 'bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(var(--primary),0.25)]'
              }`}
          >
            Save Tafsirs
          </button>
        </div>
      </div>

      {/* MANAGE SOURCES DRAWER */}
      <Drawer open={isManageSourcesOpen} onOpenChange={handleDrawerOpenChange} repositionInputs={false}>
        <DrawerContent className="rounded-t-[2rem] bg-white border-none focus:outline-none flex flex-col max-h-[85dvh]">
          <div className="flex-1 overflow-y-auto px-7 pt-5 pb-4 scrollbar-hide">
            <DrawerTitle className="font-display text-xl mb-1 text-foreground">Manage Tafsir Sources</DrawerTitle>
            <DrawerDescription className="text-muted-foreground mb-6">Add, rename, or delete the Tafsir sources you want to use.</DrawerDescription>
            
            {showManageError && (!selectedSurah || !selectedVerse) && (
               <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[13px] font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                   <AlertCircle size={16} />
                   Please select both a Surah and Verse to manage sources.
               </div>
            )}
            
            <div className="relative">
              {(!selectedSurah || !selectedVerse) && (
                <div className="absolute inset-0 z-10" onClick={() => setShowManageError(true)} />
              )}
              <div className={`space-y-4 ${(!selectedSurah || !selectedVerse) ? 'opacity-50 pointer-events-none' : ''}`}>
                {localSources.map(source => (
                  <div key={source.id} className="flex items-center gap-2 p-3 bg-muted/30 border border-border rounded-2xl">
                    {editingSourceId === source.id ? (
                      <input
                        autoFocus
                        type="text"
                        className="flex-1 bg-transparent border-none text-[15px] font-medium focus:outline-none px-2 text-foreground"
                        value={sourceEditText}
                        onChange={e => setSourceEditText(e.target.value)}
                        onBlur={() => {
                          if (sourceEditText.trim()) handleUpdateLocalSource(source.id, sourceEditText.trim());
                          setEditingSourceId(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            if (sourceEditText.trim()) handleUpdateLocalSource(source.id, sourceEditText.trim());
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
                    <DialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] z-[100] border-none shadow-2xl p-6 [&>button]:hidden">
                      <DialogHeader className="space-y-3">
                        <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-2">
                           <Trash2 size={24} />
                        </div>
                        <DialogTitle className="text-center text-xl font-display font-bold">Remove Source?</DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground text-[15px] leading-relaxed">
                          Are you sure you want to remove <span className="font-semibold text-foreground">"{source.name}"</span> for this specific verse? 
                          <br /><br />
                          This will only remove the notes written under this source for this verse. Other verses will not be affected.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex flex-col gap-2 mt-6">
                        <DialogClose asChild>
                            <button
                              onClick={() => handleDeleteLocalSource(source.id)}
                            className="w-full h-12 rounded-xl bg-destructive text-destructive-foreground font-semibold text-[16px] transition-all active:scale-[0.98]"
                            >
                              Remove Source
                            </button>
                        </DialogClose>
                        <DialogClose asChild>
                          <button className="w-full h-12 rounded-xl bg-muted/50 text-muted-foreground font-semibold text-[16px] transition-all border-none active:scale-[0.98]">
                            Not Now
                          </button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* STICKY ADD NEW SOURCE FOOTER */}
          <div className="px-7 py-4 border-t border-border bg-white rounded-b-[2rem] relative">
            {(!selectedSurah || !selectedVerse) && (
              <div className="absolute inset-0 z-10" onClick={() => setShowManageError(true)} />
            )}
            <div className={(!selectedSurah || !selectedVerse) ? 'opacity-50 pointer-events-none' : ''}>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Add Source for this Verse</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Tafsir As-Sa'di"
                  value={newSourceName}
                  onChange={e => setNewSourceName(e.target.value)}
                  className="flex-1 bg-muted/30 border border-border rounded-xl p-3 text-[15px] focus:outline-none focus:border-primary transition-colors text-foreground"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newSourceName.trim()) {
                      handleAddLocalSource(newSourceName.trim());
                      setNewSourceName('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newSourceName.trim()) {
                      handleAddLocalSource(newSourceName.trim());
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
