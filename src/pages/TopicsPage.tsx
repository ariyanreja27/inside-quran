import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useAppStore';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, ChevronRight, X, Search 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Topic {
  id: string;
  title: string;
  description: string;
  image: string;
  verses: {
    surah: number;
    verse: number;
    title?: string;
  }[];
}

export default function TopicsPage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTopics = topics.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAmiri = settings.arabicFont === 'Amiri';

  useEffect(() => {
    fetch('/data/discover/topics.json')
      .then(res => res.json())
      .then(data => {
        setTopics(data);
        setLoading(false);
      })
      .catch(err => console.error('Error loading topics:', err));
  }, []);


  if (loading) return null;

  return (
    <div className={`min-h-screen bg-background font-body ${isAmiri ? 'font-amiri' : 'font-noorehuda'}`}>
      <div className="max-w-md mx-auto relative pb-24">
        {/* Unified Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl pb-2 pt-1 border-b border-border/40 transform-gpu">
          <div className="flex items-center gap-3 px-4 h-14">
            <button 
              onClick={() => navigate('/explore')}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all text-foreground/80 hover:text-primary hover:bg-primary/5 outline-none"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="flex-1">
               <h1 className="font-display text-lg font-bold text-foreground">Thematic Topics</h1>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-6 pt-8">
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Explore by Theme</h2>
            <p className="text-muted-foreground leading-relaxed">
              Discover guidance and wisdom organized by core subject.
            </p>
          </div>

          <div className="mb-8 relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={18} className="text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search topics by name or theme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border/60 hover:border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-4 pl-12 pr-12 text-[15px] transition-all outline-none text-foreground placeholder:text-muted-foreground/60 shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {filteredTopics.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <p className="text-muted-foreground mb-2">No topics found matching "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[13px] font-bold text-primary hover:underline"
              >
                Clear Search
              </button>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredTopics.map((topic, index) => (
                <motion.div
                  key={topic.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setSelectedTopic(topic)}
                  className="group relative flex items-center p-3 rounded-2xl bg-card border border-border/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden"
                >
                  {/* Cinematic Inset Image (Left) */}
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                    <img 
                      src={topic.image} 
                      alt={topic.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  </div>

                  {/* Content (Right Side) */}
                  <div className="flex-1 ml-4 pr-2">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-[15.5px] font-display font-bold text-gold capitalize leading-tight group-hover:text-primary transition-colors">
                        {topic.title}
                      </h2>
                      <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-body line-clamp-2">
                      {topic.description}
                    </p>
                    
                    {/* Insights Mini Badge */}
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-primary/40" />
                      <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                        {topic.verses.length} Insights
                      </span>
                    </div>
                  </div>

                  {/* Interactive Glow Decor */}
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
        </div>
      </div>

      {/* Topic Detail Drawer */}
      <AnimatePresence>
        {selectedTopic && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTopic(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 max-h-[92vh] bg-card rounded-t-[3.5rem] shadow-[0_-30px_60px_rgba(0,0,0,0.5)] z-[101] overflow-hidden flex flex-col"
            >
              {/* Handle */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-[120]" />
              
              <div className="overflow-y-auto no-scrollbar flex-1 pb-10">
                {/* Cinematic Hero Header */}
                <div className="relative h-80 w-full overflow-hidden">
                  <motion.img 
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    src={selectedTopic.image} 
                    alt={selectedTopic.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Layered Masking */}
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-card via-card/60 to-transparent" />
                  <div className="absolute inset-0 bg-black/10" />
                  
                  <button 
                    onClick={() => setSelectedTopic(null)}
                    className="absolute top-8 right-8 w-12 h-12 rounded-full bg-black/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-xl"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Content Container (Layered Overlap) */}
                <div className="px-6 -mt-10 relative z-10">
                  <div className="bg-card rounded-t-[2.5rem] pt-8 p-6">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2 tracking-tight">
                      {selectedTopic.title}
                    </h2>
                    
                    <p className="text-[14.5px] text-muted-foreground leading-relaxed font-body mb-10">
                      {selectedTopic.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-[1px] flex-1 bg-border/60" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] px-2">Key Verses</span>
                        <div className="h-[1px] flex-1 bg-border/60" />
                      </div>
                      
                      {selectedTopic.verses.map((v, idx) => (
                        <button
                          key={idx}
                          onClick={() => navigate(`/surah/${v.surah}?verse=${v.verse}`)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/20 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group/verse text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border/60 group-hover/verse:border-primary/30 transition-all shadow-sm">
                              <BookOpen size={14} className="text-muted-foreground group-hover/verse:text-primary" />
                            </div>
                            <span className="text-[13.5px] font-semibold text-foreground/90 group-hover/verse:text-foreground">
                              {v.title || `Verse ${v.surah}:${v.verse}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10.5px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 transition-colors">
                               {v.surah}:{v.verse}
                             </span>
                             <ChevronRight size={14} className="text-muted-foreground/30 group-hover/verse:text-primary group-hover/verse:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Subtle Base Glow */}
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
