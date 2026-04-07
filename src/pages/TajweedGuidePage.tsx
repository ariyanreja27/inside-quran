import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Palette, BookType, Volume2, History, Ear, Type } from 'lucide-react';
import { motion } from 'framer-motion';

const tajweedRules = [
  {
    category: 'Ghunnah & Ikhfa',
    icon: <Ear size={18} className="text-emerald-600" />,
    rules: [
      { name: 'Ghunnah', arabic: 'غنة', color: '#FF7E1E', desc: 'Nasal sound (2 vowels duration).' },
      { name: 'Ikhfa', arabic: 'إخفاء', color: '#9400A8', desc: 'Hiding the sound with a slight nasal tone.' },
      { name: 'Ikhfa Shafawi', arabic: 'إخفاء شفوي', color: '#D500B7', desc: 'Hiding Meem with a nasal tone.' },
    ]
  },
  {
    category: 'Idgham (Merging)',
    icon: <History size={18} className="text-emerald-600" />,
    rules: [
      { name: 'Idgham with Ghunnah', arabic: 'إدغام بغنة', color: '#169777', desc: 'Merging with a nasal sound.' },
      { name: 'Idgham w/o Ghunnah', arabic: 'إدغام بغير غنة', color: '#169200', desc: 'Light merging without nasal sound.' },
      { name: 'Idgham Shafawi', arabic: 'إدغام شفوي', color: '#58B800', desc: 'Merging of the letter Meem.' },
      { name: 'Mutajanisayn/Mutaqaribayn', arabic: 'متقاربين', color: '#A1A1A1', desc: 'Other merging rules.' },
    ]
  },
  {
    category: 'Madd (Elongation)',
    icon: <Volume2 size={18} className="text-blue-600" />,
    rules: [
      { name: 'Obligatory Madda', arabic: 'مد واجب', color: '#2144C1', desc: 'Hold for 4-5 vowels.' },
      { name: 'Permissible Madda', arabic: 'مد جائز', color: '#4050FF', desc: 'Hold for 2, 4, or 6 vowels.' },
      { name: 'Normal Madda', arabic: 'مد طبيعي', color: '#537FFF', desc: 'Hold for 2 vowels.' },
    ]
  },
  {
    category: 'Other Rules',
    icon: <BookType size={18} className="text-red-500" />,
    rules: [
      { name: 'Qalqalah', arabic: 'قلقلة', color: '#DD0008', desc: 'Echoing or bouncing sound.' },
      { name: 'Iqlab', arabic: 'إقلاب', color: '#26BFFD', desc: 'Converting Noon to Meem.' },
      { name: 'Silent Letters', arabic: 'حروف صامتة', color: '#AAAAAA', desc: 'Letters that are written but not pronounced.' },
    ]
  }
];

export default function TajweedGuidePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pb-2 pt-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border/60 transform-gpu">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all text-foreground outline-none"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-semibold text-foreground flex-1">
            Tajweed Guide
          </h1>
        </div>
      </div>

      <div className="px-4 pt-6 max-w-lg mx-auto">
        <div className="mb-6 bg-primary/5 border border-primary/10 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
            <Palette size={24} />
          </div>
          <h2 className="font-display font-semibold text-[17px] text-foreground mb-1">Color Coded Tajweed</h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed px-2">
            Inside Quran uses standard coloring to help you apply the correct pronunciation and tajweed rules while reading. You can toggle these colors on/off in the Settings.
          </p>
        </div>

        <div className="space-y-6">
          {tajweedRules.map((category, idx) => (
            <motion.section 
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                {category.icon}
                <h3 className="font-display font-semibold text-[15px] text-foreground">{category.category}</h3>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                {category.rules.map((rule, i) => (
                  <div key={i} className="flex gap-4 p-4 border-b border-border/50 last:border-0 relative">
                    <div className="flex-shrink-0 flex items-center justify-center mt-0.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/5" style={{ backgroundColor: rule.color }}>
                        <Type size={12} className="text-white mix-blend-overlay opacity-60" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-semibold font-display text-[14px] text-foreground">{rule.name}</span>
                        <span className="font-arabic text-[15px] font-bold" style={{ color: rule.color }}>{rule.arabic}</span>
                      </div>
                      <p className="text-[12px] text-muted-foreground leading-normal pr-4">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}
