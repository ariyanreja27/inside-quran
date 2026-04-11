import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useAppStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Quote, Heart, Info, ChevronRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Dua {
  id: string;
  title: string;
  arabic: string;
  translation: string;
  reference: string;
  surah?: number;
  verse?: number;
}

export default function DuasPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [duas, setDuas] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/discover/duas.json')
      .then(res => res.json())
      .then(data => {
        setDuas(data);
        setLoading(false);
      })
      .catch(err => console.error('Error loading duas:', err));
  }, []);

  if (loading) return null;

  return (
    <div className="min-h-screen pb-24 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gold/3 blur-[120px] pointer-events-none" />
      
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
            Beautiful Duas
          </h1>
        </div>
      </div>

      <div className="px-4 pt-8 space-y-8 relative z-10">
        <div className="max-w-[320px] px-1">
          <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-2">Spiritual Supplications</h2>
          <p className="text-muted-foreground text-sm leading-relaxed font-body">
            Find solace in selected prophetic and Quranic prayers for every moment of life.
          </p>
        </div>

        <div className="space-y-6">
          {duas.map((dua, index) => (
            <motion.div
              key={dua.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20 group-hover:scale-105 transition-all duration-300">
                    <Star size={20} fill="currentColor" className="opacity-40" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-display font-bold text-foreground leading-tight">
                      {dua.title}
                    </h2>
                    <p className="text-[10px] font-bold text-gold/80 uppercase tracking-widest mt-1">
                      {dua.reference}
                    </p>
                  </div>
                </div>

                <div className="mb-8">
                   <p 
                      className="text-right text-2xl text-foreground leading-[1.8] mb-6" 
                      dir="rtl"
                      style={{ fontFamily: settings.arabicFont }}
                   >
                      {dua.arabic}
                   </p>
                   <div className="relative">
                      <div className="absolute left-0 top-0 w-1 h-full bg-gold/20 rounded-full" />
                      <div className="pl-6">
                        <p className="text-[14px] text-muted-foreground leading-relaxed font-body italic">
                           "{dua.translation}"
                        </p>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    <button className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-gold/10 hover:text-gold transition-colors">
                      <Heart size={16} />
                    </button>
                    <button className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-gold/10 hover:text-gold transition-colors">
                      <Info size={16} />
                    </button>
                  </div>
                  
                  {dua.surah && (
                    <button 
                      onClick={() => navigate(`/surah/${dua.surah}?verse=${dua.verse}`)}
                      className="flex items-center gap-2 text-[12px] font-bold text-gold hover:underline transition-all group/link bg-gold/5 px-4 py-2 rounded-xl border border-gold/10"
                    >
                      READ CONTEXT
                      <ChevronRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}


