import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Book, Download } from 'lucide-react';
import { useSurahs } from '@/hooks/useQuranData';
import { useLastRead } from '@/hooks/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';

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
  const { lastRead } = useLastRead();
  
  const tabs = ['last-read', 'downloads'] as const;
  const [activeTab, setActiveTab] = useState<'last-read' | 'downloads'>('last-read');

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
    <motion.div {...handlers} className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md pt-5 pb-4 mb-3 border-b border-border/50 shadow-sm transform-gpu">
        <div className="flex items-center gap-3 px-5 mb-5">
          <button 
            onClick={() => navigate('/')} 
            className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition active:scale-95 shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-display font-semibold text-[22px] text-foreground">Library</h1>
        </div>

        {/* Tabs and Actions Row */}
        <div className="px-5">
          <div className="flex bg-muted/50 rounded-full p-[4px] w-full relative">
            {(['last-read', 'downloads'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex-1 py-1.5 text-[13.5px] font-[500] rounded-full transition-colors tracking-wide z-10 ${
                    isActive 
                      ? 'text-primary-foreground' 
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab-library"
                      className="absolute inset-0 bg-primary rounded-full shadow-sm z-[-1]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {tab === 'last-read' ? 'Last Read' : 'Downloads'}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 max-w-lg mx-auto overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'last-read' && (
            <motion.div
              key="last-read"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-3"
            >
              {lastRead.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
                    <Book size={28} />
                  </div>
                  <h3 className="font-display font-medium text-lg text-foreground mb-1">No reading history</h3>
                  <p className="text-sm text-muted-foreground px-8">
                    Your recently read surahs will appear here. Start reading to build your history.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-6 bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    Go to Home
                  </button>
                </div>
              ) : (
                lastRead.map((item) => {
                  const surah = surahs?.find(s => s.number === item.surahNumber);
                  if (!surah) return null;

                  const timeString = formatRelativeTime(item.timestamp);

                  return (
                    <div
                      key={`${item.surahNumber}-${item.verseNumber}`}
                      onClick={() => navigate(`/surah/${item.surahNumber}?verse=${item.verseNumber}`)}
                      className="flex items-center bg-card border border-border rounded-[1.25rem] p-4 cursor-pointer active:scale-[0.98] hover:bg-secondary/40 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                    >
                      <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
                        <div className="absolute inset-0 bg-primary/10 rounded-xl rotate-45 transform origin-center transition-transform group-hover:rotate-90"></div>
                        <span className="relative z-10 text-primary font-bold text-sm">
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

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Placeholder for 3-dot menu action
                        }}
                        className="p-2 ml-2 -mr-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === 'downloads' && (
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
              <p className="text-[15px] text-muted-foreground max-w-[280px] leading-relaxed">
                 This feature is coming soon. You'll be able to download recitations and translations for offline use.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
