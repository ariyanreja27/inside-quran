import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useAppStore';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Compass, BookOpen, Quote, History, 
  Sparkles, ChevronRight, Zap, Heart, Star, 
  Search, Bookmark, Share2, MessageCircle
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

interface Dua {
  id: string;
  title: string;
  arabic: string;
  translation: string;
  reference: string;
}

interface ShaneNuzul {
  id: string;
  surah: number;
  verse: number;
  title: string;
  context: string;
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [duas, setDuas] = useState<Dua[]>([]);
  const [shaneNuzul, setShaneNuzul] = useState<ShaneNuzul[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsRes, duasRes, snRes] = await Promise.all([
          fetch('/data/discover/topics.json'),
          fetch('/data/discover/duas.json'),
          fetch('/data/discover/shane-nuzul.json')
        ]);
        
        const topicsData = await topicsRes.json();
        const duasData = await duasRes.json();
        const snData = await snRes.json();
        
        setTopics(topicsData);
        setDuas(duasData.slice(0, 5)); // Just preview top 5
        setShaneNuzul(snData.slice(0, 3)); // Just preview top 3
      } catch (error) {
        console.error('Error loading discover data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl pb-2 pt-1 border-b border-border/40 transform-gpu">
        <div className="flex items-center gap-3 px-4 h-14">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all text-foreground/80 hover:text-primary hover:bg-primary/5 outline-none"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1">
             <h1 className="font-display text-lg font-bold text-foreground">Discover</h1>
             <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Quranic Wisdom</p>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/60">
            <Search size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-8 relative z-10">
        
        {/* Hero: Verse of the Day */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-primary/90 to-primary/70 rounded-[2rem] p-6 text-white overflow-hidden shadow-xl shadow-primary/20"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BookOpen size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">Verse of the Day</span>
              <div className="h-px flex-1 bg-white/20" />
            </div>
            <p className="text-lg font-display font-medium leading-relaxed mb-4 italic">
              "And seek help through patience and prayer; and indeed, it is difficult except for the humbly submissive [to Allah]."
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold opacity-80">Surah Al-Baqarah 2:45</span>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Bookmark size={14} />
                </button>
                <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Share2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Categories / Themes: Horizontal Scroll */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-display font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-primary" />
              Thematic Guide
            </h2>
            <button 
              onClick={() => navigate('/explore/topics')}
              className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider"
            >
              View All
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar -mx-4 px-4 pt-2">
            {topics.map((topic, i) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate('/explore/topics')}
                className="min-w-[150px] h-[180px] relative rounded-[2.2rem] overflow-hidden cursor-pointer group shadow-xl hover:-translate-y-1.5 transition-all duration-700"
              >
                {/* Full-Bleed Background Image */}
                <div className="absolute inset-0">
                  <img 
                    src={topic.image} 
                    alt={topic.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                  />
                  {/* Cinematic Gradient Mask (Enhanced Contrast) */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>

                {/* Content Overlay Content (Bottom Aligned) */}
                <div className="absolute inset-x-0 bottom-0 p-5 z-10 text-left">
                  <div className="min-h-[38px] flex flex-col justify-end mb-1">
                    <h3 className="text-[14px] font-display font-bold text-gold capitalize tracking-tight leading-[1.2] drop-shadow-md">
                      {topic.title}
                    </h3>
                  </div>
                  <p className="text-[9.5px] text-white/80 line-clamp-2 leading-relaxed font-body opacity-90">
                    {topic.description}
                  </p>
                </div>

                {/* Aesthetic Corner Glow */}
                <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/20 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Featured Duas: Dynamic Grid */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-display font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <Heart size={14} className="text-primary" />
              Dua Sanctuary
            </h2>
            <button 
              onClick={() => navigate('/explore/duas')}
              className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider"
            >
              More Duas
            </button>
          </div>
          <div className="grid gap-3">
            {duas.map((dua, i) => (
              <motion.div
                key={dua.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-2xl p-4 group hover:bg-card transition-colors"
                onClick={() => navigate('/explore/duas')}
              >
                <div className="flex items-start justify-between mb-2">
                   <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{dua.title}</h3>
                   <div className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase">{dua.reference.split(' ')[0]}</div>
                </div>
                <p 
                  className="text-right text-lg text-primary mb-2 line-clamp-1" 
                  dir="rtl"
                  style={{ fontFamily: settings.arabicFont }}
                >
                  {dua.arabic}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-2 italic">"{dua.translation}"</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Shane Nuzul: Insights Feed */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-display font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <History size={14} className="text-primary" />
              Historical Insights
            </h2>
            <button 
              onClick={() => navigate('/explore/shane-nuzul')}
              className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider"
            >
              Explore Context
            </button>
          </div>
          <div className="space-y-4">
            {shaneNuzul.map((sn, i) => (
              <motion.div
                key={sn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="relative pl-6 border-l-2 border-primary/20 hover:border-primary transition-colors cursor-pointer"
                onClick={() => navigate('/explore/shane-nuzul')}
              >
                <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-primary" />
                <div className="mb-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Surah {sn.surah}:{sn.verse}</span>
                  <h3 className="text-xs font-bold text-foreground leading-tight mt-0.5">{sn.title}</h3>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{sn.context}</p>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}



