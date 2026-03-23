import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, FileText, Search, Eye, Bookmark, ArrowUpDown, Check, ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { useExplanations, useCustomTafsirs } from '@/hooks/useAppStore';
import { useSurahs } from '@/hooks/useQuranData';
import { formatVerseRange, cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  const { tafsirRecords, deleteTafsirRecord } = useCustomTafsirs();
  const { data: surahs } = useSurahs();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'tafsirs' ? 'tafsirs' : 'explanations';
  
  const setActiveTab = (tab: 'explanations' | 'tafsirs') => {
    setSearchParams({ tab }, { replace: true });
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTab === 'explanations') setActiveTab('tafsirs');
    },
    onSwipedRight: () => {
      if (activeTab === 'tafsirs') setActiveTab('explanations');
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 40,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [activeTab]);
  type SortOrder = 'asc' | 'desc' | 'lastEdited' | 'dateAdded';
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [collapsedSurahs, setCollapsedSurahs] = useState<Set<number>>(new Set());

  const toggleSurah = (surahNum: number) => {
    setCollapsedSurahs(prev => {
      const next = new Set(prev);
      if (next.has(surahNum)) next.delete(surahNum);
      else next.add(surahNum);
      return next;
    });
  };

  const sortLabels: Record<SortOrder, string> = {
    asc: 'Ascending',
    desc: 'Descending',
    lastEdited: 'Last Edited',
    dateAdded: 'Date Added',
  };

  const items = activeTab === 'explanations' ? explanations : tafsirRecords;

  const sortItems = (list: (typeof explanations[0] | typeof tafsirRecords[0])[]) => {
    return [...list].sort((a, b) => {
      let aVerse = 0;
      let bVerse = 0;

      if (activeTab === 'explanations') {
        const exp = a as typeof explanations[0];
        const nextExp = b as typeof explanations[0];
        aVerse = (exp.concise?.length ? exp.concise.map((c: {verseNumber: number}) => c.verseNumber).filter((v: number) => v > 0) : exp.verses || []).sort((x: number, y: number) => x - y)[0] ?? 0;
        bVerse = (nextExp.concise?.length ? nextExp.concise.map((c: {verseNumber: number}) => c.verseNumber).filter((v: number) => v > 0) : nextExp.verses || []).sort((x: number, y: number) => x - y)[0] ?? 0;
      } else {
        aVerse = (a as typeof tafsirRecords[0]).verseNumber;
        bVerse = (b as typeof tafsirRecords[0]).verseNumber;
      }

      if (sortOrder === 'asc') return aVerse - bVerse;
      if (sortOrder === 'desc') return bVerse - aVerse;
      if (sortOrder === 'lastEdited') return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      if (sortOrder === 'dateAdded') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      return 0;
    });
  };

  // Group by Surah
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.surahNumber]) acc[item.surahNumber] = [];
    acc[item.surahNumber].push(item);
    return acc;
  }, {} as Record<number, (typeof explanations[0] | typeof tafsirRecords[0])[]>);

  const getSurahName = (num: number) => surahs?.find(s => s.number === num)?.name || `Surah ${num}`;
  const getSurahArabic = (num: number) => surahs?.find(s => s.number === num)?.nameArabic || '';

  const filteredSurahNumbers = Object.keys(groupedItems)
    .map(Number)
    .filter(num => {
      const name = getSurahName(num).toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || num.toString().includes(query);
    })
    .sort((a, b) => a - b);

  const handleDelete = (id: string) => {
    if (activeTab === 'explanations') {
      deleteExplanation(id);
    } else {
      deleteTafsirRecord(id);
    }
  };

  return (
    <motion.div {...handlers} className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pb-2 pt-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border/60 transform-gpu">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-accent active:scale-95 text-foreground outline-none"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-semibold text-foreground flex-1">
            Manage {activeTab === 'explanations' ? 'Explanations' : 'Tafsirs'}
          </h1>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-md mx-auto space-y-6">
        {/* Tabs */}
        <div className="mb-4 rounded-full border border-border bg-secondary/40 p-1 backdrop-blur-sm relative">
          <div className="grid grid-cols-2 gap-1 relative">
            {[
              { id: 'explanations', label: 'Explanations' },
              { id: 'tafsirs', label: 'Tafsirs' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'explanations' | 'tafsirs')}
                  className={cn(
                    "relative rounded-full px-4 py-2.5 text-xs font-semibold transition-colors z-10",
                    active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="manageTabIndicator"
                      className="absolute inset-0 bg-primary rounded-full shadow-sm z-[-1]"
                      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Filter & Add New */}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-[46px] w-[46px] sm:w-auto sm:px-4 flex items-center justify-center gap-1.5 rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors font-medium text-[13px] whitespace-nowrap">
                <ArrowUpDown size={15} />
                <span className="hidden sm:inline">{sortLabels[sortOrder]}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-2xl bg-white/95 backdrop-blur-sm dark:bg-black/95 border-border shadow-xl">
              {(['asc', 'desc', 'lastEdited', 'dateAdded'] as SortOrder[]).map(opt => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => setSortOrder(opt)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${sortOrder === opt
                      ? 'bg-primary/25 text-primary font-semibold'
                      : 'text-foreground data-[highlighted]:bg-foreground/[0.05] data-[highlighted]:text-foreground font-medium'
                    }`}
                >
                  <span className="text-[13.5px] font-medium">{sortLabels[opt]}</span>
                  {sortOrder === opt && <Check size={14} className="text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => navigate(activeTab === 'explanations' ? '/explanation-builder' : '/tafsir-builder')}
            className="bg-primary text-primary-foreground px-4 rounded-2xl flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap gap-2 font-medium text-[14px]"
          >
            <Plus size={18} /> Add New
          </button>
        </div>

        {/* Explanations List */}
        <div className="relative min-h-[50vh]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-8 w-full"
              >
                {(filteredSurahNumbers.length > 0 ? filteredSurahNumbers : [1, 2, 3]).map((surahNum, i) => {
                  const subItems = filteredSurahNumbers.length > 0 ? sortItems(groupedItems[surahNum]) : Array.from({ length: i === 1 ? 3 : 1 });
                  return (
                    <div key={surahNum} className="space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-border/40">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/5 animate-pulse" />
                          <div className="h-4 w-24 bg-muted/50 animate-pulse rounded" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-16 bg-muted/40 animate-pulse rounded" />
                          <div className="w-6 h-6 bg-muted/40 animate-pulse rounded-md" />
                        </div>
                      </div>
                      <div className="space-y-3 pt-3 pb-1">
                        {subItems.map((_, j) => (
                          <div key={filteredSurahNumbers.length > 0 ? (subItems[j] as {id: string}).id : j} className="bg-muted/10 border border-border/50 rounded-[1.2rem] p-4 flex items-center justify-between gap-4">
                            <div className="flex-1 flex items-center min-w-0 pr-4">
                              <div className="h-[34px] w-[100px] rounded-full bg-primary/[0.03] animate-pulse border border-primary/5" />
                            </div>
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-secondary/40 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <FileText size={32} className="text-muted-foreground" />
                    </div>
                    <p className="text-[15px] font-medium text-foreground mb-1">No {activeTab} yet</p>
                    <p className="text-[13px] text-muted-foreground">Start deep-diving into the Quran by adding your first {activeTab === 'explanations' ? 'explanation' : 'tafsir'}.</p>
                  </div>
                ) : filteredSurahNumbers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-[15px] text-muted-foreground">No matching {activeTab} found.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <AnimatePresence>
                      {filteredSurahNumbers.map(surahNum => (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          key={`group-${surahNum}`}
                          className="space-y-3"
                        >
                          <div
                            onClick={() => toggleSurah(surahNum)}
                            className="flex items-center justify-between pb-1 border-b border-border/40 cursor-pointer group"
                          >
                            <h3 className="font-semibold text-[14px] text-muted-foreground flex items-center gap-2 group-hover:text-foreground transition-colors">
                              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold tabular-nums">
                                {surahNum}
                              </span>
                              {getSurahName(surahNum)}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className="font-arabic text-primary/70 text-lg">
                                {getSurahArabic(surahNum)}
                              </span>
                              <button className="text-muted-foreground group-hover:text-foreground transition-colors p-1 -mr-1 rounded-md hover:bg-accent flex items-center justify-center">
                                {collapsedSurahs.has(surahNum) ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                              </button>
                            </div>
                          </div>

                          <AnimatePresence initial={false}>
                            {!collapsedSurahs.has(surahNum) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-3 pt-3 pb-1">
                                  <AnimatePresence>
                                    {sortItems(groupedItems[surahNum]).map(item => {
                                      const verseText = activeTab === 'explanations' 
                                        ? (formatVerseRange((item as typeof explanations[0]).concise?.length ? (item as typeof explanations[0]).concise.map((b: {verseNumber: number}) => b.verseNumber).filter((v: number) => v > 0) : (item as typeof explanations[0]).verses || []) || (item as typeof explanations[0]).verseRange || '')
                                        : `Verse ${(item as typeof tafsirRecords[0]).verseNumber}`;
                                      
                                      const isMultiple = activeTab === 'explanations' && (verseText.includes('-') || verseText.includes(','));

                                      return (
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.95 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.95 }}
                                          transition={{ duration: 0.25, ease: "easeOut" }}
                                          key={item.id}
                                          onClick={() => navigate(activeTab === 'explanations' ? `/explanation-view?id=${item.id}` : `/tafsir-view?surah=${item.surahNumber}&verse=${(item as typeof tafsirRecords[0]).verseNumber}`)}
                                          className="bg-card border border-border rounded-[1.2rem] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4 group hover:border-primary/40 cursor-pointer active:scale-[0.98] transition-all"
                                        >
                                          <div className="flex-1 flex items-center min-w-0 pr-4">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-primary font-medium text-[13px] border border-primary/10 shadow-sm">
                                              <Bookmark size={14} className="opacity-70" />
                                              {activeTab === 'explanations' ? (isMultiple ? 'Verses' : 'Verse') : ''} {verseText}
                                            </div>
                                          </div>
                                          <div className="flex items-center" onClick={e => e.stopPropagation()}>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <button className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors outline-none cursor-pointer">
                                                  <MoreVertical size={20} />
                                                </button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl bg-white/95 backdrop-blur-sm dark:bg-black/95 border-border shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                                                <DropdownMenuItem 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const v = activeTab === 'explanations' 
                                                      ? ((item as typeof explanations[0]).concise?.length ? (item as typeof explanations[0]).concise.map((c: {verseNumber: number}) => c.verseNumber).filter((v: number) => v > 0) : (item as typeof explanations[0]).verses || []).sort((x: number, y: number) => x - y)[0]
                                                      : (item as typeof tafsirRecords[0]).verseNumber;
                                                    navigate(v ? `/surah/${surahNum}?verse=${v}` : `/surah/${surahNum}`);
                                                  }}
                                                  className="flex items-center gap-2.5 px-3 py-2.5 outline-none rounded-xl cursor-pointer hover:bg-secondary transition-colors text-[14px] font-medium"
                                                >
                                                  <Eye size={16} /> Show Verse
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(activeTab === 'explanations' ? `/explanation-builder?id=${item.id}` : `/tafsir-builder?surah=${item.surahNumber}&verse=${(item as typeof tafsirRecords[0]).verseNumber}`);
                                                  }}
                                                  className="flex items-center gap-2.5 px-3 py-2.5 outline-none rounded-xl cursor-pointer hover:bg-secondary transition-colors text-[14px] font-medium"
                                                >
                                                  <Edit2 size={16} /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-border/50 my-1 mx-1" />
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem 
                                                      onSelect={e => e.preventDefault()}
                                                      className="flex items-center gap-2.5 px-3 py-2.5 outline-none bg-destructive/5 rounded-xl cursor-pointer hover:bg-destructive/10 text-destructive transition-colors text-[14px] font-medium"
                                                    >
                                                      <Trash2 size={16} /> Delete
                                                    </DropdownMenuItem>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-[1.5rem]" onClick={e => e.stopPropagation()}>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>Delete {activeTab === 'explanations' ? 'Explanation' : 'Tafsir'}?</AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                        Are you sure you want to delete this {activeTab === 'explanations' ? 'explanation' : 'tafsir'} for <strong>Surah {getSurahName(surahNum)} {verseText}</strong>? This action cannot be undone.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="flex gap-2 sm:gap-0 mt-2">
                                                      <AlertDialogCancel className="rounded-xl border-border h-11">Cancel</AlertDialogCancel>
                                                      <AlertDialogAction
                                                        onClick={() => handleDelete(item.id)}
                                                        className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground h-11"
                                                      >
                                                        Delete
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </AnimatePresence>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
