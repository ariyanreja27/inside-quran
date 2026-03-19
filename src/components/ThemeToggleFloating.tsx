import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { useDarkMode } from '@/hooks/useAppStore';

export default function ThemeToggleFloating() {
  const { isDark, setDarkMode } = useDarkMode();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed right-4 z-50"
      style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <div className="flex items-center gap-3 rounded-full border border-border bg-card/90 px-3 py-2 shadow-lg backdrop-blur-md">
        <Sun size={14} className={`transition-colors ${isDark ? 'text-muted-foreground' : 'text-primary'}`} />
        <Switch
          checked={isDark}
          onCheckedChange={setDarkMode}
          aria-label="Toggle dark mode"
        />
        <Moon size={14} className={`transition-colors ${isDark ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
    </motion.div>
  );
}
