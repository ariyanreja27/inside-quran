import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Globe, Type, BookmarkX, Bell, Cloud, CloudUpload, Eye, Info, RotateCcw, LucideIcon, Minus, Plus } from 'lucide-react';
import { useSettings, useDarkMode, useBookmarks, useFavorites, defaultSettings } from '@/hooks/useAppStore';
import { Slider } from '@/components/ui/slider';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { clearBookmarks, bookmarks } = useBookmarks();
  const { clearFavorites, favorites } = useFavorites();

  const handleClearBookmarks = () => {
    if (bookmarks.length === 0) return alert('No bookmarks to clear.');
    if (window.confirm('Are you sure you want to completely clear all saved bookmarks?')) {
      clearBookmarks();
    }
  };

  const handleClearFavorites = () => {
    if (favorites.length === 0) return alert('No favorites to clear.');
    if (window.confirm('Are you sure you want to completely clear all favorite Surahs?')) {
      clearFavorites();
    }
  };

  const SectionTitle = ({ icon: Icon, title }: { icon: LucideIcon; title: string }) => (
    <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground mb-4">
      <Icon size={16} className="text-primary" /> {title}
    </h2>
  );

  const Stepper = ({ label, value, unit, min, max, step, onChange, description }: any) => {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{description || `${value}${unit}`}</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/30 rounded-full p-1 border border-border/50">
          <button 
            disabled={value <= min}
            onClick={() => onChange(Math.max(min, Number((value - step).toFixed(1))))} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-background hover:bg-accent text-foreground shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border/50"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm font-semibold w-12 text-center font-display">{value}{unit}</span>
          <button 
            disabled={value >= max}
            onClick={() => onChange(Math.min(max, Number((value + step).toFixed(1))))} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-background hover:bg-accent text-foreground shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border/50"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 py-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Preferences and configurations</p>
      </div>

      <div className="px-4 py-6 space-y-8 max-w-lg mx-auto">
        
        {/* SECTION 1: THEME */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.0 }}>
          <SectionTitle icon={Moon} title="Appearance" />
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle dark theme</p>
            </div>
            <button 
              onClick={toggleDark}
              className={`w-12 h-6 rounded-full transition-colors relative ${isDark ? 'bg-primary' : 'bg-secondary'}`}
            >
              <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </motion.section>

        {/* SECTION 2: LANGUAGE */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SectionTitle icon={Globe} title="Language" />
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
            {(['en', 'bn', 'hi'] as const).map(lang => {
              const labels = { en: 'English', bn: 'Bengali (বাংলা)', hi: 'Hindi (हिंदी)' };
              return (
                <label key={lang} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">{labels[lang]}</span>
                  <input 
                    type="radio" 
                    name="language" 
                    value={lang} 
                    checked={settings.language === lang}
                    onChange={() => updateSettings({ language: lang })}
                    className="w-4 h-4 accent-primary"
                  />
                </label>
              )
            })}
          </div>
        </motion.section>

        {/* SECTION 3: READING */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionTitle icon={Type} title="Reading Preferences" />
          <div className="bg-card border border-border rounded-2xl p-4 space-y-6 shadow-sm">
            <Stepper 
              label="Arabic Size" 
              description="Font size for Quranic text"
              value={settings.arabicFontSize} 
              unit="px" 
              min={16} max={48} step={2} 
              onChange={(val: number) => updateSettings({ arabicFontSize: val })} 
            />
            
            <Stepper 
              label="Translation Size" 
              description="Font size for English/Urdu"
              value={settings.translationFontSize} 
              unit="px" 
              min={10} max={24} step={1} 
              onChange={(val: number) => updateSettings({ translationFontSize: val })} 
            />

            <Stepper 
              label="Line Spacing" 
              description="Vertical space between lines"
              value={settings.lineSpacing} 
              unit="x" 
              min={1.5} max={4.0} step={0.1} 
              onChange={(val: number) => updateSettings({ lineSpacing: val })} 
            />

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => updateSettings({
                  arabicFontSize: defaultSettings.arabicFontSize,
                  translationFontSize: defaultSettings.translationFontSize,
                  lineSpacing: defaultSettings.lineSpacing,
                })}
                className="text-[10px] font-semibold text-primary/60 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider"
              >
                <RotateCcw size={10} />
                Reset to defaults
              </button>
            </div>
          </div>
        </motion.section>

        {/* SECTION 7: APPEARANCE (Moved up for logical flow) */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SectionTitle icon={Eye} title="Filter" />
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-medium">Explained Verses Only</p>
              <p className="text-xs text-muted-foreground">Hide verses without tafsir</p>
            </div>
            <button 
              onClick={() => updateSettings({ showOnlyExplained: !settings.showOnlyExplained })}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.showOnlyExplained ? 'bg-primary' : 'bg-secondary'}`}
            >
              <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.showOnlyExplained ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </motion.section>



        {/* SECTION 5 & 6: PLACEHOLDERS */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <SectionTitle icon={Cloud} title="Sync & Notifications" />
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm opacity-60 pointer-events-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-muted-foreground" />
                <p className="text-sm font-medium">Daily Reminders</p>
              </div>
              <span className="text-[10px] font-medium bg-secondary px-2 py-1 rounded-md text-muted-foreground">Coming Soon</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudUpload size={16} className="text-muted-foreground" />
                <p className="text-sm font-medium">Cloud Backup</p>
              </div>
              <span className="text-[10px] font-medium bg-secondary px-2 py-1 rounded-md text-muted-foreground">Coming Soon</span>
            </div>
          </div>
        </motion.section>

        {/* SECTION 8: ABOUT */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SectionTitle icon={Info} title="About" />
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
            <h3 className="font-display font-bold text-xl text-primary mb-1">Inside Quran</h3>
            <p className="text-xs text-muted-foreground mb-4">Version 1.0.0</p>
            <p className="text-sm leading-relaxed text-foreground">
              A personal Quran study and tafsir system designed for focused reading and reflection.
            </p>
          </div>
        </motion.section>
        
      </div>
    </div>
  );
}
