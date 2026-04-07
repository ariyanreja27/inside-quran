import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { Star, BookmarkCheck, ArrowLeft, MoreHorizontal, Trash2, Search, ArrowUpDown, Check, ChevronUp, ChevronDown, MoreVertical, FileText, Eye, Edit2, Book, FolderPlus, Plus, X, Bookmark, Folder, Heart, Box, Layers, Briefcase, Coffee, List, Camera, Music, Image, Map, Compass, Shield, Flag, Globe, Bell, Calendar, Clock, Crown, Feather, Key, Lightbulb, MapPin, Moon, Sun, Umbrella, Tag, Hash, FolderOpen, PenTool, Sparkles, Anchor, Activity, Award, CheckCircle, Crosshair, Diamond, Gem, Gift, Hexagon, Infinity, LifeBuoy, Magnet, Palette, PieChart, Puzzle, Rocket, Target, Trophy, Wand2, Zap, Cloud, CloudRain, Droplet, Flame, Leaf, Wind, Snowflake, Plane, Car, Ship, Mountain, Archive, Backpack, Bird, Bug, Cat, Cookie, Cross, Dog, Dumbbell, Fish, Ghost, Glasses, Hammer, Headphones, Keyboard, Laptop, Mic, Navigation, Palmtree, Paperclip, PawPrint, Pipette, Scissors, Shirt, Smartphone, Sword, Tent, Ticket, Tv, Watch, Trees, Flower, Apple, Mouse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites, useBookmarks, useNotes, useCollections, useSettings } from '@/hooks/useAppStore';
import { useSurahs, useSurahVerses } from '@/hooks/useQuranData';
import { TajweedText } from '@/components/TajweedText';
import { cn, formatVerseRange } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SavedView = 'favorites' | 'bookmarks' | 'notes' | 'collections';

function BookmarkedVerseCard({ surahNumber, verseNumber, onRemove }: { surahNumber: number; verseNumber: number; onRemove: (s: number, v: number) => void }) {
  const { data: surahs } = useSurahs();
  const { data: verses } = useSurahVerses(surahNumber);
  const { settings } = useSettings();
  const surah = surahs?.find(s => s.number === surahNumber);
  const verse = verses?.find(a => a.numberInSurah === verseNumber);
  const navigate = useNavigate();
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  if (!surah || !verse) return null;

  return (
    <div className="relative group">
      <div 
        onClick={() => navigate(`/surah/${surahNumber}?verse=${verseNumber}`)}
        className="surah-card block cursor-pointer pr-12 transition-transform origin-left"
      >
        <div className="mb-2 flex items-center gap-2">
          <BookmarkCheck size={14} className="gold-accent" />
          <span className="text-xs font-medium text-foreground">{surah.name} : {verseNumber}</span>
        </div>
        <p className="arabic-text truncate leading-loose py-1 text-sm text-foreground">
          <TajweedText text={verse.text} showColors={settings.showTajweed} />
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{verse.translation}</p>
      </div>

      <div className="absolute right-3 top-3 z-10">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-2 -mr-2 rounded-lg transition-colors text-muted-foreground outline-none"
            >
              <MoreHorizontal size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-2xl bg-white/95 backdrop-blur-sm dark:bg-black/95 border-border shadow-xl animate-in fade-in-0 zoom-in-95">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setIsRemoveOpen(true);
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-destructive focus:bg-destructive/10 transition-colors outline-none"
            >
              <Trash2 size={16} />
              <span className="font-medium text-[13.5px]">Remove</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
        <AlertDialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] border-none bg-white dark:bg-background shadow-2xl p-6">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-left text-lg font-bold">Remove Bookmark?</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
              Are you sure you want to remove the bookmark for <strong>{surah.name} : {verseNumber}</strong>? It will no longer appear in your saved list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-4">
            <AlertDialogCancel className="h-10 px-6 rounded-full border-border bg-secondary/10 text-foreground text-[13px] font-medium hover:bg-secondary/20 transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { onRemove(surahNumber, verseNumber); setIsRemoveOpen(false); }}
              className="h-10 px-6 rounded-full bg-destructive text-destructive-foreground text-[13px] font-bold hover:bg-destructive/90 transition-all"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const FOLDER_ICONS: Record<string, React.ElementType> = {
  Book, Folder, Bookmark, Star, Heart, FileText, Box, Layers, Briefcase, Coffee, List,
  Camera, Music, Image, Map, Compass, Shield, Flag, Globe, Bell, Calendar, Clock, 
  Crown, Feather, Key, Lightbulb, MapPin, Moon, Sun, Umbrella, Tag, Hash, FolderOpen, 
  PenTool, Sparkles, Anchor, Activity, Award, CheckCircle, Crosshair, Diamond, Gem, 
  Gift, Hexagon, Infinity, LifeBuoy, Magnet, Palette, PieChart, Puzzle, Rocket, 
  Target, Trophy, Wand2, Zap, Cloud, CloudRain, Droplet, Flame, Leaf, Wind, Snowflake, 
  Plane, Car, Ship, Mountain, Archive, Backpack, Bird, Bug, Cat, Cookie, Cross, Dog, 
  Dumbbell, Fish, Ghost, Glasses, Hammer, Headphones, Keyboard, Laptop, Mic, Navigation, 
  Palmtree, Paperclip, PawPrint, Pipette, Scissors, Shirt, Smartphone, Sword, Tent, 
  Ticket, Tv, Watch, Trees, Flower, Apple, Mouse
};

export default function SavedPage() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites();
  const { bookmarks, toggleBookmark } = useBookmarks();
  const { notes, deleteNote } = useNotes();
  const { collections, addCollection, deleteCollection, renameCollection, updateCollectionIcon, addItemToCollection, removeItemFromCollection } = useCollections();
  const { data: surahs } = useSurahs();
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SavedView | null;
  const activeView = tabParam === 'favorites' || tabParam === 'bookmarks' || tabParam === 'notes' || tabParam === 'collections' ? tabParam : 'favorites';

  const setActiveView = (view: SavedView) => {
    setSearchParams({ tab: view }, { replace: true });
  };

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [activeView]);

  const tabs: { id: SavedView; label: string }[] = [
    { id: 'favorites', label: 'Favorite' },
    { id: 'bookmarks', label: 'Bookmark' },
    { id: 'notes', label: 'Notes' },
    { id: 'collections', label: 'Collections' },
  ];

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const idx = tabs.findIndex(t => t.id === activeView);
      if (idx !== -1 && idx < tabs.length - 1) setActiveView(tabs[idx + 1].id);
    },
    onSwipedRight: () => {
      const idx = tabs.findIndex(t => t.id === activeView);
      if (idx > 0) setActiveView(tabs[idx - 1].id);
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 40,
  });

  const [favoriteToRemove, setFavoriteToRemove] = useState<number | null>(null);

  // --- Notes State ---
  const [searchQuery, setSearchQuery] = useState('');
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
    asc: 'Ascending', desc: 'Descending', lastEdited: 'Last Edited', dateAdded: 'Date Added',
  };

  const sortNotes = (list: typeof notes) => {
    return [...list].sort((a, b) => {
      if (sortOrder === 'asc') return a.verseNumber - b.verseNumber;
      if (sortOrder === 'desc') return b.verseNumber - a.verseNumber;
      if (sortOrder === 'lastEdited') return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      if (sortOrder === 'dateAdded') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      return 0;
    });
  };

  const getSurahName = (num: number) => surahs?.find(s => s.number === num)?.name || `Surah ${num}`;
  const getSurahArabic = (num: number) => surahs?.find(s => s.number === num)?.nameArabic || '';

  const filteredAndSortedNotes = (() => {
    let filtered = notes;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = notes.filter(n => {
        const surahName = getSurahName(n.surahNumber).toLowerCase();
        const contentMatch = n.content?.toLowerCase().includes(q) || false;
        return surahName.includes(q) || n.surahNumber.toString().includes(q) || contentMatch;
      });
    }
    return sortNotes(filtered);
  })();

  // --- Collections State ---
  const selectedFolderId = searchParams.get('folder');
  const setSelectedFolderId = (id: string | null) => {
    setSearchParams(prev => {
      if (id) { prev.set('folder', id); } else { prev.delete('folder'); }
      return prev;
    }, { replace: true });
  };

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [isAddVerseOpen, setIsAddVerseOpen] = useState(false);
  const [selectorSurah, setSelectorSurah] = useState<number | ''>('');
  const [selectorVerse, setSelectorVerse] = useState<number | ''>('');
  const [folderToDeleteId, setFolderToDeleteId] = useState<string | null>(null);
  const [verseToRemove, setVerseToRemove] = useState<{ folderId: string, surahNumber: number, verseNumber: number } | null>(null);
  
  // Icon Picker State
  const [editingIconForFolderId, setEditingIconForFolderId] = useState<string | null>(null);
  const [iconPickerFolderId, setIconPickerFolderId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setEditingIconForFolderId(null);
    };
    if (editingIconForFolderId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [editingIconForFolderId]);

  const { data: verses } = useSurahVerses(selectorSurah || 1);
  const selectedFolder = collections.find(c => c.id === selectedFolderId);

  const favoriteSurahs = surahs?.filter(s => favorites.includes(s.number)) || [];

  return (
    <div {...handlers} className="min-h-screen pb-24 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pb-2 pt-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border/60 transform-gpu">
        <div className="flex items-center gap-3 px-4 h-14">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all text-foreground outline-none"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-semibold text-foreground flex-1">
            Saved
          </h1>
        </div>
      </div>

      <div className="px-4 mt-4 mb-2 max-w-lg mx-auto w-full">
        {/* Horizontal scrollable tabs navigation */}
        <div className="scrollbar-hide overflow-x-auto">
          <div className="flex space-x-2 py-2">
            {tabs.map((tab) => {
              const active = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-full border border-border/50 transition-colors whitespace-nowrap",
                    active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 mt-2 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            null
          ) : activeView === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-foreground/70">
                <Star size={14} className="gold-accent" /> Favorite Surahs
              </h2>
              {favoriteSurahs.length === 0 ? (
                <p className="py-20 text-center text-[13px] text-muted-foreground opacity-60">No favorite surahs yet</p>
              ) : (
                <div className="flex flex-col">
                  <AnimatePresence initial={false}>
                    {favoriteSurahs.map((surah) => (
                      <motion.div
                        key={surah.number}
                        layout
                        initial={{ opacity: 0, scale: 0.95, marginBottom: 12 }}
                        animate={{ opacity: 1, scale: 1, height: 'auto', marginBottom: 12 }}
                        exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <Link to={`/surah/${surah.number}`} className="block">
                          <div className="surah-card flex items-center gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full border border-border flex items-center justify-center bg-muted/30">
                              <span className="text-xs font-mono text-muted-foreground tabular-nums">{surah.number}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-display text-sm font-medium truncate">{surah.name}</p>
                              <p className="text-xs text-muted-foreground">{surah.verseCount} verses</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <p className="arabic-text font-arabic text-primary ml-1 mr-2">{surah.nameArabic}</p>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setFavoriteToRemove(surah.number);
                                }}
                                className="p-2 -mr-2 text-primary rounded-full transition-colors outline-none"
                              >
                                <Star size={16} className="fill-primary" />
                              </button>
                            </div>
                          </div>
                          </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {(!loading && activeView === 'bookmarks') && (
            <motion.div
              key="bookmarks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-foreground/70">
                <BookmarkCheck size={14} className="gold-accent" /> Bookmarked Verses
              </h2>
              {bookmarks.length === 0 ? (
                <p className="py-20 text-center text-[13px] text-muted-foreground opacity-60">No bookmarked verses yet</p>
              ) : (
                <div className="flex flex-col">
                  <AnimatePresence initial={false}>
                    {bookmarks.map((bm) => {
                      const vNumber = bm.verseNumber || (bm as unknown as Record<string, number>).ayahNumber;
                      return (
                        <motion.div 
                          layout
                          key={`${bm.surahNumber}-${vNumber}`} 
                          initial={{ opacity: 0, scale: 0.95, marginBottom: 8 }} 
                          animate={{ opacity: 1, scale: 1, height: 'auto', marginBottom: 8 }} 
                          exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }} 
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <BookmarkedVerseCard 
                            surahNumber={bm.surahNumber} 
                            verseNumber={vNumber}
                            onRemove={toggleBookmark}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {!loading && activeView === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground/70">
                  <FileText size={14} className="gold-accent" /> Notes
                </h2>
                
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-9 w-9 flex items-center justify-center rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shadow-sm">
                        <ArrowUpDown size={15} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-2xl bg-white/95 backdrop-blur-sm dark:bg-black/95 border-border shadow-xl">
                      {(['asc', 'desc', 'lastEdited', 'dateAdded'] as SortOrder[]).map(opt => (
                        <DropdownMenuItem
                          key={opt}
                          onClick={() => setSortOrder(opt)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${sortOrder === opt
                            ? 'bg-primary/10 text-primary font-semibold'
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
                    onClick={() => navigate('/note-builder')}
                    className="h-9 pl-3 pr-4 rounded-full bg-primary text-primary-foreground font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all text-xs"
                  >
                    <Plus size={16} />
                    <span>New Note</span>
                  </button>
                </div>
              </div>

              {filteredAndSortedNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <FileText size={32} className="text-primary" />
                  </div>
                  <p className="text-[15px] font-medium text-foreground mb-1">
                    No notes yet
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    Start adding notes for verses.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                  <AnimatePresence>
                    {filteredAndSortedNotes.map(item => {
                      const rawText = item.content ? item.content.replace(/<[^>]+>/g, '') : '';
                      const preview = rawText.length > 120 ? rawText.substring(0, 120) + '...' : rawText;
                      const noteDate = new Date(item.updatedAt || item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                      return (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          key={item.id}
                          onClick={() => navigate(`/note-view?id=${item.id}`)}
                          className="bg-card dark:bg-card/40 border border-border/80 rounded-[1.5rem] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all cursor-pointer flex flex-col group relative"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex flex-col">
                              <span className="font-display text-[16px] font-medium text-foreground flex items-center gap-2">
                                {getSurahName(item.surahNumber)}
                                <span className="font-arabic text-primary/80 text-[18px] leading-none pt-[1px]">{getSurahArabic(item.surahNumber)}</span>
                              </span>
                              <span className="mt-1 text-[13px] font-medium text-muted-foreground/80">
                                Verse {item.verseNumber}
                              </span>
                            </div>
                            <div className="flex items-center" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="w-8 h-8 flex flex-shrink-0 items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-colors outline-none cursor-pointer -mr-2 -mt-1">
                                    <MoreVertical size={18} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl bg-white/95 backdrop-blur-sm dark:bg-black/95 border-border shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/surah/${item.surahNumber}?verse=${item.verseNumber}`);
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2.5 outline-none rounded-xl cursor-pointer transition-colors text-[14px] font-medium"
                                  >
                                    <Eye size={16} /> Show Verse
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/note-builder?id=${item.id}`);
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2.5 outline-none rounded-xl cursor-pointer transition-colors text-[14px] font-medium"
                                  >
                                    <Edit2 size={16} /> Edit Note
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-border/50 my-1 mx-1" />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={e => e.preventDefault()}
                                        className="flex items-center gap-2.5 px-3 py-2.5 outline-none rounded-xl cursor-pointer text-destructive focus:bg-destructive/10 transition-colors text-[14px] font-medium"
                                      >
                                        <Trash2 size={16} /> Delete
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent
                                      className="w-[92vw] max-w-[360px] border-none bg-white dark:bg-background shadow-2xl p-6 rounded-[2rem]"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <AlertDialogHeader className="space-y-2">
                                        <AlertDialogTitle className="text-left text-lg font-bold text-foreground">
                                          Delete Note?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                                          Are you sure you want to delete this note for <strong>Surah {getSurahName(item.surahNumber)} Verse {item.verseNumber}</strong>?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-4">
                                        <AlertDialogCancel className="h-10 px-6 rounded-full border-border bg-secondary/10 text-foreground text-[13px] font-medium hover:bg-secondary/20 transition-all">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteNote(item.id)}
                                          className="h-10 px-6 rounded-full bg-destructive text-destructive-foreground text-[13px] font-bold hover:bg-destructive/90 transition-all"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <p className="text-[14px] text-muted-foreground/90 leading-relaxed line-clamp-3 mb-4">
                            {preview || "No content provided in this note."}
                          </p>
                          
                          <div className="mt-auto pt-4 flex items-center text-[11.5px] font-medium text-muted-foreground/60 tracking-wider border-t border-border/50">
                            <span className="flex items-center gap-1.5"><Clock size={12} className="opacity-70"/> {noteDate}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {!loading && activeView === 'collections' && (
            <motion.div
              key="collections"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <AnimatePresence mode="wait">
                {!selectedFolderId ? (
                  /* FOLDER LIST VIEW */
                  <motion.div 
                    key="folder-list"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground/70">
                        <Folder size={14} className="gold-accent" /> Folders
                      </h2>
                      <button 
                        onClick={() => setIsCreateFolderOpen(true)}
                        className="flex items-center gap-1.5 text-primary text-[13px] font-semibold hover:opacity-80 transition-opacity"
                      >
                        <FolderPlus size={16} />
                        New Folder
                      </button>
                    </div>

                    {collections.length === 0 ? (
                      <div className="bg-muted/10 border border-dashed border-border rounded-2xl py-12 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-4 text-muted-foreground/60">
                          <Book size={20} />
                        </div>
                        <p className="text-sm font-medium text-foreground/70 mb-1">No collections yet</p>
                        <p className="text-[12px] text-muted-foreground max-w-[200px]">Create folders to organize your favorite verses.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {collections.map(folder => (
                          <div 
                            key={folder.id}
                            className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-all group"
                          >
                           <div 
                              onClick={() => setSelectedFolderId(folder.id)}
                              className="flex-1 flex items-center gap-3 cursor-pointer"
                            >
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (editingIconForFolderId === folder.id) {
                                    setIconPickerFolderId(folder.id);
                                    setEditingIconForFolderId(null);
                                  } else {
                                    setEditingIconForFolderId(folder.id);
                                  }
                                }}
                                className="relative w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors shrink-0 cursor-pointer"
                              >
                                {(() => {
                                  const IconComponent = folder.icon && FOLDER_ICONS[folder.icon] ? FOLDER_ICONS[folder.icon] : Book;
                                  return <IconComponent size={20} strokeWidth={1.75} />;
                                })()}
                                
                                {editingIconForFolderId === folder.id && (
                                  <div className="absolute -bottom-1 -right-1 w-[22px] h-[22px] bg-primary text-primary-foreground rounded-full border-2 border-card flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                                    <Edit2 size={11} strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[15px] font-semibold text-foreground">{folder.name}</h4>
                                <p className="text-[12px] text-muted-foreground">{folder.items.length} {folder.items.length === 1 ? 'item' : 'items'}</p>
                              </div>
                            </div>

                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 text-muted-foreground/60 hover:text-foreground transition-colors">
                                  <MoreHorizontal size={18} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 p-1 rounded-xl bg-white border-border shadow-lg">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setEditingFolderId(folder.id);
                                    setEditFolderName(folder.name);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
                                >
                                  <Edit2 size={14} />
                                  <span className="text-sm font-medium">Rename</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border/50" />
                                <DropdownMenuItem 
                                  onClick={() => setFolderToDeleteId(folder.id)}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors outline-none"
                                >
                                  <Trash2 size={14} />
                                  <span className="text-sm font-medium">Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* FOLDER DETAIL VIEW */
                  <motion.div 
                    key="folder-detail"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedFolderId(null)}
                          className="p-1.5 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ArrowLeft size={18} />
                        </button>
                        <h3 className="text-[17px] font-bold text-foreground">{selectedFolder?.name}</h3>
                      </div>
                      <button 
                        onClick={() => setIsAddVerseOpen(true)}
                        className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-[13px] font-bold shadow-sm hover:opacity-90 transition-opacity"
                      >
                        Add Verse
                      </button>
                    </div>

                    {!selectedFolder || selectedFolder.items.length === 0 ? (
                      <div className="bg-muted/10 border border-dashed border-border rounded-2xl py-12 flex flex-col items-center justify-center text-center px-6">
                        <p className="text-sm font-medium text-foreground/70 mb-1">No verses in this folder</p>
                        <p className="text-[12px] text-muted-foreground mb-4">Click 'Add Verse' to start building your collection.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedFolder.items.map(item => {
                          const surah = surahs?.find(s => s.number === item.surahNumber);
                          if (!surah) return null;
                          return (
                            <div 
                              key={`${item.surahNumber}-${item.verseNumber}`}
                              className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between group"
                            >
                              <div 
                                onClick={() => navigate(`/surah/${item.surahNumber}?verse=${item.verseNumber}`)}
                                className="flex-1 flex items-center gap-3 cursor-pointer"
                              >
                                <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-[11px] font-mono text-muted-foreground tabular-nums">
                                  {surah.number}
                                </div>
                                <div>
                                  <h4 className="text-[14px] font-semibold text-foreground">{surah.name}</h4>
                                  <p className="text-[11px] text-muted-foreground">Verse {item.verseNumber}</p>
                                </div>
                              </div>
                              
                              <button 
                                onClick={() => setVerseToRemove({ folderId: selectedFolder.id, surahNumber: item.surahNumber, verseNumber: item.verseNumber })}
                                className="p-2 text-destructive transition-colors"
                                aria-label="Remove from collection"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collections Modals / Drawers */}
              <AnimatePresence>
                {(isCreateFolderOpen || editingFolderId) && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="bg-background w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-border"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-display font-bold text-lg">
                          {editingFolderId ? 'Rename Folder' : 'New Folder'}
                        </h3>
                        <button onClick={() => { setIsCreateFolderOpen(false); setEditingFolderId(null); }} className="text-muted-foreground">
                          <X size={20} />
                        </button>
                      </div>
                      <input 
                        autoFocus
                        type="text"
                        placeholder="Folder name (e.g. Daily Reflections)"
                        value={editingFolderId ? editFolderName : newFolderName}
                        onChange={e => editingFolderId ? setEditFolderName(e.target.value) : setNewFolderName(e.target.value)}
                        className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors mb-6"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            if (editingFolderId) {
                              renameCollection(editingFolderId, editFolderName);
                              setEditingFolderId(null);
                            } else {
                              addCollection(newFolderName);
                              setIsCreateFolderOpen(false);
                              setNewFolderName('');
                            }
                          }
                        }}
                      />
                      <div className="flex gap-3">
                        <button 
                          onClick={() => { setIsCreateFolderOpen(false); setEditingFolderId(null); }}
                          className="flex-1 py-3 rounded-full text-sm font-semibold border border-border shadow-sm active:scale-95 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => {
                            if (editingFolderId) {
                              renameCollection(editingFolderId, editFolderName);
                              setEditingFolderId(null);
                            } else {
                              addCollection(newFolderName);
                              setIsCreateFolderOpen(false);
                              setNewFolderName('');
                            }
                          }}
                          disabled={editingFolderId ? !editFolderName.trim() : !newFolderName.trim()}
                          className="flex-1 py-3 rounded-full text-sm font-semibold bg-primary text-primary-foreground shadow-md active:scale-95 transition-all disabled:opacity-50"
                        >
                          {editingFolderId ? 'Save' : 'Create'}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon Picker Modal */}
              <AnimatePresence>
                {iconPickerFolderId && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6"
                    onClick={() => setIconPickerFolderId(null)}
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      onClick={e => e.stopPropagation()}
                      className="bg-background w-full max-w-[320px] rounded-[2rem] p-6 shadow-2xl border border-border"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-display font-bold text-lg">Select Icon</h3>
                        <button onClick={() => setIconPickerFolderId(null)} className="text-muted-foreground p-1 hover:bg-secondary rounded-full transition-colors">
                          <X size={20} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 max-h-[45vh] overflow-y-auto px-1 -mx-1 pb-2 scrollbar-hide overflow-x-hidden">
                        {Object.entries(FOLDER_ICONS).map(([name, IconComp]) => {
                          const isSelected = collections.find(c => c.id === iconPickerFolderId)?.icon === name || (!collections.find(c => c.id === iconPickerFolderId)?.icon && name === 'Book');
                          return (
                            <button
                              key={name}
                              onClick={() => {
                                updateCollectionIcon(iconPickerFolderId, name);
                                setIconPickerFolderId(null);
                              }}
                              className={cn(
                                "aspect-square rounded-2xl flex items-center justify-center transition-all",
                                isSelected 
                                  ? "bg-primary text-primary-foreground shadow-md scale-105" 
                                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                              )}
                            >
                              <IconComp size={24} />
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Drawer open={isAddVerseOpen} onOpenChange={setIsAddVerseOpen}>
                <DrawerContent className="rounded-t-[2.5rem] bg-background border-none p-6">
                  <div className="max-w-md mx-auto w-full">
                    <DrawerHeader className="px-0 pt-2 mb-6">
                      <DrawerTitle className="text-xl font-display font-bold text-left">Add Verse to {selectedFolder?.name}</DrawerTitle>
                      <DrawerDescription className="text-left">Select a surah and verse to save.</DrawerDescription>
                    </DrawerHeader>
                    <div className="space-y-6 mb-8">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Surah</label>
                        <Select 
                          value={selectorSurah ? selectorSurah.toString() : ''} 
                          onValueChange={(v) => { setSelectorSurah(Number(v)); setSelectorVerse(''); }}
                        >
                          <SelectTrigger className="w-full h-14 rounded-2xl bg-secondary/20 border-border px-4">
                            <SelectValue placeholder="Select Surah" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] rounded-2xl p-2 border-border shadow-2xl">
                            {surahs?.map(s => (
                              <SelectItem key={s.number} value={s.number.toString()} className="rounded-xl py-3 cursor-pointer">
                                <div className="flex justify-between items-center w-64">
                                  <span className="font-semibold">{s.number}. {s.name}</span>
                                  <span className="font-arabic text-primary text-lg">{s.nameArabic}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Verse</label>
                        <Select 
                          disabled={!selectorSurah} 
                          value={selectorVerse ? selectorVerse.toString() : ''} 
                          onValueChange={(v) => setSelectorVerse(Number(v))}
                        >
                          <SelectTrigger className="w-full h-14 rounded-2xl bg-secondary/20 border-border px-4">
                            <SelectValue placeholder="Select Verse" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px] rounded-2xl p-2 border-border shadow-2xl">
                            {verses?.map(v => (
                              <SelectItem key={v.numberInSurah} value={v.numberInSurah.toString()} className="rounded-xl py-3 cursor-pointer">
                                Verse {v.numberInSurah}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DrawerFooter className="px-0 pb-0 flex flex-row gap-3">
                      <DrawerClose asChild>
                        <button className="flex-1 py-4 rounded-full text-[15px] font-bold border border-border shadow-sm active:scale-95 transition-all">
                          Cancel
                        </button>
                      </DrawerClose>
                      <button 
                        onClick={() => {
                          if (selectedFolderId && selectorSurah && selectorVerse) {
                            addItemToCollection(selectedFolderId, Number(selectorSurah), Number(selectorVerse));
                            setIsAddVerseOpen(false);
                            setSelectorSurah('');
                            setSelectorVerse('');
                          }
                        }}
                        disabled={!selectorSurah || !selectorVerse}
                        className="flex-1 py-4 rounded-full text-[15px] font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                      >
                        Add Verse
                      </button>
                    </DrawerFooter>
                  </div>
                </DrawerContent>
              </Drawer>

              <AlertDialog open={!!folderToDeleteId} onOpenChange={(open) => !open && setFolderToDeleteId(null)}>
                <AlertDialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] border-none bg-white dark:bg-background shadow-2xl p-6">
                  <AlertDialogHeader className="space-y-2">
                    <AlertDialogTitle className="text-left text-lg font-bold text-foreground">Delete Folder?</AlertDialogTitle>
                    <AlertDialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                      Are you sure you want to delete this folder? All items inside will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-4">
                    <AlertDialogCancel className="h-10 px-6 rounded-full border-border bg-secondary/10 text-foreground text-[13px] font-medium hover:bg-secondary/20 transition-all">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => { if (folderToDeleteId) { deleteCollection(folderToDeleteId); setFolderToDeleteId(null); } }}
                      className="h-10 px-6 rounded-full bg-destructive text-destructive-foreground text-[13px] font-bold hover:bg-destructive/90 transition-all"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog open={!!verseToRemove} onOpenChange={(open) => !open && setVerseToRemove(null)}>
                <AlertDialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] border-none bg-white dark:bg-background shadow-2xl p-6">
                  <AlertDialogHeader className="space-y-2">
                    <AlertDialogTitle className="text-left text-lg font-bold text-foreground">Remove Verse?</AlertDialogTitle>
                    <AlertDialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                      Are you sure you want to remove this verse from the folder?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-4">
                    <AlertDialogCancel className="h-10 px-6 rounded-full border-border bg-secondary/10 text-foreground text-[13px] font-medium hover:bg-secondary/20 transition-all">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => { if (verseToRemove) { removeItemFromCollection(verseToRemove.folderId, verseToRemove.surahNumber, verseToRemove.verseNumber); setVerseToRemove(null); } }}
                      className="h-10 px-6 rounded-full bg-destructive text-destructive-foreground text-[13px] font-bold hover:bg-destructive/90 transition-all"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

            </motion.div>
          )}

          <AlertDialog open={!!favoriteToRemove} onOpenChange={(open) => !open && setFavoriteToRemove(null)}>
            <AlertDialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] border-none bg-white dark:bg-background shadow-2xl p-6">
              <AlertDialogHeader className="space-y-2">
                <AlertDialogTitle className="text-left text-lg font-bold">Remove Favorite?</AlertDialogTitle>
                <AlertDialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                  Are you sure you want to remove <strong>{surahs?.find(s => s.number === favoriteToRemove)?.name}</strong> from your favorite Surahs?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-4">
                <AlertDialogCancel className="h-10 px-6 rounded-full border-border bg-secondary/10 text-foreground text-[13px] font-medium hover:bg-secondary/20 transition-all">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => { if (favoriteToRemove) toggleFavorite(favoriteToRemove); setFavoriteToRemove(null); }}
                  className="h-10 px-6 rounded-full bg-destructive text-destructive-foreground text-[13px] font-bold hover:bg-destructive/90 transition-all"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </AnimatePresence>
      </div>
    </div>
  );
}
