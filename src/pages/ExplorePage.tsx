import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, BookOpen, Quote, History, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ExplorePage() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Thematic Topics',
      description: 'Explore the Quran through core themes like Faith, Ethics, and Patience.',
      icon: <Sparkles className="text-primary" size={24} />,
      path: '/explore/topics',
      gradient: 'from-primary/10 to-primary/5',
      borderColor: 'group-hover:border-primary/30'
    },
    {
      title: 'Beautiful Duas',
      description: 'Find solace in selected prophetic and Quranic supplications.',
      icon: <Quote className="text-gold" size={24} />,
      path: '/explore/duas',
      gradient: 'from-gold/10 to-gold/5',
      borderColor: 'group-hover:border-gold/30'
    },
    {
      title: 'Shane Nuzul',
      description: 'Discover the historical background and reasons for revelation.',
      icon: <History className="text-primary" size={24} />,
      path: '/explore/shane-nuzul',
      gradient: 'from-primary/10 to-primary/5',
      borderColor: 'group-hover:border-primary/30'
    }
  ];

  return (
    <div className="min-h-screen pb-24 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-primary/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Header - EXACT MATCH to SurahListPage */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pb-2 pt-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border/60 transform-gpu">
        <div className="flex items-center gap-3 px-4 h-14">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all text-foreground outline-none"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-semibold text-foreground pt-0.5 flex-1">
            Explore
          </h1>
        </div>
      </div>

      <div className="px-4 pt-8 relative z-10">
        <div className="mb-10 px-1">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 border border-primary/20"
          >
            <Compass size={24} className="text-primary" />
          </motion.div>
          <motion.h2 
            initial={{ opacity:0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-display font-bold text-foreground leading-tight"
          >
            Discover the <span className="text-primary italic">Quran</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity:0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-2 max-w-[300px] text-sm font-body"
          >
            Navigate through meanings, prayers, and history in a beautiful way.
          </motion.p>
        </div>

        <div className="space-y-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              onClick={() => navigate(feature.path)}
              className={`group relative bg-card rounded-2xl border border-border p-5 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-lg ${feature.borderColor}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-base font-display font-bold text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-snug pr-2">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}



