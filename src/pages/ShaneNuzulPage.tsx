import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Landmark, ChevronRight, 
  History, Info, Sparkles, BookOpen, Clock, 
  Quote, Calendar, MapPin, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/hooks/useAppStore';
import { getApiUrl } from '@/utils/api';

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
  const { settings } = useSettings();
  const [data, setData] = useState<ShaneNuzul[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/discover/shane-nuzul`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => console.error('Error loading shane nuzul:', err));
  }, []);

  const filteredData = data.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.context.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.surah.toString().includes(searchQuery);
    const matchesSurah = selectedSurah ? item.surah === selectedSurah : true;
    return matchesSearch && matchesSurah;
  });

  // Get unique surahs for filter
  const uniqueSurahs = Array.from(new Set(data.map(item => item.surah))).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background relative overflow-x-hidden">
      {/* Cinematic Hero Section */}
      <section className="relative h-[65vh] w-full overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img 
            src="/images/discover/shane-nuzul-hero.png" 
            alt="Historical Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-background" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        </motion.div>

        {/* Floating Header */}
        <div className="absolute top-0 inset-x-0 z-50">
           <div className="flex items-center gap-3 px-4 h-20">
            <button 
              onClick={() => navigate('/explore')} 
              className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 transition-all outline-none"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
               <h1 className="font-display text-xl font-bold text-white drop-shadow-lg">
                Context of Revelation
               </h1>
               <p className="text-[10px] text-white/70 font-bold uppercase tracking-[0.2em] drop-shadow-md">Historical Insights</p>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute inset-x-0 bottom-16 px-6 z-10 text-left">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.5, duration: 0.8 }}
           >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-[2px] bg-primary" />
                <span className="text-primary font-bold text-[11px] uppercase tracking-widest">Asbab al-Nuzul</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-[1.1] mb-4">
                The Echoes <br /> 
                <span className="text-gold">of Revelation</span>
              </h2>
              <p className="text-muted-foreground max-w-sm text-sm leading-relaxed font-body text-balance">
                Immerse yourself in the historical context and divine reasons behind the revelation of various verses.
              </p>
           </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="px-4 -mt-8 relative z-20 space-y-10">
        
        {/* Search & Filter Bar */}
        <div className="sticky top-4 z-40">
           <div className="bg-card/80 backdrop-blur-2xl border border-border/60 rounded-[2rem] p-3 shadow-2xl shadow-black/10 flex flex-col gap-3">
              <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="Search by Surah or Historical Event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-10 bg-muted/30 border border-transparent focus:border-primary/20 rounded-2xl outline-none transition-all text-[15px] font-body"
                />
                {searchQuery && (
                   <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                   >
                    <X size={16} />
                   </button>
                )}
              </div>
              
              {/* Quick Filters */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
                 <button 
                  onClick={() => setSelectedSurah(null)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${!selectedSurah ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted'}`}
                 >
                   All Chronologies
                 </button>
                 {uniqueSurahs.slice(0, 10).map(s => (
                   <button 
                    key={s}
                    onClick={() => setSelectedSurah(s)}
                    className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${selectedSurah === s ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted'}`}
                   >
                     Surah {s}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Insights Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <History size={14} className="text-primary" />
              Found {filteredData.length} Insights
            </h3>
          </div>

          <AnimatePresence mode="popLayout">
            <div className="grid gap-6">
              {filteredData.map((context, index) => (
                <motion.div
                  key={context.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  className="group relative bg-card/40 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden hover:bg-card transition-all duration-500 shadow-xl shadow-black/[0.02] hover:shadow-primary/5 hover:border-primary/20"
                >
                  <div className="p-8">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                          <Landmark size={24} />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Contextual Origin</span>
                              <div className="h-px w-8 bg-primary/20" />
                           </div>
                           <h2 className="text-xl font-display font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                            {context.title}
                           </h2>
                        </div>
                      </div>
                      
                      <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 flex flex-col items-end">
                         <span className="text-[10px] font-bold text-primary/60 uppercase tracking-tighter">Reference</span>
                         <span className="text-[14px] font-bold text-foreground tracking-tight">{context.surah}:{context.verse}</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="relative mb-8">
                       <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary/40 to-transparent rounded-full" />
                       <div className="pl-6 pt-1">
                         <p 
                            className="text-[19px] leading-[2.2] font-arabic text-right mb-4 text-foreground/90 selection:bg-primary/20" 
                            dir="rtl"
                            style={{ 
                              fontFamily: settings.arabicFont === 'Amiri' ? 'Amiri, serif' : 'Noorehuda, serif',
                              wordSpacing: '0.1em'
                            }}
                         >
                            {context.context}
                         </p>
                       </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-border/40">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center">
                            <Quote size={10} className="text-muted-foreground" />
                         </div>
                         <span className="text-[11px] font-bold text-muted-foreground/60 tracking-wide uppercase italic text-pretty">
                           Source: {context.source}
                         </span>
                      </div>

                      <button 
                        onClick={() => {
                          if (context.surah && context.verse) {
                            navigate(`/surah/${context.surah}?verse=${context.verse}`);
                          }
                        }}
                        className="flex items-center gap-2.5 px-6 py-3.5 bg-primary text-white rounded-[1.2rem] text-[12px] font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 group/btn"
                      >
                        VIEW REVELATION 
                        <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Decorative Subtle Background Pattern */}
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none transition-opacity group-hover:opacity-[0.05]">
                     <History size={120} />
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {filteredData.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center"
            >
              <div className="w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-medium">No results for "{searchQuery}"</p>
              <button 
                onClick={() => {setSearchQuery(''); setSelectedSurah(null);}}
                className="mt-4 text-sm font-bold text-primary hover:underline"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
