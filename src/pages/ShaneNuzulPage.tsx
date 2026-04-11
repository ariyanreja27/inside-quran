import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, History, Info, ChevronRight, Landmark, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShaneNuzul {
  id: string;
  surah: number;
  verse: number;
  title: string;
  context: string;
  source: string;
}

export default function ShaneNuzulPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ShaneNuzul[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/discover/shane-nuzul.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => console.error('Error loading shane nuzul:', err));
  }, []);

  const filteredData = data.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.context.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.surah.toString().includes(searchQuery)
  );

  if (loading) return null;

  return (
    <div className="min-h-screen pb-24 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-primary/3 blur-[100px] pointer-events-none" />
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pb-2 pt-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border/60 transform-gpu">
        <div className="flex items-center gap-3 px-4 h-14">
          <button 
            onClick={() => navigate('/explore')} 
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all text-foreground outline-none"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-semibold text-foreground pt-0.5 flex-1">
            Context of Revelation
          </h1>
        </div>
      </div>

      <div className="px-4 pt-8 space-y-8 relative z-10">
        <div className="px-1">
          <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-2">Historical Insights</h2>
          <p className="text-muted-foreground text-sm leading-relaxed font-body mb-6">
            Understand the events and reasons behind the revelation of various Surahs and verses.
          </p>

          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search by Surah or Event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-muted/50 border border-border rounded-2xl outline-none focus:border-primary/50 focus:bg-background transition-all"
            />
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredData.map((context, index) => (
              <motion.div
                key={context.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-105 transition-all duration-300">
                      <Landmark size={20} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-display font-bold text-foreground leading-tight">
                        {context.title}
                      </h2>
                      <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        Surah {context.surah}, Verse {context.verse}
                      </p>
                    </div>
                  </div>

                  <div className="relative mb-6">
                     <div className="absolute left-0 top-0 w-1 h-full bg-primary/20 rounded-full" />
                     <div className="pl-6 pt-1">
                       <p 
                        className="text-[17px] text-foreground/90 leading-relaxed font-arabic text-right pb-4" 
                        dir="rtl"
                        style={{ fontFamily: 'Amiri, traditional arabic, serif' }}
                       >
                          {context.context}
                       </p>
                     </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-medium text-muted-foreground italic">Source: {context.source}</span>
                    <button 
                      onClick={() => {
                        if (context.surah && context.verse) {
                          navigate(`/surah/${context.surah}?verse=${context.verse}`);
                        }
                      }}
                      className="flex items-center gap-1 text-[12px] font-bold text-primary hover:underline transition-all group/link bg-primary/5 px-4 py-2 rounded-xl border border-primary/10"
                    >
                      VIEW REVELATION 
                      <ChevronRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredData.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">No historical insights found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


