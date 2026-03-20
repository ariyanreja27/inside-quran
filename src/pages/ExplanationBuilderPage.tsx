import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurahs, useSurahAyahs } from '@/hooks/useQuranData';
import { useExplanations } from '@/hooks/useAppStore';
import type { Explanation, ConciseBlock, RootWord, DeeperLookCategory } from '@/types/quran';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function ExplanationBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const urlSurah = searchParams.get('surah') ? parseInt(searchParams.get('surah')!) : null;
  const urlAyah = searchParams.get('ayah') ? parseInt(searchParams.get('ayah')!) : null;

  const { data: surahs } = useSurahs();
  const { explanations, getExplanation, saveExplanation } = useExplanations();

  const [mode, setMode] = useState<'concise' | 'deeper'>('concise');
  const [selectedSurah, setSelectedSurah] = useState<number | ''>(urlSurah || '');
  
  // Concise Form State
  const [conciseBlocks, setConciseBlocks] = useState<ConciseBlock[]>([]);
  
  // Deeper Look Form State
  const [ayahRange, setAyahRange] = useState<string>('');
  const [rootWordsOn, setRootWordsOn] = useState(false);
  const [rootWords, setRootWords] = useState<RootWord[]>([]);
  const [categories, setCategories] = useState<DeeperLookCategory[]>([]);

  // Editing logic
  const [currentId, setCurrentId] = useState<string>(() => crypto.randomUUID());
  const [isLoaded, setIsLoaded] = useState(false);

  // Ayah data fetching
  const { data: currentSurahAyahs } = useSurahAyahs(selectedSurah || 1);

  // Scroll ref
  const blockRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (isLoaded) return;
    
    let existing: Explanation | undefined;
    
    if (editId) {
      existing = explanations.find(e => e.id === editId);
    } else if (urlSurah && urlAyah) {
      existing = getExplanation(urlSurah, urlAyah);
    }

    if (existing) {
      setCurrentId(existing.id);
      setSelectedSurah(existing.surahNumber);
      setConciseBlocks(existing.concise || []);
      setAyahRange(existing.ayahRange || '');
      if (existing.deeperLook) {
        setRootWords(existing.deeperLook.rootWords || []);
        if (existing.deeperLook.rootWords?.length > 0) setRootWordsOn(true);
        setCategories(existing.deeperLook.categories || []);
        if (existing.concise?.length === 0 && (existing.deeperLook.rootWords?.length > 0 || existing.deeperLook.categories?.length > 0)) {
           setMode('deeper');
        }
      }
    } else if (urlSurah && urlAyah) {
      setConciseBlocks([{
        ayahNumber: urlAyah,
        explanations: [{ id: crypto.randomUUID(), title: '', text: '' }]
      }]);
    }
    
    setIsLoaded(true);
  }, [editId, urlSurah, urlAyah, explanations, getExplanation, isLoaded]);

  useEffect(() => {
    if (isLoaded && urlAyah && conciseBlocks.length > 0 && mode === 'concise') {
      const timer = setTimeout(() => {
        const ref = blockRefs.current[urlAyah];
        if (ref) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, urlAyah, conciseBlocks.length, mode]);

  const handleSave = () => {
    if (!selectedSurah) {
      alert("Please select a Surah first.");
      return;
    }

    const allAyahs = new Set<number>();
    
    // Only save blocks that have an ayah selected and some text
    const validConcise = conciseBlocks.filter(b => 
       b.ayahNumber > 0 && b.explanations.some(e => e.text.trim().length > 0 || String(e.title).trim().length > 0)
    );

    validConcise.forEach(b => {
      if (b.ayahNumber) allAyahs.add(Number(b.ayahNumber));
    });

    const parts = ayahRange.split(',').map(s => s.trim());
    parts.forEach(p => {
      if (p.includes('-')) {
        const [start, end] = p.split('-').map(Number);
        for (let i = start; i <= end; i++) {
           if (!isNaN(i) && i > 0) allAyahs.add(i);
        }
      } else if (p && !isNaN(Number(p))) {
        allAyahs.add(Number(p));
      }
    });

    // Clean up empty root words and categories so view page isn't polluted
    const validRootWords = rootWords.filter(rw => rw.arabic.trim() || rw.rootLetters.trim() || rw.explanation.trim());
    const validCategories = categories.filter(c => c.title.trim() || c.content.trim());

    const newExplanation: Explanation = {
      id: currentId,
      surahNumber: Number(selectedSurah),
      ayahs: Array.from(allAyahs).sort((a, b) => a - b),
      ayahRange: ayahRange,
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

  const getAyahText = (ayahNum: number) => {
    return currentSurahAyahs?.find(a => a.numberInSurah === Number(ayahNum))?.text || '';
  };

  const addAyahBlock = () => setConciseBlocks([...conciseBlocks, { ayahNumber: 0, explanations: [{ id: crypto.randomUUID(), title: '', text: '' }] }]);
  const removeAyahBlock = (index: number) => { const nb = [...conciseBlocks]; nb.splice(index, 1); setConciseBlocks(nb); };
  const updateAyahBlock = (index: number, val: number) => { const nb = [...conciseBlocks]; nb[index].ayahNumber = val; setConciseBlocks(nb); };
  
  const addExplanationToBlock = (bIndex: number) => { const nb = [...conciseBlocks]; nb[bIndex].explanations.push({ id: crypto.randomUUID(), title: '', text: '' }); setConciseBlocks(nb); };
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

  return (
    <div className="min-h-screen pb-32 bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border/60 pb-2">
        <div className="flex items-center gap-3 px-4 h-16 pt-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl transition hover:bg-accent text-foreground">
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
                <SelectItem key={s.number} value={s.number.toString()} className="rounded-lg mb-1 focus:bg-accent focus:text-accent-foreground data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary py-3 cursor-pointer">
                  <div className="flex justify-between items-center w-full min-w-[200px]">
                     <span className="text-[15px] font-medium">{s.number}. {s.name}</span>
                     <span className="font-arabic text-primary text-lg pr-3">{s.nameArabic}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                   className={`relative flex-1 py-2 text-[14px] font-semibold rounded-full transition-colors tracking-wide z-10 ${
                     active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-primary'
                   }`}
                 >
                   {active && (
                     <motion.div
                       layoutId="activeTab-builder"
                       className="absolute inset-0 bg-primary rounded-full shadow-md z-[-1]"
                       transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                     />
                   )}
                   {m === 'concise' ? 'Concise' : 'Deeper Look'}
                 </motion.button>
               );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'concise' ? (
             /* CONCISE MODE */
             <motion.div
               key="concise"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2, ease: "easeOut" }}
               className="space-y-6"
             >
                {conciseBlocks.map((block, bIndex) => (
                  <div key={bIndex} className="bg-card border border-border rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative" ref={(el) => (blockRefs.current[block.ayahNumber] = el)}>
                     <div className="flex items-center justify-between mb-5">
                        <h3 className="font-semibold text-[13px] text-muted-foreground uppercase tracking-widest">AYAH BLOCK</h3>
                        <button onClick={() => removeAyahBlock(bIndex)} className="text-destructive p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
                           <Trash2 size={18} />
                        </button>
                     </div>
                     
                     <div className="space-y-4">
                        {/* Select Ayah */}
                         <div>
                          <label className="block text-[14px] text-muted-foreground mb-2 ml-1">Select Ayah</label>
                          <Select value={block.ayahNumber ? block.ayahNumber.toString() : ''} onValueChange={(v) => updateAyahBlock(bIndex, Number(v))}>
                            <SelectTrigger className="w-full bg-muted/50 border-none rounded-2xl h-[56px] px-4 text-[15px] text-foreground focus:ring-0">
                              <SelectValue placeholder="Select Ayah" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border rounded-xl shadow-lg max-h-[250px]">
                              {currentSurahAyahs?.map(a => (
                                <SelectItem key={a.numberInSurah} value={a.numberInSurah.toString()} className="py-3">Ayah {a.numberInSurah}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
  
                        {/* Ayah Display */}
                         {block.ayahNumber > 0 && (
                            <div className="bg-muted/50 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[80px] border border-border/50">
                               <p className="arabic-text text-2xl leading-[2.5] text-center text-foreground font-arabic" dangerouslySetInnerHTML={{ __html: getAyahText(block.ayahNumber).replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '<span class="bismillah-text text-xl block mb-3">﷽</span>') }} />
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
                               </div>
                              <div className="space-y-3">
                                 <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide pt-1">
                                    <button onClick={() => insertMarkdownToConcise(bIndex, eIndex, '## Heading')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Heading</button>
                                    <button onClick={() => insertMarkdownToConcise(bIndex, eIndex, '**bold**')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Bold</button>
                                    <button onClick={() => insertMarkdownToConcise(bIndex, eIndex, '- list item')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">List</button>
                                    <button onClick={() => insertMarkdownToConcise(bIndex, eIndex, '- [ ] task')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Checklist</button>
                                    <button onClick={() => insertMarkdownToConcise(bIndex, eIndex, '> quote')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Quote</button>
                                    <button onClick={() => insertMarkdownToConcise(bIndex, eIndex, '`code`')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Code</button>
                                    <button onClick={() => insertMarkdownToConcise(bIndex, eIndex, '| Header | Header |\n| --- | --- |\n| Cell | Cell |')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Table</button>
                                    <button onClick={() => insertMarkdownToConcise(bIndex, eIndex, '[link text](url)')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Link</button>
                                 </div>
                                 <textarea 
                                   placeholder="Write your explanation..."
                                   value={exp.text}
                                   onChange={e => updateExplanationText(bIndex, eIndex, e.target.value)}
                                   className="w-full bg-card border border-border hover:border-primary/50 focus:border-primary rounded-xl p-3.5 text-[15px] text-foreground placeholder:text-muted-foreground min-h-[120px] resize-y outline-none transition-colors"
                                 />
                              </div>
                           </div>
                         );
                         })()}
                     </div>
                  </div>
                ))}
                
                <button onClick={addAyahBlock} className="w-full border border-dashed border-border rounded-2xl py-[18px] text-muted-foreground font-medium flex justify-center items-center gap-2 bg-card hover:bg-accent transition-all">
                   <Plus size={18} /> Add Ayah Block
                </button>
             </motion.div>
          ) : (
             /* DEEPER LOOK MODE */
             <motion.div
               key="deeper"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2, ease: "easeOut" }}
               className="space-y-7"
             >
                {/* Ayah Range */}
                <div>
                  <label className="block text-[11px] font-medium text-[#A69B9B] uppercase tracking-widest mb-2 ml-1">AYAH(S)</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 1-3, 5, 7" 
                    value={ayahRange}
                    onChange={e => setAyahRange(e.target.value)}
                    className="w-full bg-white border border-[#E8E2E2] rounded-2xl p-4 text-[15px] focus:outline-none focus:border-[#5A2A31] transition-colors placeholder:text-[#A69B9B]"
                  />
                  <p className="text-[12px] text-[#A69B9B] mt-2 ml-1">Supports ranges (1-3), individual (1,5), or mixed</p>
                </div>
  
                {/* Root Words */}
                <div className="bg-white border border-[#E8E2E2] rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
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
                                 <button onClick={() => { const nr = [...rootWords]; nr.splice(rIndex, 1); setRootWords(nr); }}>
                                   <Trash2 size={16} className="text-[#E05252] hover:text-red-700" />
                                 </button>
                              </div>
                              <div className="space-y-3">
                                 <input type="text" value={rw.arabic} onChange={e => { const nr = [...rootWords]; nr[rIndex].arabic = e.target.value; setRootWords(nr); }} className="w-full bg-white border border-[#E8E2E2] rounded-full px-4 py-3 text-[14px] font-arabic focus:outline-none focus:border-[#5A2A31] transition-colors placeholder:text-[#D2C8C8] placeholder:font-body placeholder:text-[14px]" dir="rtl" placeholder="(e.g., يؤمنون) Arabic word" />
                                 <input type="text" value={rw.transliteration} onChange={e => { const nr = [...rootWords]; nr[rIndex].transliteration = e.target.value; setRootWords(nr); }} className="w-full bg-white border border-[#E8E2E2] rounded-full px-4 py-3 text-[14px] focus:outline-none focus:border-[#5A2A31] transition-colors placeholder:text-[#A69B9B]" placeholder="Transliteration" />
                                 <input type="text" value={rw.rootLetters} onChange={e => { const nr = [...rootWords]; nr[rIndex].rootLetters = e.target.value; setRootWords(nr); }} className="w-full bg-white border border-[#E8E2E2] rounded-full px-4 py-3 text-[14px] font-arabic focus:outline-none focus:border-[#5A2A31] transition-colors placeholder:text-[#D2C8C8] placeholder:font-body placeholder:text-[14px]" dir="rtl" placeholder="(e.g., أ-م-ن) Root letters" />
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide pt-1">
                                       <button onClick={() => insertMarkdownToRootWord(rIndex, '## Heading')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Heading</button>
                                       <button onClick={() => insertMarkdownToRootWord(rIndex, '**bold**')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Bold</button>
                                       <button onClick={() => insertMarkdownToRootWord(rIndex, '- list item')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">List</button>
                                       <button onClick={() => insertMarkdownToRootWord(rIndex, '- [ ] task')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Checklist</button>
                                       <button onClick={() => insertMarkdownToRootWord(rIndex, '> quote')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Quote</button>
                                       <button onClick={() => insertMarkdownToRootWord(rIndex, '`code`')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Code</button>
                                       <button onClick={() => insertMarkdownToRootWord(rIndex, '| Header | Header |\n| --- | --- |\n| Cell | Cell |')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Table</button>
                                       <button onClick={() => insertMarkdownToRootWord(rIndex, '[link text](url)')} className="bg-background border border-border text-muted-foreground px-3 py-1.5 rounded-md text-[11px] whitespace-nowrap hover:bg-accent hover:text-primary transition-colors">Link</button>
                                    </div>
                                    <textarea value={rw.explanation} onChange={e => { const nr = [...rootWords]; nr[rIndex].explanation = e.target.value; setRootWords(nr); }} className="w-full bg-white border border-[#E8E2E2] rounded-2xl p-4 text-[14px] min-h-[80px] focus:outline-none focus:border-[#5A2A31] transition-colors placeholder:text-[#A69B9B]" placeholder="Explanation..." />
                              </div>
                           </div>
                         ))}
                         <button onClick={() => setRootWords([...rootWords, { id: crypto.randomUUID(), arabic: '', transliteration: '', rootLetters: '', explanation: '' }])} className="w-full border border-dashed border-[#D2C8C8] rounded-full py-3.5 text-[#8C7D7D] font-medium flex justify-center items-center gap-2 hover:bg-[#F8F6F4] transition-all">
                           <Plus size={18} /> Add Root Word
                         </button>
                      </div>
                   )}
                </div>
  
                {/* Categories */}
                <div className="mb-24">
                   <label className="block text-[11px] font-medium text-[#A69B9B] uppercase tracking-widest mb-3 ml-1">CATEGORIES</label>
                   
                   {categories.map((cat, cIndex) => (
                     <div key={cat.id} className="bg-white border border-[#E8E2E2] rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-4">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[13px] text-[#8C7D7D]">Category</span>
                           <button onClick={() => { const nc = [...categories]; nc.splice(cIndex, 1); setCategories(nc); }}>
                             <Trash2 size={16} className="text-[#E05252] hover:text-red-700" />
                           </button>
                        </div>
                        <input type="text" value={cat.title} onChange={e => { const nc = [...categories]; nc[cIndex].title = e.target.value; setCategories(nc); }} className="w-full bg-white border border-[#E8E2E2] rounded-full px-4 py-3.5 text-[14px] mb-4 focus:outline-none focus:border-[#5A2A31]" placeholder="Category Title" />
                        
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                           <button onClick={() => insertMarkdown(cIndex, '## Heading')} className="bg-[#F3F0EF] text-[#8C7D7D] px-3 py-1.5 rounded-md text-[12px] whitespace-nowrap hover:bg-[#EBE6E4]">Heading</button>
                           <button onClick={() => insertMarkdown(cIndex, '**bold**')} className="bg-[#F3F0EF] text-[#8C7D7D] px-3 py-1.5 rounded-md text-[12px] whitespace-nowrap hover:bg-[#EBE6E4]">Bold</button>
                           <button onClick={() => insertMarkdown(cIndex, '- list item')} className="bg-[#F3F0EF] text-[#8C7D7D] px-3 py-1.5 rounded-md text-[12px] whitespace-nowrap hover:bg-[#EBE6E4]">List</button>
                           <button onClick={() => insertMarkdown(cIndex, '- [ ] task')} className="bg-[#F3F0EF] text-[#8C7D7D] px-3 py-1.5 rounded-md text-[12px] whitespace-nowrap hover:bg-[#EBE6E4]">Checklist</button>
                           <button onClick={() => insertMarkdown(cIndex, '> quote')} className="bg-[#F3F0EF] text-[#8C7D7D] px-3 py-1.5 rounded-md text-[12px] whitespace-nowrap hover:bg-[#EBE6E4]">Quote</button>
                           <button onClick={() => insertMarkdown(cIndex, '`code`')} className="bg-[#F3F0EF] text-[#8C7D7D] px-3 py-1.5 rounded-md text-[12px] whitespace-nowrap hover:bg-[#EBE6E4]">Code</button>
                           <button onClick={() => insertMarkdown(cIndex, '| Header | Header |\n| --- | --- |\n| Cell | Cell |')} className="bg-[#F3F0EF] text-[#8C7D7D] px-3 py-1.5 rounded-md text-[12px] whitespace-nowrap hover:bg-[#EBE6E4]">Table</button>
                           <button onClick={() => insertMarkdown(cIndex, '[link text](url)')} className="bg-[#F3F0EF] text-[#8C7D7D] px-3 py-1.5 rounded-md text-[12px] whitespace-nowrap hover:bg-[#EBE6E4]">Link</button>
                        </div>
                        
                        <textarea value={cat.content} onChange={e => { const nc = [...categories]; nc[cIndex].content = e.target.value; setCategories(nc); }} className="w-full bg-white border border-[#E8E2E2] rounded-2xl p-4 text-[14px] min-h-[140px] focus:outline-none focus:border-[#5A2A31]" placeholder="## Heading&#10;&#10;Your content here...&#10;&#10;Use **bold** for emphasis" />
                     </div>
                   ))}
  
                   <button onClick={() => setCategories([...categories, { id: crypto.randomUUID(), title: '', content: '', order: categories.length }])} className="w-full border border-dashed border-[#D2C8C8] rounded-2xl py-[18px] text-[#8C7D7D] font-medium flex justify-center items-center gap-2 bg-white hover:bg-[#F8F6F4] transition-all">
                     <Plus size={18} /> Add Category
                   </button>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 pb-8 bg-gradient-to-t from-background via-background/90 to-transparent z-50">
        <button 
          onClick={handleSave}
          className="w-full max-w-md mx-auto bg-primary text-primary-foreground py-[14px] rounded-full font-medium text-[16px] shadow-[0_8px_20px_rgba(var(--primary),0.25)] hover:bg-primary/90 active:scale-[0.98] transition-all flex justify-center items-center"
        >
          Save Explanation
        </button>
      </div>
    </div>
  );
}
