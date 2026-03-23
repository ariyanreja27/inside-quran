import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Book, Download, Trash2 } from 'lucide-react';
import { useSurahs } from '@/hooks/useQuranData';
import { useLastRead } from '@/hooks/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { data: surahs } = useSurahs();
  const { lastRead, removeLastRead } = useLastRead();

  const tabs = ['last-read', 'downloads'] as const;
  const [activeTab, setActiveTab] = useState<'last-read' | 'downloads'>('last-read');
  const [loading, setLoading] = useState(true);

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
            {(['last-read', 'downloads'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
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
                  {tab === 'last-read' ? 'Last Read' : 'Downloads'}
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

            {!loading && activeTab === 'downloads' && (
              <motion.div
                key="downloads"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="py-16 flex flex-col items-center justify-center text-center space-y-5"
              >
                <div className="w-20 h-20 bg-muted/50 text-primary rounded-full flex items-center justify-center mb-2">
                  <Download size={36} />
                </div>
                <h3 className="font-display font-medium text-xl text-foreground">Downloads</h3>
                <p className="text-[15px] text-muted-foreground max-w-[280px] leading-relaxed opacity-70">
                  This feature is coming soon. You'll be able to download recitations and translations for offline use.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}
