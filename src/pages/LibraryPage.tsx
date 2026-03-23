import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Book, FolderPlus, Trash2, ChevronRight, Plus, X, Search, Bookmark, Edit2 } from 'lucide-react';
import { useSurahs, useSurahVerses } from '@/hooks/useQuranData';
import { useLastRead, useCollections } from '@/hooks/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { useEffect, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function formatRelativeTime(timestamp: string): string {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffHours < 1) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hr ago`;
  } else if (diffDays >= 1 && diffDays < 2) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

export default function LibraryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: surahs } = useSurahs();
  const { lastRead, removeLastRead } = useLastRead();
  const {
    collections,
    addCollection,
    deleteCollection,
    renameCollection,
    addItemToCollection,
    removeItemFromCollection
  } = useCollections();

  const tabs = ['last-read', 'collections'] as const;

  // URL-driven state
  const activeTab = (searchParams.get('tab') as 'last-read' | 'collections') || 'last-read';
  const selectedFolderId = searchParams.get('folder');

  const [loading, setLoading] = useState(true);

  const setActiveTab = (tab: 'last-read' | 'collections') => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      prev.delete('folder'); // Clear folder when switching tabs
      return prev;
    });
  };

  const setSelectedFolderId = (id: string | null) => {
    setSearchParams(prev => {
      if (id) {
        prev.set('folder', id);
        prev.set('tab', 'collections');
      } else {
        prev.delete('folder');
      }
      return prev;
    });
  };

  // Collections logic
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  // Verse Selector logic
  const [isAddVerseOpen, setIsAddVerseOpen] = useState(false);
  const [selectorSurah, setSelectorSurah] = useState<number | ''>('');
  const [selectorVerse, setSelectorVerse] = useState<number | ''>('');
  
  const { data: verses } = useSurahVerses(selectorSurah || 1);
  const selectedFolder = collections.find(c => c.id === selectedFolderId);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const idx = tabs.indexOf(activeTab);
      if (idx !== -1 && idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
    },
    onSwipedRight: () => {
      const idx = tabs.indexOf(activeTab);
      if (idx > 0) setActiveTab(tabs[idx - 1]);
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 40,
  });

  return (
    <motion.div {...handlers} className="min-h-screen pb-24 flex flex-col">
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
            Library
          </h1>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-lg mx-auto w-full">
        <div className="mb-5 rounded-full border border-border bg-secondary/40 p-1 backdrop-blur-sm relative">
          <div className="grid grid-cols-2 gap-1 relative">
            {(['last-read', 'collections'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedFolderId(null);
                  }}
                  className={`relative rounded-full px-4 py-2.5 text-xs font-semibold transition-colors z-10 ${
                    isActive 
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground'
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="libraryTabIndicator"
                      className="absolute inset-0 bg-primary rounded-full shadow-sm z-[-1]"
                      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    />
                  )}
                  {tab === 'last-read' ? 'Last Read' : 'Collections'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            {loading ? (
              null
            ) : activeTab === 'last-read' && (
              <motion.div
                key="last-read"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className=""
              >
                {lastRead.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
                      <Book size={28} />
                    </div>
                    <h3 className="font-display font-medium text-lg text-foreground mb-1">No reading history</h3>
                    <p className="text-sm text-muted-foreground px-8 text-muted-foreground/80">
                      Your recently read surahs will appear here. Start reading to build your history.
                    </p>
                    <button
                      onClick={() => navigate('/')}
                      className="mt-6 bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer"
                    >
                      Go to Home
                    </button>
                  </div>
                ) : (
                <div className="flex flex-col">
                    <AnimatePresence initial={false}>
                      {lastRead.map((item) => {
                        const surah = surahs?.find(s => s.number === item.surahNumber);
                        if (!surah) return null;

                        const timeString = formatRelativeTime(item.timestamp);

                        return (
                          <motion.div
                            layout
                          initial={{ opacity: 0, scale: 0.95, marginBottom: 12 }}
                          animate={{ opacity: 1, scale: 1, height: 'auto', marginBottom: 12 }}
                          exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.2 }}
                            key={`${item.surahNumber}-${item.verseNumber}`}
                          className="overflow-hidden"
                          >
                          <div className="flex items-stretch bg-card border border-border rounded-[1.25rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all">
                            <div
                              onClick={() => navigate(`/surah/${item.surahNumber}?verse=${item.verseNumber}`)}
                              className="flex-1 flex items-center p-4 cursor-pointer transition-transform origin-left rounded-[1.25rem] group"
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-full border border-border flex items-center justify-center bg-muted/30 transition-transform">
                                <span className="text-xs font-mono text-muted-foreground tabular-nums">
                                  {surah.number}
                                </span>
                              </div>

                              <div className="ml-4 flex-1">
                                <h3 className="font-display font-semibold text-[16px] text-foreground mb-0.5">
                                  {surah.name}
                                </h3>
                                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                                  <span className="font-medium">Verse {item.verseNumber}</span>
                                  <span className="w-1 h-1 rounded-full bg-border"></span>
                                  <span>{timeString}</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end shrink-0 pl-2">
                                <p className="arabic-text text-xl text-primary mb-1">
                                  {surah.nameArabic}
                                </p>
                              </div>
                            </div>

                            <div className="pr-4 py-4 flex items-center justify-center">
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="p-2 -mr-2 rounded-lg transition-colors text-muted-foreground outline-none"
                                  >
                                    <MoreHorizontal size={20} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-2xl bg-white/95 backdrop-blur-sm dark:bg-black/95 border-border shadow-xl animate-in fade-in-0 zoom-in-95">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeLastRead(item.surahNumber);
                                    }}
                                     className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-destructive bg-destructive/10 transition-colors outline-none"
                                  >
                                    <Trash2 size={16} />
                                    <span className="font-medium text-[13.5px]">Clear History</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {!loading && activeTab === 'collections' && (
              <motion.div
                key="collections"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full"
              >
                <AnimatePresence mode="wait">
                  {!selectedFolderId ? (
                    /* FOLDER LIST VIEW */
                    <motion.div 
                      key="folder-list"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-semibold text-foreground/80">Folders</h3>
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
                          <p className="text-[12px] text-muted-foreground max-w-[200px]">Create folders to organize your favorite verses and reflections.</p>
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
                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                  <Book size={18} />
                                </div>
                                <div>
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
                                    onClick={() => deleteCollection(folder.id)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-destructive focus:bg-destructive/5"
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
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
                                  onClick={() => removeItemFromCollection(selectedFolder.id, item.surahNumber, item.verseNumber)}
                                  className="p-2 text-muted-foreground/40 hover:text-destructive transition-colors"
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MODALS / DRAWERS */}
        
        {/* Create/Rename Folder Modal (using simple conditional rendering for speed/consistency) */}
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

        {/* Add Verse Selector Modal */}
        <Drawer open={isAddVerseOpen} onOpenChange={setIsAddVerseOpen}>
          <DrawerContent className="rounded-t-[2.5rem] bg-background border-none p-6">
            <div className="max-w-md mx-auto w-full">
              <DrawerHeader className="px-0 pt-2 mb-6">
                <DrawerTitle className="text-xl font-display font-bold text-left">Add Verse to {selectedFolder?.name}</DrawerTitle>
                <DrawerDescription className="text-left">Select a surah and verse to save to this collection.</DrawerDescription>
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
      </div>
    </motion.div>
  );
}
