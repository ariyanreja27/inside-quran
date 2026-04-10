import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { ArrowLeft, Plus, Trash2, Info, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurahs, useSurahVerses } from '@/hooks/useQuranData';
import { useExplanations } from '@/hooks/useAppStore';
import type { Explanation, ConciseBlock, RootWord, DeeperLookCategory } from '@/types/quran';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/LoadingScreen';
import { TajweedText } from '@/components/TajweedText';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useSettings } from '@/hooks/useAppStore';
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

const FIXED_CATEGORIES = [
  'Grammar & Rhetoric',
  'Historical Context',
  'Coherence',
  'Psychological/Social',
  'Quranic Wisdom'
];

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function ExplanationBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const urlSurah = searchParams.get('surah') ? parseInt(searchParams.get('surah')!) : null;
  const urlVerse = searchParams.get('verse') ? parseInt(searchParams.get('verse')!) : null;

  const { data: surahs } = useSurahs();
  const { explanations, getExplanation, saveExplanation } = useExplanations();
  const { toast } = useToast();
  const { settings } = useSettings();

  // Handled inline

  const [mode, setMode] = useState<'concise' | 'deeper'>('concise');
  const [selectedSurah, setSelectedSurah] = useState<number | ''>(urlSurah || '');

  // Concise Form State
  const [conciseBlocks, setConciseBlocks] = useState<ConciseBlock[]>([]);

  // Deeper Look Form State
  const [verseRange, setVerseRange] = useState<string>('');
  const [rootWordsOn, setRootWordsOn] = useState(false);
  const [rootWords, setRootWords] = useState<RootWord[]>([]);
  const [categories, setCategories] = useState<DeeperLookCategory[]>(() => 
    FIXED_CATEGORIES.map((title, index) => ({
      id: generateId(),
      title,
      content: '',
      order: index
    }))
  );
  const [rangeError, setRangeError] = useState<string | null>(null);

  // Editing logic
  const [currentId, setCurrentId] = useState<string>(() => generateId());
  const [isLoaded, setIsLoaded] = useState(false);

  // Verse data fetching
  const { data: currentSurahVerses } = useSurahVerses(selectedSurah || 1);

  // Scroll ref
  const blockRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const hasSelectedVerse = conciseBlocks.some(b => b.verseNumber > 0);
  const hasConciseContent = conciseBlocks.some(b => b.verseNumber > 0 && b.explanations.some(e => e.text.trim().length >= 10));
  const hasAtLeastOneExplanation = hasConciseContent;

  // Verses already used in OTHER saved explanations for the same Surah
  const crossSurahUsedVerses = new Set(
    explanations
      .filter(e => e.surahNumber === Number(selectedSurah) && e.id !== currentId)
      .flatMap(e => (e.concise || []).map(b => b.verseNumber).filter(v => v > 0))
  );

  const [initialHash, setInitialHash] = useState<string>('');
  const currentHash = JSON.stringify({ mode, selectedSurah, conciseBlocks, verseRange, rootWordsOn, rootWords, categories });

  useEffect(() => {
    if (isLoaded && !initialHash) {
      setInitialHash(currentHash);
    }
  }, [isLoaded, currentHash, initialHash]);

  const hasChanges = initialHash !== currentHash;

  const isSaveDisabled = !selectedSurah ||
    (mode === 'deeper' && (!!rangeError || !verseRange.trim())) ||
    !hasConciseContent ||
    !hasChanges;

  useEffect(() => {
    if (isLoaded) return;

    let existing: Explanation | undefined;

    if (editId) {
      existing = explanations.find(e => e.id === editId);
    } else if (urlSurah && urlVerse) {
      existing = getExplanation(urlSurah, urlVerse);
    }

    if (existing) {
      setCurrentId(existing.id);
      setSelectedSurah(existing.surahNumber);
      setConciseBlocks(existing.concise || []);
      setVerseRange(existing.verseRange || '');
      if (existing.deeperLook) {
        setRootWords(existing.deeperLook.rootWords || []);
        if (existing.deeperLook.rootWords?.length > 0) setRootWordsOn(true);
        
        const loadedCategories = existing.deeperLook.categories || [];
        const mergedCategories = FIXED_CATEGORIES.map((title, index) => {
          const matching = loadedCategories.find(c => c.title === title);
          return {
            id: matching?.id || generateId(),
            title,
            content: matching?.content || '',
            order: index
          };
        });
        setCategories(mergedCategories);

        if (existing.concise?.length === 0 && (existing.deeperLook.rootWords?.length > 0 || existing.deeperLook.categories?.length > 0)) {
          setMode('deeper');
        }
      }
    } else if (urlSurah && urlVerse) {
      setConciseBlocks([{
        verseNumber: urlVerse,
        explanations: [{ id: generateId(), title: '', text: '' }]
      }]);
    }

    setIsLoaded(true);
  }, [editId, urlSurah, urlVerse, explanations, getExplanation, isLoaded]);



  const handleVerseRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    val = val.replace(/[^\d,\- ]/g, '');
    val = val.replace(/,{2,}/g, ',');
    val = val.replace(/ {2,}/g, ' ');
    val = val.replace(/-{2,}/g, '-');
    val = val.replace(/ ,/g, ',');
    val = val.replace(/ -/g, '-');
    val = val.replace(/- /g, '-');
    setVerseRange(val);

    if (!val.trim()) {
      setRangeError(null);
      return;
    }
    if (!selectedSurah) {
      setRangeError("Please select a Surah first.");
      return;
    }

    const maxVerses = surahs?.find(s => s.number === selectedSurah)?.verseCount || 0;
    const parts = val.split(',').map(s => s.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes('-')) {
        const hyphens = part.split('-').length - 1;
        if (hyphens > 1) {
          setRangeError(`Invalid format: "${part}" has too many hyphens.`);
          return;
        }
        const [startStr, endStr] = part.split('-');
        if (!startStr || !endStr) continue;

        const start = parseInt(startStr);
        const end = parseInt(endStr);

        if (isNaN(start) || isNaN(end)) {
          setRangeError(`Incomplete range: "${part}".`);
          return;
        }
        if (start >= end) {
          setRangeError(`Invalid range: "${part}". Start must be less than end.`);
          return;
        }
        if (start < 1) {
          setRangeError(`Verse cannot be less than 1.`);
          return;
        }
        if (end > maxVerses) {
          setRangeError(`Verse ${end} exceeds max verses (${maxVerses}).`);
          return;
        }
      } else {
        const num = parseInt(part);
        if (isNaN(num)) continue;
        if (num < 1) {
          setRangeError(`Verse cannot be less than 1.`);
          return;
        }
        if (num > maxVerses) {
          setRangeError(`Verse ${num} exceeds max verses (${maxVerses}).`);
          return;
        }
      }
    }
    setRangeError(null);
  };

  const handleSave = () => {
    if (!selectedSurah) {
      toast({
        title: "Selection Required",
        description: "Please select a Surah first.",
        variant: "destructive",
        icon: <AlertCircle size={18} />
      });
      return;
    }
    if (mode === 'deeper' && rangeError) {
      toast({
        title: "Range Error",
        description: "Please fix the Verse Range errors before saving.",
        variant: "destructive",
        icon: <AlertCircle size={18} />
      });
      return;
    }
    if (mode === 'deeper' && !verseRange.trim()) {
      toast({
        title: "Range Required",
        description: "Please enter a Verse Range before saving.",
        variant: "destructive",
        icon: <AlertCircle size={18} />
      });
      return;
    }

    const allVerses = new Set<number>();

    // Only save blocks that have a verse selected and at least 10 characters of text
    const validConcise = conciseBlocks.filter(b =>
      b.verseNumber > 0 && b.explanations.some(e => e.text.trim().length >= 10)
    );

    // Block save if any verse is already used in another explanation for this Surah
    const duplicateVerse = validConcise.find(b => crossSurahUsedVerses.has(b.verseNumber));
    if (duplicateVerse) {
      toast({
        title: "Duplicate Verse",
        description: `Verse ${duplicateVerse.verseNumber} is already used in another explanation for this Surah.`,
        variant: "destructive",
        icon: <AlertCircle size={18} />
      });
      return;
    }

    validConcise.forEach(b => {
      if (b.verseNumber) allVerses.add(Number(b.verseNumber));
    });

    const parts = verseRange.split(',').map(s => s.trim());
    parts.forEach(p => {
      if (p.includes('-')) {
        const [start, end] = p.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          if (!isNaN(i) && i > 0) allVerses.add(i);
        }
      } else if (p && !isNaN(Number(p))) {
        allVerses.add(Number(p));
      }
    });

    // Clean up empty or too short root words and categories so view page isn't polluted
    const validRootWords = rootWords.filter(rw => rw.arabic.trim() && rw.explanation.trim().length >= 10);
    // Ensure we save all fixed categories
    const validCategories = categories;

    const newExplanation: Explanation = {
      id: currentId,
      surahNumber: Number(selectedSurah),
      verses: Array.from(allVerses).sort((a, b) => a - b),
      verseRange: verseRange,
      concise: validConcise,
      deeperLook: {
        rootWords: rootWordsOn ? validRootWords : [],
        categories: validCategories
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveExplanation(newExplanation);
    navigate(-1);
  };

  const getVerseText = (verseNum: number) => {
    return currentSurahVerses?.find(a => a.numberInSurah === Number(verseNum))?.text || '';
  };

  const addVerseBlock = () => setConciseBlocks([...conciseBlocks, { verseNumber: 0, explanations: [{ id: generateId(), title: '', text: '' }] }]);
  const removeVerseBlock = (index: number) => { const nb = [...conciseBlocks]; nb.splice(index, 1); setConciseBlocks(nb); };
  const updateVerseBlock = (index: number, val: number) => { const nb = [...conciseBlocks]; nb[index].verseNumber = val; setConciseBlocks(nb); };

  const addExplanationToBlock = (bIndex: number) => { const nb = [...conciseBlocks]; nb[bIndex].explanations.push({ id: generateId(), title: '', text: '' }); setConciseBlocks(nb); };
  const updateExplanationTitle = (bIndex: number, eIndex: number, val: string) => { const nb = [...conciseBlocks]; nb[bIndex].explanations[eIndex].title = val; setConciseBlocks(nb); };
  const updateExplanationText = (bIndex: number, eIndex: number, val: string) => { const nb = [...conciseBlocks]; nb[bIndex].explanations[eIndex].text = val; setConciseBlocks(nb); };
  const removeExplanationFromBlock = (bIndex: number, eIndex: number) => { const nb = [...conciseBlocks]; nb[bIndex].explanations.splice(eIndex, 1); setConciseBlocks(nb); };

  const insertMarkdown = (cIndex: number, text: string) => {
    const nc = [...categories];
    nc[cIndex].content = nc[cIndex].content + (nc[cIndex].content ? '\n' : '') + text;
    setCategories(nc);
  };

  const insertMarkdownToConcise = (bIndex: number, eIndex: number, text: string) => {
    const nb = [...conciseBlocks];
    nb[bIndex].explanations[eIndex].text = nb[bIndex].explanations[eIndex].text + (nb[bIndex].explanations[eIndex].text ? '\n' : '') + text;
    setConciseBlocks(nb);
  };

  const insertMarkdownToRootWord = (rIndex: number, text: string) => {
    const nr = [...rootWords];
    nr[rIndex].explanation = nr[rIndex].explanation + (nr[rIndex].explanation ? '\n' : '') + text;
    setRootWords(nr);
  };

  const handlers = useSwipeable({
    onSwipedLeft: (swipeEvent) => {
      const target = swipeEvent.event.target as HTMLElement;
      if (target && target.closest('.no-swipe')) return;
      if (mode === 'concise') setMode('deeper');
    },
    onSwipedRight: (swipeEvent) => {
      const target = swipeEvent.event.target as HTMLElement;
      if (target && target.closest('.no-swipe')) return;
      if (mode === 'deeper') setMode('concise');
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 40,
  });

  if (!isLoaded || !surahs) {
    return <LoadingScreen message="Preparing Explanation Builder..." />;
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
          <h1 className="font-display text-[20px] font-semibold text-foreground flex-1">Add Explanation</h1>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-md mx-auto space-y-7">

        {/* SURAH SELECTOR */}
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2 ml-1">SURAH</label>
          <Select value={selectedSurah ? selectedSurah.toString() : ''} onValueChange={(v) => setSelectedSurah(Number(v))}>
            <SelectTrigger className="w-full bg-card border border-border rounded-2xl h-[56px] px-4 text-[15px] font-medium text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus:ring-1 focus:ring-primary/20 [&>span]:flex-1">
              <SelectValue placeholder="Select a Surah" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border rounded-xl shadow-lg p-2 max-h-[300px]">
              {surahs?.map(s => (
                <SelectItem key={s.number} value={s.number.toString()} className="rounded-lg mb-1 data-[state=checked]:bg-muted py-3 cursor-pointer">
                  <div className="flex justify-between items-center w-full min-w-[200px]">
                    <span className="text-[15px] font-medium">{s.number}. {s.name}</span>
                    <span className="font-arabic text-primary text-lg pr-3">{s.nameArabic}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!selectedSurah && (
            <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
              Please select a Surah first.
            </p>
          )}
        </div>

        {/* MODE TOGGLE */}
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2 ml-1">MODE</label>
          <div className="flex bg-muted/40 rounded-full p-1 w-full border border-border/40 relative">
            {(['concise', 'deeper'] as const).map((m) => {
              const active = mode === m;
              return (
                <motion.button
                  key={m}
                  onClick={() => setMode(m)}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex-1 py-2 text-[14px] font-semibold rounded-full transition-colors tracking-wide z-10 ${active ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTab-builder"
                      className="absolute inset-0 bg-primary rounded-full shadow-md z-[-1]"
                      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    />
                  )}
                  {m === 'concise' ? 'Concise' : 'Deeper Look'}
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {mode === 'concise' ? (
            /* CONCISE MODE */
            <motion.div
              key="concise"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {conciseBlocks.map((block, bIndex) => (
                <div key={bIndex} className="bg-card border border-border rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative" ref={(el) => (blockRefs.current[block.verseNumber] = el)}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-[13px] text-muted-foreground uppercase tracking-widest">VERSE BLOCK</h3>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-destructive p-1.5 rounded-lg transition-colors outline-none">
                          <Trash2 size={18} />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] border-none bg-white dark:bg-background shadow-2xl p-6 [&>button]:hidden">
                        <DialogHeader className="space-y-2">
                          <DialogTitle className="text-left text-lg font-bold">Delete Verse Block?</DialogTitle>
                          <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                            Are you sure you want to delete the verse block for <strong>Surah {surahs?.find(s => s.number === selectedSurah)?.name} {block.verseNumber}</strong>? All concise notes written for this specific verse will be removed.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-row justify-end gap-2 mt-4">
                          <DialogClose asChild>
                            <button className="h-10 px-6 rounded-full border border-border bg-secondary/10 text-foreground text-[13px] font-medium hover:bg-secondary/20 transition-all">
                              Cancel
                            </button>
                          </DialogClose>
                          <DialogClose asChild>
                            <button 
                              onClick={() => removeVerseBlock(bIndex)}
                              className="h-10 px-6 rounded-full bg-destructive text-destructive-foreground text-[13px] font-bold hover:bg-destructive/90 transition-all"
                            >
                              Delete
                            </button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-4">
                    {/* Select Verse */}
                    <div>
                      <label className="block text-[14px] text-muted-foreground mb-2 ml-1">Select Verse</label>
                      <div>
                        <Select disabled={!selectedSurah} value={block.verseNumber ? block.verseNumber.toString() : ''} onValueChange={(v) => updateVerseBlock(bIndex, Number(v))}>
                          <SelectTrigger className="w-full bg-muted/50 border-none rounded-2xl h-[56px] px-4 text-[15px] text-foreground focus:ring-0 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed">
                            <SelectValue placeholder={selectedSurah ? "Select Verse" : "Select a Surah first"} />
                          </SelectTrigger>
                          {selectedSurah && (() => {
                            const withinPageUsed = new Set(
                              conciseBlocks
                                .filter((_, i) => i !== bIndex)
                                .map(b => b.verseNumber)
                                .filter(v => v > 0)
                            );
                            return (
                              <SelectContent className="bg-popover border-border rounded-xl shadow-lg max-h-[250px]">
                                {currentSurahVerses?.map(a => (
                                  <SelectItem
                                    key={a.numberInSurah}
                                    value={a.numberInSurah.toString()}
                                    disabled={withinPageUsed.has(a.numberInSurah) || crossSurahUsedVerses.has(a.numberInSurah)}
                                    className="py-3 data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed"
                                  >
                                    Verse {a.numberInSurah}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            );
                          })()}
                        </Select>
                        {!selectedSurah ? (
                          <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                            Please select a Surah first.
                          </p>
                        ) : !block.verseNumber && (
                          <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                            Select a verse number first to write an explanation.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Verse Display */}
                    {block.verseNumber > 0 && (
                      <div className="bg-muted/50 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[80px] border border-border/50">
                        <p className="arabic-text text-2xl leading-[2.5] text-center text-foreground font-arabic">
                          <TajweedText text={getVerseText(block.verseNumber)} showColors={settings.showTajweed} />
                        </p>
                      </div>
                    )}

                    {/* Explanation Inputs */}
                    {block.explanations.length > 0 && (() => {
                      const exp = block.explanations[0];
                      const eIndex = 0;
                      return (
                        <div className="bg-muted/30 rounded-[1.2rem] p-4 mt-6 border border-border/30">
                          <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
                            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">EXPLANATION</span>
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
                          <div className="space-y-3">
                            <div>
                              <textarea
                                disabled={block.verseNumber <= 0}
                                placeholder={block.verseNumber <= 0 ? "Select a Verse first to write an explanation..." : "Write your explanation..."}
                                value={exp.text}
                                onChange={e => updateExplanationText(bIndex, eIndex, e.target.value)}
                                className="w-full bg-card border border-border focus:border-primary rounded-xl p-3.5 text-[15px] text-foreground placeholder:text-muted-foreground min-h-[120px] resize-y outline-none transition-colors disabled:opacity-50 disabled:bg-muted/50 disabled:cursor-not-allowed"
                              />
                              {block.verseNumber <= 0 ? (
                                <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                                  Select a verse number first to write an explanation.
                                </p>
                              ) : exp.text.trim().length > 0 && exp.text.trim().length < 10 && (
                                <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                                  Need {10 - exp.text.trim().length} more characters.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}

              <button onClick={addVerseBlock} className="w-full border border-dashed border-border rounded-2xl py-[16px] text-muted-foreground font-medium flex justify-center items-center gap-2 bg-card transition-all">
                <Plus size={18} /> Add Verse Block
              </button>
            </motion.div>
          ) : (
            /* DEEPER LOOK MODE */
            <motion.div
              key="deeper"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6 pb-20 relative"
            >
              {!hasSelectedVerse && (
                <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[2px] rounded-[2rem] flex items-center justify-center p-8">
                  <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-muted/80 text-muted-foreground rounded-full flex items-center justify-center mb-5 mx-auto shadow-sm">
                      <Info size={28} />
                    </div>
                    <h4 className="text-foreground font-display text-lg font-bold mb-2">Verse Selection Required</h4>
                    <p className="text-muted-foreground text-[13.5px] max-w-[220px] leading-relaxed mx-auto">
                      Please select at least one verse in the <strong className="text-primary font-bold">Concise</strong> tab first.
                    </p>
                    <button
                      onClick={() => setMode('concise')}
                      className="mt-6 bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold text-[13px] hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/10"
                    >
                      Go to Concise Tab
                    </button>
                  </div>
                </div>
              )}

              <div className={`${!hasSelectedVerse ? 'pointer-events-none opacity-20' : ''}`}>
                {/* Verse Range */}
                <div>

                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-medium text-[#A69B9B] uppercase tracking-widest ml-1">VERSE(S)</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground transition-colors outline-none mr-1 p-1">
                          <Info size={16} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-5 text-sm bg-popover border-border shadow-xl rounded-2xl z-[100]">
                        <h4 className="font-semibold text-foreground mb-3 text-[15px]">Verse Range Rules</h4>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground mb-4 text-[13px] leading-relaxed">
                          <li>Only numbers, hyphens, and commas allowed.</li>
                          <li>Use hyphens to specify a continuous range.</li>
                          <li>Start of range must be less than end.</li>
                          <li>Numbers cannot exceed the Surah's total Verses.</li>
                        </ul>
                        <h5 className="font-medium text-foreground mb-2 text-[13px]">Valid Examples:</h5>
                        <p className="text-primary bg-primary/10 p-2.5 font-mono text-[12px] rounded-lg">1-3, 5, 7-10</p>
                        <h5 className="font-medium text-destructive mt-4 mb-2 text-[13px]">Invalid Examples:</h5>
                        <p className="text-destructive bg-destructive/10 p-2.5 font-mono text-[12px] opacity-90 rounded-lg">1-3-4 <span className="opacity-70">(too many hyphens)</span><br />5-3 <span className="opacity-70">(reversed range)</span></p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., 1-3, 5, 7"
                    value={verseRange}
                    onChange={handleVerseRangeChange}
                    className={`w-full bg-background border ${rangeError ? 'border-destructive focus:border-destructive' : 'border-[#E8E2E2] focus:border-[#5A2A31]'} rounded-2xl p-4 text-[15px] focus:outline-none transition-colors placeholder:text-[#A69B9B]`}
                  />
                  {rangeError ? (
                    <p className="text-destructive text-[12px] font-medium mt-2 ml-1">{rangeError}</p>
                  ) : !verseRange.trim() ? (
                    <p className="text-destructive text-[12px] font-medium mt-2 ml-1">Enter a Verse Range first.</p>
                  ) : (
                    <p className="text-[12px] text-[#A69B9B] mt-2 ml-1">Supports ranges, individual, or mixed</p>
                  )}
                </div>

                {/* Root Words */}
                <div className="bg-white border border-[#E8E2E2] rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] text-[#3A2424] font-medium">Root Words</span>
                    <Switch checked={rootWordsOn} onCheckedChange={setRootWordsOn} className="data-[state=checked]:bg-[#5A2A31]" />
                  </div>

                  {rootWordsOn && (
                    <div className="mt-5 space-y-4">
                      {rootWords.map((rw, rIndex) => (
                        <div key={rw.id} className="border border-[#E8E2E2] rounded-2xl p-4 bg-[#FCFAFA] relative">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-[13px] text-[#8C7D7D]">Root Word</span>
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="outline-none">
                                  <Trash2 size={16} className="text-[#E05252] transition-colors" />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] border-none bg-white dark:bg-background shadow-2xl p-6 [&>button]:hidden">
                                <DialogHeader className="space-y-2">
                                  <DialogTitle className="text-left text-lg font-bold">Delete Root Word?</DialogTitle>
                                  <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                                    Are you sure you want to delete the root word analysis for <strong>"{rootWords[rIndex].arabic}"</strong>? All analysis content inside this block will be lost.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-row justify-end gap-2 mt-4">
                                  <DialogClose asChild>
                                    <button className="h-10 px-6 rounded-full border border-border bg-secondary/10 text-foreground text-[13px] font-medium hover:bg-secondary/20 transition-all">
                                      Cancel
                                    </button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <button 
                                      onClick={() => { const nr = [...rootWords]; nr.splice(rIndex, 1); setRootWords(nr); }}
                                      className="h-10 px-6 rounded-full bg-destructive text-destructive-foreground text-[13px] font-bold hover:bg-destructive/90 transition-all shadow-md active:scale-95"
                                    >
                                      Delete
                                    </button>
                                  </DialogClose>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <input 
                                disabled={!verseRange.trim() || !!rangeError}
                                type="text" 
                                value={rw.arabic} 
                                onChange={e => { const nr = [...rootWords]; nr[rIndex].arabic = e.target.value; setRootWords(nr); }} 
                                className="w-full bg-white border border-[#E8E2E2] rounded-full px-4 py-3 text-[14px] font-arabic focus:outline-none focus:border-[#5A2A31] transition-colors placeholder:text-[#D2C8C8] placeholder:font-body placeholder:text-[14px] disabled:opacity-50 disabled:bg-[#FCFAFA] disabled:cursor-not-allowed" 
                                dir="rtl" 
                                placeholder={!verseRange.trim() || !!rangeError ? "Enter a Verse Range first" : "(e.g., يؤمنون) Arabic word"} 
                              />
                              {!verseRange.trim() || !!rangeError ? (
                                <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                                  Enter a Verse Range first.
                                </p>
                              ) : !rw.arabic.trim() && (
                                <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                                  Enter the Arabic word first.
                                </p>
                              )}
                            </div>
                            <div>
                              <input disabled={!rw.arabic.trim() || !verseRange.trim() || !!rangeError} type="text" value={rw.transliteration} onChange={e => { const nr = [...rootWords]; nr[rIndex].transliteration = e.target.value; setRootWords(nr); }} className="w-full bg-white border border-[#E8E2E2] rounded-full px-4 py-3 text-[14px] focus:outline-none focus:border-[#5A2A31] transition-colors placeholder:text-[#A69B9B] disabled:opacity-50 disabled:bg-[#FCFAFA] disabled:cursor-not-allowed" placeholder={!verseRange.trim() || !!rangeError ? "Enter a Verse Range first" : rw.arabic.trim() ? "Transliteration" : "Arabic word required first"} />
                              {!verseRange.trim() || !!rangeError ? (
                                <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                                  Enter a Verse Range first.
                                </p>
                              ) : !rw.arabic.trim() && (
                                <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                                  Enter the Arabic word first.
                                </p>
                              )}
                            </div>
                            <div>
                              <input disabled={!rw.arabic.trim() || !verseRange.trim() || !!rangeError} type="text" value={rw.rootLetters} onChange={e => { const nr = [...rootWords]; nr[rIndex].rootLetters = e.target.value; setRootWords(nr); }} className="w-full bg-white border border-[#E8E2E2] rounded-full px-4 py-3 text-[14px] font-arabic focus:outline-none focus:border-[#5A2A31] transition-colors placeholder:text-[#D2C8C8] placeholder:font-body placeholder:text-[14px] disabled:opacity-50 disabled:bg-[#FCFAFA] disabled:cursor-not-allowed" dir="rtl" placeholder={!verseRange.trim() || !!rangeError ? "Enter a Verse Range first" : rw.arabic.trim() ? "(e.g., أ-م-ن) Root letters" : "Arabic word required first"} />
                              {!verseRange.trim() || !!rangeError ? (
                                <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                                  Enter a Verse Range first.
                                </p>
                              ) : !rw.arabic.trim() && (
                                <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                                  Enter the Arabic word first.
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2 mb-1 px-1">
                              <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">EXPLANATION</span>
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
                            <div className="relative">
                              <textarea
                                disabled={!rw.arabic.trim() || !verseRange.trim() || !!rangeError}
                                value={rw.explanation}
                                onChange={e => { const nr = [...rootWords]; nr[rIndex].explanation = e.target.value; setRootWords(nr); }}
                                className="w-full bg-white border border-[#E8E2E2] rounded-2xl p-4 text-[14px] min-h-[80px] focus:outline-none focus:border-[#5A2A31] transition-colors placeholder:text-[#A69B9B] disabled:opacity-50 disabled:bg-[#FCFAFA] disabled:cursor-not-allowed"
                                placeholder={!verseRange.trim() || !!rangeError ? "Enter a Verse Range first" : rw.arabic.trim() ? "Explanation..." : "Arabic word required first..."}
                              />
                              {!verseRange.trim() || !!rangeError ? (
                                <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                                  Enter a Verse Range first.
                                </p>
                              ) : !rw.arabic.trim() ? (
                                <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                                   Enter the Arabic word first to write an explanation.
                                </p>
                              ) : rw.explanation.trim().length > 0 && rw.explanation.trim().length < 10 && (
                                <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                                  Need {10 - rw.explanation.trim().length} more characters.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-col">
                        <button
                          disabled={!verseRange.trim() || !!rangeError}
                          onClick={() => {
                            setRootWords([...rootWords, { id: generateId(), arabic: '', transliteration: '', rootLetters: '', explanation: '' }]);
                          }}
                          className={`w-full border border-dashed border-[#D2C8C8] rounded-full py-3.5 text-[#8C7D7D] font-medium flex justify-center items-center gap-2 transition-all ${!verseRange.trim() || !!rangeError ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Plus size={18} /> Add Root Word
                        </button>
                        {(!verseRange.trim() || !!rangeError) && (
                          <p className="text-destructive text-[12px] font-medium mt-2 text-center w-full">
                            {rangeError ? "Fix the verse range error first." : "Enter a Verse Range first."}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories */}
                <div className="mb-24">
                  <label className="block text-[11px] font-medium text-[#A69B9B] uppercase tracking-widest mb-3 ml-1">CATEGORIES</label>
                  <Accordion type="single" collapsible className="space-y-4">
                    {categories.map((cat, cIndex) => (
                      <AccordionItem 
                        key={cat.id} 
                        value={cat.id} 
                        className="bg-white border border-[#E8E2E2] rounded-[1.5rem] px-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] data-[state=open]:shadow-[0_4px_25px_rgba(0,0,0,0.08)] transition-all mb-4 border-none"
                      >
                        <AccordionTrigger className="no-underline py-5 font-bold text-[#3A2424] tracking-wide uppercase px-1 hover:no-underline">
                          {cat.title}
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 pt-2">
                          <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">CONTENT</span>
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
                          <div>
                            <textarea
                              disabled={!verseRange.trim() || !!rangeError}
                              value={cat.content}
                              onChange={e => { const nc = [...categories]; nc[cIndex].content = e.target.value; setCategories(nc); }}
                              className="w-full bg-white border border-[#E8E2E2] rounded-2xl p-4 text-[14px] min-h-[140px] focus:outline-none focus:border-[#5A2A31] disabled:opacity-50 disabled:bg-[#FCFAFA] disabled:cursor-not-allowed"
                              placeholder={!verseRange.trim() || !!rangeError ? "Enter a Verse Range first" : `Write about ${cat.title.toLowerCase()}...`}
                            />
                            {!verseRange.trim() || !!rangeError ? (
                              <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                                Enter a Verse Range first.
                              </p>
                            ) : cat.content.trim().length > 0 && cat.content.trim().length < 10 && (
                              <p className="text-destructive text-[12px] font-medium mt-2 ml-1">
                                Need {10 - cat.content.trim().length} more characters.
                              </p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {(!verseRange.trim() || !!rangeError) && (
                    <div className="flex flex-col mt-4">
                      <p className="text-destructive text-[12px] font-medium text-center w-full">
                        {rangeError ? "Fix the verse range error first." : "Enter a Verse Range first."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save Button (Fixed at bottom) */}
      <div className="fixed bottom-0 inset-x-0 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))] bg-background/80 backdrop-blur-md border-t border-border/50 z-[70]">
        <button
          onClick={() => {
            if (isSaveDisabled) {
              if (!selectedSurah) {
                toast({
                  title: "Selection Required",
                  description: "Please select a Surah first.",
                  variant: "destructive",
                  icon: <AlertCircle size={18} />
                });
              }
              else if (mode === 'deeper' && !verseRange.trim()) {
                toast({
                  title: "Range Required",
                  description: "Enter a verse range for the Deeper Look study.",
                  variant: "destructive",
                  icon: <AlertCircle size={18} />
                });
              }
              else if (mode === 'deeper' && !!rangeError) {
                toast({
                  title: "Range Error",
                  description: "Fix the verse range error before saving.",
                  variant: "destructive",
                  icon: <AlertCircle size={18} />
                });
              }
              else if (!hasAtLeastOneExplanation) {
                toast({
                  title: "Content Missing",
                  description: "Add at least one concise note or deeper look entry.",
                  variant: "destructive",
                  icon: <AlertCircle size={18} />
                });
              }
              else if (!hasConciseContent) {
                toast({
                  title: "Content Missing",
                  description: "Add at least one concise note (min. 10 characters) in the Verse Block section.",
                  variant: "destructive",
                  icon: <AlertCircle size={18} />
                });
              }
              else if (!hasChanges) {
                toast({
                  title: "No Changes",
                  description: "Everything is already saved.",
                  variant: "default",
                  icon: <CheckCircle size={18} />
                });
              }
              return;
            }
            handleSave();
          }}
          className={`w-full max-w-md mx-auto py-[14px] rounded-full font-medium text-[16px] transition-all flex justify-center items-center ${isSaveDisabled
              ? 'bg-secondary text-muted-foreground/80'
              : 'bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(var(--primary),0.25)]'
            }`}
        >
          Save Explanation
        </button>
      </div>
      </motion.div>
    </AnimatePresence>
  );
}
