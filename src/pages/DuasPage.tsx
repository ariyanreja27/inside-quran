import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Quote, Share2, Heart, Copy, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { duas } from '@/data/duas';
import { useState } from 'react';

export default function DuasPage() {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (dua: typeof duas[0]) => {
    const text = `${dua.arabic}\n\n${dua.translation}\n\n— ${dua.reference}`;
    navigator.clipboard.writeText(text);
    setCopiedId(dua.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen pb-24 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[20%] left-0 w-72 h-72 bg-primary/3 rounded-full blur-[100px] -ml-36 pointer-events-none" />
      
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
            Supplications
          </h1>
        </div>
      </div>

      <div className="px-4 pt-8 space-y-8 relative z-10">
        <div className="max-w-[320px] px-1">
          <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-2 italic text-primary/80">Beautiful Duas</h2>
          <p className="text-muted-foreground text-sm leading-relaxed font-body">
            Find peace and guidance through these selected prayers from the Holy Quran.
          </p>
        </div>

        <div className="space-y-6">
          {duas.map((dua, index) => (
            <motion.div
              key={dua.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Quote size={14} fill="currentColor" className="opacity-50" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Prophetic Prayer</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => copyToClipboard(dua)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      {copiedId === dua.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                      <Heart size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-display font-bold text-foreground mb-6 leading-tight">
                  {dua.title}
                </h3>

                <div className="relative mb-8 text-center sm:text-right">
                  <p className="arabic-text text-2xl leading-[2] text-foreground font-medium" style={{ direction: 'rtl' }}>
                    {dua.arabic}
                  </p>
                  <div className="absolute -left-2 top-0 text-primary/5 -z-10">
                    <Quote size={56} fill="currentColor" />
                  </div>
                </div>

                <div className="bg-muted p-5 rounded-xl border border-border/50 mb-6 relative hover:bg-muted/80 transition-colors">
                  <p className="text-[14px] text-muted-foreground leading-relaxed font-body italic text-center sm:text-left">
                    "{dua.translation}"
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-primary/70 bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
                    {dua.reference}
                  </span>
                  <button 
                    onClick={() => navigate(`/surah/${dua.surah}?verse=${dua.verse}`)}
                    className="flex items-center gap-1 text-[12px] font-bold text-primary hover:underline transition-all group/link"
                  >
                    READ CONTEXT 
                    <ChevronRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}


