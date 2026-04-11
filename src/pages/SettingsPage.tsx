import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Globe, Type, BookmarkX, Bell, Cloud, CloudUpload, Eye, Info, RotateCcw, LucideIcon, Minus, Plus, Download, Upload, ArrowLeft, Settings, Star, Book, PenLine, Database, HardDrive, Trash2 } from 'lucide-react';
import {
  useSettings, useDarkMode, useBookmarks, useFavorites,
  useExplanations, useTafsirSources, useCustomTafsirs,
  useCollections, useNotes, useLastPosition,
  useLastRead, useCustomTranslations,
  defaultSettings
} from '@/hooks/useAppStore';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { clearBookmarks, bookmarks } = useBookmarks();
  const { clearFavorites, favorites } = useFavorites();
  const { explanations } = useExplanations();
  const { sources } = useTafsirSources();
  const { tafsirRecords } = useCustomTafsirs();
  const { collections } = useCollections();
  const { notes } = useNotes();
  const { position } = useLastPosition();
  const { lastRead } = useLastRead();
  const { customTranslations } = useCustomTranslations();

  const targetArabicFontSize = settings.arabicFont === 'Noorehuda' ? 34 : 24;

  const isModified =
    settings.arabicFontSize !== targetArabicFontSize ||
    settings.translationFontSize !== defaultSettings.translationFontSize ||
    settings.lineSpacing !== defaultSettings.lineSpacing;

  const [isClearBookmarksOpen, setIsClearBookmarksOpen] = useState(false);
  const [isClearFavoritesOpen, setIsClearFavoritesOpen] = useState(false);

  const handleClearBookmarks = () => {
    if (bookmarks.length === 0) return;
    setIsClearBookmarksOpen(true);
  };

  const handleClearFavorites = () => {
    if (favorites.length === 0) return;
    setIsClearFavoritesOpen(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [selectedResetTypes, setSelectedResetTypes] = useState<string[]>([]);
  const [storageUsage, setStorageUsage] = useState<Record<string, number>>({});
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'bookmarks', 'favorites', 'explanations', 'tafsirs', 'notes', 'collections', 'settings'
  ]);

  const backupMapping: Record<string, string[]> = useMemo(() => ({
    bookmarks: ['iq-bookmarks'],
    favorites: ['iq-favorites'],
    explanations: ['iq-explanations'],
    tafsirs: ['iq-tafsir-sources', 'iq-tafsir-records'],
    notes: ['iq-notes'],
    collections: ['iq-collections'],
    settings: ['iq-settings', 'iq-dark-mode', 'iq-last-position', 'iq-custom-translations', 'iq-last-read']
  }), []);

  const calculateStorage = useCallback(() => {
    const usage: Record<string, number> = {};
    Object.entries(backupMapping).forEach(([category, keys]) => {
      let categorySize = 0;
      keys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) categorySize += item.length;
      });
      usage[category] = categorySize;
    });
    setStorageUsage(usage);
  }, [backupMapping]);

  useEffect(() => {
    calculateStorage();
  }, [
    calculateStorage,
    isExportDialogOpen,
    bookmarks, favorites, explanations,
    sources, tafsirRecords, collections,
    notes, position, lastRead, customTranslations
  ]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalUsage = Object.values(storageUsage).reduce((a, b) => a + b, 0);

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleResetType = (type: string) => {
    if ((storageUsage[type] || 0) === 0) return;
    setSelectedResetTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleResetSelected = () => {
    if (selectedResetTypes.length === 0) return;

    selectedResetTypes.forEach(type => {
      const keys = backupMapping[type];
      keys.forEach(key => localStorage.removeItem(key));
    });

    setIsResetDialogOpen(false);
    window.location.reload();
  };

  const handleExportBackup = () => {
    try {
      if (selectedTypes.length === 0) {
        alert("Please select at least one data type to backup.");
        return;
      }

      const keysToBackup = selectedTypes.flatMap(type => backupMapping[type]);
      const backupData: Record<string, unknown> = {};

      keysToBackup.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            backupData[key] = JSON.parse(item);
          } catch (e) {
            backupData[key] = item;
          }
        }
      });

      if (Object.keys(backupData).length === 0) {
        alert("No data found for the selected categories.");
        return;
      }

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
      setIsExportDialogOpen(false);
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

        const allPossibleKeys = Object.values(backupMapping).flat();

        let restoredCount = 0;
        Object.keys(data).forEach(key => {
          if (key.startsWith('iq-')) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            restoredCount++;
          }
        });

        if (restoredCount > 0) {
          alert(`Backup restored successfully (${restoredCount} items). The app will now reload to apply changes.`);
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

  const MinimalCardControl = ({ label, value, unit, min, max, step, onChange, description }: {
    label: string;
    value: number;
    unit: string;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
    description?: string;
  }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleUpdate = useCallback((clientX: number) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.min(Math.max(x / rect.width, 0), 1);
      const newValue = min + percentage * (max - min);
      const steppedValue = Math.round(newValue / step) * step;
      onChange(Number(steppedValue.toFixed(1)));
    }, [min, max, step, onChange]);

    useEffect(() => {
      const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        handleUpdate(clientX);
      };
      const handleEnd = () => setIsDragging(false);

      if (isDragging) {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleEnd);
      }
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }, [isDragging, handleUpdate]);

    const percentage = (value - min) / (max - min);

    return (
      <div 
        ref={cardRef}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        className="relative h-20 bg-card border border-border/40 rounded-2xl overflow-hidden cursor-ew-resize select-none touch-none group transition-all hover:border-border"
      >
        {/* The "Liquid" Fill */}
        <motion.div 
          initial={false}
          animate={{ width: `${percentage * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-y-0 left-0 bg-primary/[0.08]"
        />
        
        {/* Interaction Indicator Line */}
        <motion.div 
          initial={false}
          animate={{ left: `${percentage * 100}%`, opacity: isDragging ? 1 : 0 }}
          className="absolute inset-y-0 w-0.5 bg-primary/20 pointer-events-none"
        />

        {/* Content */}
        <div className="absolute inset-0 px-5 flex items-center justify-between pointer-events-none">
          <div>
            <p className="text-[14px] font-bold text-foreground tracking-tight">{label}</p>
            <p className="text-[10px] text-muted-foreground opacity-60 mt-0.5 uppercase tracking-wider">{description}</p>
          </div>
          <div className="text-right">
            <span className="text-[18px] font-bold text-primary tabular-nums tracking-tighter">
              {value}
              <span className="text-[10px] ml-1 opacity-50 font-medium">{unit}</span>
            </span>
          </div>
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
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all text-foreground outline-none"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-semibold text-foreground flex-1">
            Settings
          </h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="px-4 py-6 space-y-8 max-w-lg mx-auto"
      >

        {/* SECTION 1: THEME */}
        <section>
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
        </section>

        {/* SECTION 2: LANGUAGE */}
        <section>
          <SectionTitle icon={Globe} title="Language" />
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
            {(['en', 'bn', 'hi'] as const).map(lang => {
              const labels = { en: 'English', bn: 'Bengali (বাংলা)', hi: 'Hindi (हिंदी)' };
              return (
                <label key={lang} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-medium transition-colors">{labels[lang]}</span>
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
        </section>

        {/* SECTION 3: READING */}
        <section>
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
                arabicFontSize: targetArabicFontSize,
                translationFontSize: defaultSettings.translationFontSize,
                lineSpacing: defaultSettings.lineSpacing,
              })}
              disabled={!isModified}
              className="w-8 h-8 flex items-center justify-center rounded-full text-red-600 transition-colors disabled:cursor-default"
              title="Reset Reading Preferences"
            >
              <RotateCcw size={16} strokeWidth={2.5} />
            </motion.button>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 space-y-6 shadow-sm">
            <p className="text-sm font-bold mb-4">Arabic Script Type</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'Amiri', label: 'Amiri' },
                { id: 'Noorehuda', label: 'Noorehuda' }
              ].map((font) => (
                <button
                  key={font.id}
                  onClick={() => {
                    if (settings.arabicFont === font.id) return;
                    const newSize = font.id === 'Amiri' ? 24 : 34;
                    updateSettings({ arabicFont: font.id as 'Amiri' | 'Noorehuda', arabicFontSize: newSize });
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all h-[90px] border-2 ${
                    settings.arabicFont === font.id
                      ? 'bg-secondary/40 border-primary'
                      : 'bg-white border-border/40 opacity-80'
                  }`}
                >
                  <span 
                    className="text-[32px] mb-2 leading-none"
                    style={{ 
                      fontFamily: font.id,
                      color: settings.arabicFont === font.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                    }}
                  >
                    بِسْمِ اللَّهِ
                  </span>
                  <span 
                    className={`text-[13px] font-bold ${
                      settings.arabicFont === font.id ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {font.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="h-px bg-border/50 -mx-4" />

            <div className="space-y-4 py-4">
              <MinimalCardControl
                label="Arabic Size"
                description="Font size for Quranic text"
                value={settings.arabicFontSize}
                unit="px"
                min={16} max={56} step={2}
                onChange={(val: number) => updateSettings({ arabicFontSize: val })}
              />

              <MinimalCardControl
                label="Translation Size"
                description={`Font size for ${settings.language === 'en' ? 'English' : settings.language === 'bn' ? 'Bengali' : settings.language === 'hi' ? 'Hindi' : 'Urdu'}`}
                value={settings.language === 'en' ? settings.translationFontSize + 2 : settings.translationFontSize}
                unit="px"
                min={10} max={26} step={1}
                onChange={(val: number) => updateSettings({ 
                  translationFontSize: settings.language === 'en' ? val - 2 : val 
                })}
              />

              <MinimalCardControl
                label="Line Spacing"
                description="Vertical space between lines"
                value={settings.lineSpacing}
                unit="x"
                min={1.5} max={4.0} step={0.1}
                onChange={(val: number) => updateSettings({ lineSpacing: val })}
              />
            </div>
          </div>
        </section>

        {/* SECTION 7: APPEARANCE */}
        <section>
          <SectionTitle icon={Eye} title="Display & Filters" />
          <div className="space-y-2">
            {[
              { 
                id: 'tajweed', 
                label: 'Tajweed Highlighting', 
                desc: 'Color-coded rules for recitation', 
                icon: Book, 
                value: settings.showTajweed,
                onChange: () => updateSettings({ showTajweed: !settings.showTajweed })
              },
              { 
                id: 'translit', 
                label: 'Show Transliteration', 
                desc: 'Show full verse transliteration', 
                icon: Globe, 
                value: settings.showTransliteration,
                onChange: () => updateSettings({ showTransliteration: !settings.showTransliteration })
              },
              { 
                id: 'wbw', 
                label: 'Word-by-Word Mode', 
                desc: 'Show translation under each word', 
                icon: Type, 
                value: settings.showWordByWord,
                onChange: () => updateSettings({ showWordByWord: !settings.showWordByWord })
              },
              ...(settings.showWordByWord ? [{ 
                id: 'wbw-translit', 
                label: 'Word Transliteration', 
                desc: 'Pronunciation for each word', 
                icon: RotateCcw, 
                value: settings.showWordTransliteration,
                onChange: () => updateSettings({ showWordTransliteration: !settings.showWordTransliteration })
              }] : [])
            ].map((item) => (
              <div 
                key={item.id}
                className="bg-card border border-border/60 rounded-[20px] p-2.5 flex items-center justify-between shadow-sm transition-all hover:border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground leading-tight">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <button
                  onClick={item.onChange}
                  className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${item.value ? 'bg-primary' : 'bg-secondary'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${item.value ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </section>



        {/* SECTION 5 & 6: BACKUP & RESTORE */}
        <section>
          <SectionTitle icon={Cloud} title="Data Backup & Restore" />
          <div className="bg-card border border-border rounded-2xl p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Export Backup</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 opacity-70">Save your data to a .json file</p>
              </div>
              <button
                onClick={() => setIsExportDialogOpen(true)}
                className="h-9 px-4 bg-primary text-primary-foreground rounded-xl flex items-center gap-2 font-bold text-xs shadow-sm shadow-primary/10 transition-all active:scale-95"
              >
                <Download size={14} strokeWidth={2.5} />
                Export
              </button>
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Import Backup</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 opacity-70">Load from a .json file</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-9 px-4 bg-secondary text-foreground rounded-xl flex items-center gap-2 font-bold text-xs border border-border/50 transition-all active:scale-95"
              >
                <Upload size={14} strokeWidth={2.5} />
                Import
              </button>
              <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportBackup} className="hidden" />
            </div>
          </div>
        </section>

        {/* SECTION: STORAGE & RESET */}
        <section>
          <SectionTitle icon={HardDrive} title="Data & Storage" />
          <div className="bg-card border border-border rounded-2xl p-5 space-y-6 shadow-sm">
            {/* Storage Usage Dashboard */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Local Storage Usage</p>
                  <p className="text-[11px] text-muted-foreground opacity-70">Total used: {formatSize(totalUsage)}</p>
                </div>
                <Database size={16} className="text-muted-foreground/40" />
              </div>

              {totalUsage > 0 && (
                <div className="space-y-2.5">
                  {[
                    { id: 'bookmarks', label: 'Bookmarks', color: 'bg-blue-500' },
                    { id: 'favorites', label: 'Favorites', color: 'bg-amber-500' },
                    { id: 'explanations', label: 'Explanations', color: 'bg-emerald-500' },
                    { id: 'tafsirs', label: 'Tafsirs', color: 'bg-violet-500' },
                    { id: 'notes', label: 'Notes', color: 'bg-orange-500' },
                    { id: 'collections', label: 'Collections', color: 'bg-pink-500' },
                    { id: 'settings', label: 'App Settings', color: 'bg-slate-500' },
                  ].map(cat => {
                    const usage = storageUsage[cat.id] || 0;
                    const percent = totalUsage > 0 ? (usage / totalUsage) * 100 : 0;
                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <span>{cat.label}</span>
                          <span>{formatSize(usage)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            className={`h-full ${cat.color} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-px bg-border/50" />

            <div className="pt-2">
              <button
                disabled={totalUsage === 0}
                onClick={() => {
                  setSelectedResetTypes([]);
                  setIsResetDialogOpen(true);
                }}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-destructive font-bold text-sm bg-destructive/5 hover:bg-destructive/10 border border-destructive/10 transition-colors disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                aria-label="Reset Data"
              >
                <Trash2 size={16} />
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 8: ABOUT */}
        <section>
          <SectionTitle icon={Info} title="About" />
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center">
            <h3 className="font-display font-bold text-xl text-primary mb-1">Inside Quran</h3>
            <p className="text-xs text-muted-foreground mb-4">Version 1.0.0</p>
            <p className="text-sm leading-relaxed text-foreground">
              A personal Quran study and tafsir system designed for focused reading and reflection.
            </p>
          </div>
        </section>
      </motion.div>

      {/* Backup Selection Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-[320px] rounded-[2rem] p-0 border-none shadow-2xl bg-white/95 dark:bg-background/95 backdrop-blur-xl overflow-hidden [&>button]:top-7 [&>button]:right-7">
          <div className="p-6 pb-2 text-center">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-display font-semibold text-foreground">Backup Data</DialogTitle>
              <p className="text-[11px] text-muted-foreground opacity-60">Select items to include in backup</p>
            </DialogHeader>
          </div>

          <div className="px-4 py-2 space-y-1.5 max-h-[300px] overflow-y-auto scrollbar-hide [mask-image:linear-gradient(to_bottom,transparent,black_20px,black_calc(100%-20px),transparent)]">
            {[
              { id: 'bookmarks', label: 'Bookmarks', icon: BookmarkX, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { id: 'favorites', label: 'Favorites', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { id: 'explanations', label: 'Explanations', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { id: 'tafsirs', label: 'Tafsirs', icon: Book, color: 'text-violet-500', bg: 'bg-violet-500/10' },
              { id: 'notes', label: 'Notes', icon: PenLine, color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { id: 'collections', label: 'Collections', icon: Bell, color: 'text-pink-500', bg: 'bg-pink-500/10' },
              { id: 'settings', label: 'Settings', icon: Settings, color: 'text-slate-500', bg: 'bg-slate-500/10' },
            ].map((type) => (
              <motion.div
                key={type.id}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border shadow-sm ${selectedTypes.includes(type.id)
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-secondary/10 border-border/40 hover:bg-secondary/20'
                  }`}
                onClick={() => toggleType(type.id)}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type.bg} ${type.color} shadow-sm border border-border/10`}>
                    <type.icon size={15} strokeWidth={2} />
                  </div>
                  <span className="text-[13px] font-bold text-foreground/80">{type.label}</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all border ${selectedTypes.includes(type.id)
                    ? 'bg-primary border-primary shadow-sm'
                    : 'bg-transparent border-muted-foreground/20'
                    }`}
                >
                  {selectedTypes.includes(type.id) && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <DialogFooter className="p-5 pt-2 flex flex-col gap-2 sm:flex-col">
            <button
              onClick={handleExportBackup}
              disabled={selectedTypes.length === 0}
              className="w-full h-12 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download size={16} strokeWidth={2.5} />
              Export Now
            </button>
            <DialogClose asChild>
              <button className="w-full h-10 text-muted-foreground text-[12px] font-bold hover:text-foreground transition-colors">
                Maybe later
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Selection Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="max-w-[320px] rounded-[2rem] p-0 border-none shadow-2xl bg-white/95 dark:bg-background/95 backdrop-blur-xl overflow-hidden [&>button]:top-7 [&>button]:right-7">
          <div className="p-6 pb-2 text-center">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-display font-semibold text-foreground">Reset Data</DialogTitle>
              <p className="text-[11px] text-muted-foreground opacity-60">Select items to permanently delete</p>
            </DialogHeader>
          </div>

          <div className="px-4 py-2 space-y-1.5 max-h-[300px] overflow-y-auto scrollbar-hide [mask-image:linear-gradient(to_bottom,transparent,black_20px,black_calc(100%-20px),transparent)]">
            {[
              { id: 'bookmarks', label: 'Bookmarks', icon: BookmarkX, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { id: 'favorites', label: 'Favorites', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { id: 'explanations', label: 'Explanations', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { id: 'tafsirs', label: 'Tafsirs', icon: Book, color: 'text-violet-500', bg: 'bg-violet-500/10' },
              { id: 'notes', label: 'Notes', icon: PenLine, color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { id: 'collections', label: 'Collections', icon: Bell, color: 'text-pink-500', bg: 'bg-pink-500/10' },
              { id: 'settings', label: 'Settings', icon: Settings, color: 'text-slate-500', bg: 'bg-slate-500/10' },
            ].map((type) => {
              const usage = storageUsage[type.id] || 0;
              const isEmpty = usage === 0;

              return (
                <div key={type.id} className="relative">
                  <motion.div
                    whileTap={isEmpty ? {} : { scale: 0.97 }}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border shadow-sm ${isEmpty
                      ? 'opacity-40 grayscale-[0.5] cursor-default'
                      : selectedResetTypes.includes(type.id)
                        ? 'bg-destructive/5 border-destructive/20'
                        : 'bg-secondary/10 border-border/40 hover:bg-secondary/20'
                      }`}
                    onClick={() => toggleResetType(type.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type.bg} ${type.color} shadow-sm border border-border/10`}>
                        <type.icon size={15} strokeWidth={2} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-foreground/80">{type.label}</span>
                        {isEmpty && <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">No data found</span>}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all border ${isEmpty
                        ? 'border-muted-foreground/10 bg-muted/5'
                        : selectedResetTypes.includes(type.id)
                          ? 'bg-destructive border-destructive shadow-sm'
                          : 'bg-transparent border-muted-foreground/20'
                        }`}
                    >
                      {selectedResetTypes.includes(type.id) && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="p-5 pt-2 flex flex-col gap-2 sm:flex-col">
            <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
              <AlertDialogTrigger asChild>
                <button
                  disabled={selectedResetTypes.length === 0}
                  className="w-full h-12 bg-destructive text-destructive-foreground rounded-2xl font-bold text-sm shadow-md shadow-destructive/10 hover:shadow-destructive/20 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 size={16} strokeWidth={2.5} />
                  Reset Selection
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] border-none bg-white dark:bg-background shadow-2xl p-6">
                <AlertDialogHeader className="space-y-2">
                  <AlertDialogTitle className="text-left text-lg font-bold text-foreground">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                    Are you sure you want to permanently delete the selected {selectedResetTypes.length} {selectedResetTypes.length === 1 ? 'category' : 'categories'}? All your personal progress, notes, and records in these sections will be erased.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-4">
                  <AlertDialogCancel className="h-10 px-6 rounded-full border-border bg-secondary/10 text-foreground text-[13px] font-medium hover:bg-secondary/20 transition-all">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetSelected}
                    className="h-10 px-6 rounded-full bg-destructive text-destructive-foreground text-[13px] font-bold hover:bg-destructive/90 transition-all"
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <DialogClose asChild>
              <button className="w-full h-10 text-muted-foreground text-[12px] font-bold hover:text-foreground transition-colors">
                Cancel
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Clear Confirmations */}
      <AlertDialog open={isClearBookmarksOpen} onOpenChange={setIsClearBookmarksOpen}>
        <AlertDialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] border-none bg-white dark:bg-background shadow-2xl p-6">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-left text-lg font-bold text-foreground">Clear Bookmarks?</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
              Are you sure you want to completely clear all {bookmarks.length} saved bookmarks? This will permanently remove them from your saved list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-4">
            <AlertDialogCancel className="h-10 px-6 rounded-full border-border bg-secondary/10 text-foreground text-[13px] font-medium hover:bg-secondary/20 transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { clearBookmarks(); setIsClearBookmarksOpen(false); }}
              className="h-10 px-6 rounded-full bg-destructive text-destructive-foreground text-[13px] font-bold hover:bg-destructive/90 transition-all"
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isClearFavoritesOpen} onOpenChange={setIsClearFavoritesOpen}>
        <AlertDialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] border-none bg-white dark:bg-background shadow-2xl p-6">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-left text-lg font-bold text-foreground">Clear Favorites?</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
              Are you sure you want to completely clear all {favorites.length} favorite Surahs? This will permanently remove them from your starred list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-4">
            <AlertDialogCancel className="h-10 px-6 rounded-full border-border bg-secondary/10 text-foreground text-[13px] font-medium hover:bg-secondary/20 transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { clearFavorites(); setIsClearFavoritesOpen(false); }}
              className="h-10 px-6 rounded-full bg-destructive text-destructive-foreground text-[13px] font-bold hover:bg-destructive/90 transition-all"
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
