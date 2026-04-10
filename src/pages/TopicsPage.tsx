import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Quote, Sparkles, Timer, Users, CloudSun, ChevronRight, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { topics } from '@/data/topics';

const iconMap: Record<string, LucideIcon> = {
  Sparkles: Sparkles,
  Timer: Timer,
  Users: Users,
  CloudSun: CloudSun,
};

export default function TopicsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/3 rounded-full blur-3xl -mr-32 -mt-32" />
      
      {/* Header - EXACT MATCH to SurahListPage */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pb-2 pt-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border/60 transform-gpu">
        <div className="flex items-center gap-3 px-4 h-14">
          <button 
            onClick={() => navigate('/explore')} 
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all text-foreground outline-none"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-semibold text-foreground pt-0.5 flex-1">
            Thematic Topics
          </h1>
        </div>
      </div>

      <div className="px-4 pt-8 space-y-8 relative z-10">
        <div className="max-w-[320px] px-1">
          <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-2">Explore by Theme</h2>
          <p className="text-muted-foreground text-sm leading-relaxed font-body">
            Discover guidance and wisdom organized by core Quranic subjects.
          </p>
        </div>

        <div className="grid gap-5">
          {topics.map((topic, index) => {
            const IconComponent = iconMap[topic.iconName] || BookOpen;
            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-105 transition-transform duration-300">
                      <IconComponent size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-display font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {topic.title}
                      </h2>
                      <p className="text-[13.5px] text-muted-foreground leading-snug font-body">
                        {topic.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-[1px] flex-1 bg-border/60" />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Key Verses</span>
                      <div className="h-[1px] flex-1 bg-border/60" />
                    </div>
                    
                    {topic.verses.map((v, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigate(`/surah/${v.surah}?verse=${v.verse}`)}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-muted/30 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group/verse"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center border border-border/60 group-hover/verse:border-primary/30 transition-all">
                            <BookOpen size={13} className="text-muted-foreground group-hover/verse:text-primary" />
                          </div>
                          <span className="text-[13.5px] font-medium text-foreground/80 group-hover/verse:text-foreground">
                            {v.title || `Verse ${v.surah}:${v.verse}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-md group-hover/verse:bg-primary/10 group-hover/verse:text-primary transition-colors">
                            {v.surah}:{v.verse}
                          </span>
                          <ChevronRight size={14} className="text-muted-foreground/40 group-hover/verse:text-primary group-hover/verse:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


