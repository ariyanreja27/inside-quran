import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Globe, Type, BookmarkX, Bell, Cloud, CloudUpload, Eye, Info, RotateCcw, LucideIcon, Minus, Plus, Download, Upload, ArrowLeft } from 'lucide-react';
import { useSettings, useDarkMode, useBookmarks, useFavorites, defaultSettings } from '@/hooks/useAppStore';
import { Slider } from '@/components/ui/slider';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { clearBookmarks, bookmarks } = useBookmarks();
  const { clearFavorites, favorites } = useFavorites();

  const isModified = 
    settings.arabicFontSize !== defaultSettings.arabicFontSize ||
    settings.translationFontSize !== defaultSettings.translationFontSize ||
    settings.lineSpacing !== defaultSettings.lineSpacing;

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    try {
      const keysToBackup = [
        'iq-settings', 'iq-favorites', 'iq-bookmarks', 'iq-explanations', 
        'iq-last-position', 'iq-dark-mode', 'iq-custom-translations'
      ];
      const backupData: Record<string, any> = {};
      
      keysToBackup.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          backupData[key] = JSON.parse(item);
        }
      });
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      a.download = `Inside-Quran-Backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup failed", error);
      alert("Failed to create backup.");
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data || typeof data !== 'object') throw new Error("Invalid backup file.");
        
        const validKeys = [
          'iq-settings', 'iq-favorites', 'iq-bookmarks', 'iq-explanations', 
          'iq-last-position', 'iq-dark-mode', 'iq-custom-translations'
        ];
        
        let restoredCount = 0;
        validKeys.forEach(key => {
          if (data[key] !== undefined) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            restoredCount++;
          }
        });

        if (restoredCount > 0) {
          alert("Backup restored successfully! The app will now reload to apply changes.");
          window.location.reload();
        } else {
          alert("No valid Inside Quran data found in this backup file.");
        }
      } catch (error) {
        console.error("Restore failed", error);
        alert("Failed to restore backup. Please ensure you selected a valid JSON backup file.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
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
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pb-2 pt-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border/60 transform-gpu">
        <div className="flex items-center gap-3 px-4 h-14">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-accent active:scale-95 text-foreground outline-none"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-semibold text-foreground flex-1">
            Settings
          </h1>
        </div>
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
          <div className="flex items-center justify-between">
            <SectionTitle icon={Type} title="Reading Preferences" />
            <motion.button
              initial={false}
              animate={{ 
                opacity: isModified ? 1 : 0,
                scale: isModified ? 1 : 0.8,
                rotate: isModified ? 0 : -90
              }}
              onClick={() => updateSettings({
                arabicFontSize: defaultSettings.arabicFontSize,
                translationFontSize: defaultSettings.translationFontSize,
                lineSpacing: defaultSettings.lineSpacing,
              })}
              disabled={!isModified}
              className="w-8 h-8 flex items-center justify-center rounded-full text-red-600 hover:text-red-700 transition-colors active:scale-90 disabled:cursor-default"
              title="Reset Reading Preferences"
            >
              <RotateCcw size={16} strokeWidth={2.5} />
            </motion.button>
          </div>
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



        {/* SECTION 5 & 6: BACKUP & RESTORE */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <SectionTitle icon={Cloud} title="Data Backup & Restore" />
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Export Backup</p>
                <p className="text-xs text-muted-foreground mt-0.5">Save your explanations & settings</p>
              </div>
              <button 
                onClick={handleExportBackup}
                className="h-9 px-3.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl flex items-center gap-2 font-medium text-sm transition-colors"
                aria-label="Export Backup"
              >
                <Download size={15} />
                Export
              </button>
            </div>
            
            <div className="h-px bg-border my-2" />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Restore Backup</p>
                <p className="text-xs text-muted-foreground mt-0.5">Load from a .json file</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="h-9 px-3.5 bg-secondary text-foreground hover:bg-secondary/80 rounded-xl flex items-center gap-2 font-medium text-sm transition-colors"
                aria-label="Restore Backup"
              >
                <Upload size={15} />
                Restore
              </button>
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleImportBackup} 
                className="hidden" 
              />
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
