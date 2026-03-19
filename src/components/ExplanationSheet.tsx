import { useState } from 'react';
import { X, Plus, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useExplanations } from '@/hooks/useAppStore';
import DraggableBottomSheet from '@/components/DraggableBottomSheet';
import type { Ayah, Surah, Explanation, DeeperLookCategory, RootWord } from '@/types/quran';

interface ExplanationSheetProps {
  ayah: Ayah;
  surah: Surah;
  onClose: () => void;
}

type Tab = 'concise' | 'deeper' | 'ask';

export default function ExplanationSheet({ ayah, surah, onClose }: ExplanationSheetProps) {
  const { getExplanation, saveExplanation } = useExplanations();
  const existing = getExplanation(surah.number, ayah.numberInSurah);
  const [tab, setTab] = useState<Tab>('concise');
  const [editing, setEditing] = useState(false);
  const [conciseText, setConciseText] = useState(existing?.concise?.[ayah.numberInSurah] || '');
  const [categories, setCategories] = useState<DeeperLookCategory[]>(existing?.deeperLook?.categories || []);
  const [rootWords, setRootWords] = useState<RootWord[]>(existing?.deeperLook?.rootWords || []);
  const [newCatTitle, setNewCatTitle] = useState('');
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [source, setSource] = useState(existing?.source || '');

  const handleSave = () => {
    const explanation: Explanation = {
      id: existing?.id || `exp-${surah.number}-${ayah.numberInSurah}-${Date.now()}`,
      surahNumber: surah.number,
      ayahs: existing?.ayahs || [ayah.numberInSurah],
      concise: { ...existing?.concise, [ayah.numberInSurah]: conciseText },
      deeperLook: { rootWords, categories },
      source,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveExplanation(explanation);
    setEditing(false);
  };

  const addCategory = () => {
    if (!newCatTitle.trim()) return;
    setCategories(prev => [...prev, {
      id: `cat-${Date.now()}`,
      title: newCatTitle,
      content: '',
      order: prev.length,
    }]);
    setNewCatTitle('');
  };

  const updateCategoryContent = (id: string, content: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, content } : c));
  };

  const addRootWord = () => {
    setRootWords(prev => [...prev, {
      id: `rw-${Date.now()}`,
      arabic: '',
      transliteration: '',
      rootLetters: '',
      explanation: '',
    }]);
  };

  const updateRootWord = (id: string, field: keyof RootWord, value: string) => {
    setRootWords(prev => prev.map(rw => rw.id === id ? { ...rw, [field]: value } : rw));
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'concise', label: 'Concise' },
    { id: 'deeper', label: 'Deeper Look' },
    { id: 'ask', label: 'Ask Ustadh' },
  ];

  const hasContent = existing && (conciseText || categories.length > 0);

  const header = (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        <div>
          <p className="text-xs text-muted-foreground">{surah.englishName}</p>
          <p className="font-display text-sm font-semibold">Ayah {ayah.numberInSurah}</p>
        </div>
        <div className="flex items-center gap-2">
          {editing && (
            <button onClick={handleSave} className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              <Save size={12} /> Save
            </button>
          )}
          <button onClick={onClose} className="rounded-xl p-2 transition hover:bg-secondary">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2">
        <div className="flex gap-1 rounded-full bg-secondary/70 p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                tab === t.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/80'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <DraggableBottomSheet onClose={onClose} header={header} defaultSnap="mid" bodyClassName="px-4 py-4 pb-12">
      <div className="mb-6 rounded-2xl bg-secondary/50 p-4">
        <p className="arabic-text mb-3 text-center text-lg text-foreground">{ayah.text}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{ayah.translation}</p>
      </div>

      {(source || editing) && (
        <div className="mb-4">
          {editing ? (
            <input
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="Source (e.g., Ibn Kathir)"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          ) : source ? (
            <p className="text-[10px] font-medium uppercase tracking-wider text-primary">Source: {source}</p>
          ) : null}
        </div>
      )}

      {tab === 'concise' && (
        <div>
          {!hasContent && !editing ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-sm text-muted-foreground">No Explanation Added Yet</p>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Plus size={16} /> Add Explanation
              </button>
            </div>
          ) : editing ? (
            <textarea
              value={conciseText}
              onChange={e => setConciseText(e.target.value)}
              placeholder="Write your explanation for this ayah..."
              rows={8}
              className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{conciseText}</p>
              <button
                onClick={() => setEditing(true)}
                className="mt-4 text-xs font-medium text-primary hover:underline"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'deeper' && (
        <div className="space-y-4">
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold">Root Word Analysis</h3>
            <div className="mb-3 flex flex-wrap gap-2">
              {rootWords.map(rw => (
                <button
                  key={rw.id}
                  onClick={() => setExpandedCat(expandedCat === rw.id ? null : rw.id)}
                  className="rounded-full bg-accent px-3 py-1.5 font-arabic text-sm text-accent-foreground"
                >
                  {rw.arabic || '...'}
                </button>
              ))}
              {editing && (
                <button onClick={addRootWord} className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary">
                  + Add
                </button>
              )}
            </div>

            {rootWords.map(rw => expandedCat === rw.id && (
              <motion.div
                key={rw.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-3 rounded-2xl border border-border bg-card p-4"
              >
                {editing ? (
                  <div className="space-y-2">
                    <input value={rw.arabic} onChange={e => updateRootWord(rw.id, 'arabic', e.target.value)} placeholder="Arabic word" className="arabic-text w-full rounded-xl bg-secondary px-3 py-2 text-sm focus:outline-none" />
                    <input value={rw.transliteration} onChange={e => updateRootWord(rw.id, 'transliteration', e.target.value)} placeholder="Transliteration" className="w-full rounded-xl bg-secondary px-3 py-2 text-sm focus:outline-none" />
                    <input value={rw.rootLetters} onChange={e => updateRootWord(rw.id, 'rootLetters', e.target.value)} placeholder="Root letters" className="w-full rounded-xl bg-secondary px-3 py-2 text-sm focus:outline-none" />
                    <textarea value={rw.explanation} onChange={e => updateRootWord(rw.id, 'explanation', e.target.value)} placeholder="Explanation" rows={3} className="w-full resize-none rounded-xl bg-secondary px-3 py-2 text-sm focus:outline-none" />
                  </div>
                ) : (
                  <div>
                    <p className="arabic-text text-lg text-primary">{rw.arabic}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{rw.transliteration} • Root: {rw.rootLetters}</p>
                    <p className="mt-2 text-sm leading-relaxed">{rw.explanation}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div>
            <h3 className="mb-3 font-display text-sm font-semibold">Deep Analysis</h3>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="overflow-hidden rounded-2xl border border-border">
                  <button
                    onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition hover:bg-secondary/50"
                  >
                    {cat.title}
                    <span className="text-muted-foreground">{expandedCat === cat.id ? '−' : '+'}</span>
                  </button>
                  {expandedCat === cat.id && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-4">
                      {editing ? (
                        <textarea
                          value={cat.content}
                          onChange={e => updateCategoryContent(cat.id, e.target.value)}
                          placeholder="Write analysis..."
                          rows={5}
                          className="w-full resize-none rounded-xl bg-secondary px-3 py-2 text-sm focus:outline-none"
                        />
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {cat.content || 'No content yet.'}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
              ))}

              {editing && (
                <div className="flex gap-2">
                  <input
                    value={newCatTitle}
                    onChange={e => setNewCatTitle(e.target.value)}
                    placeholder="Category title..."
                    className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                  />
                  <button onClick={addCategory} className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground">
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Plus size={16} /> {categories.length > 0 ? 'Edit' : 'Add Analysis'}
            </button>
          )}
        </div>
      )}

      {tab === 'ask' && (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Coming soon — Ask an Ustadh</p>
        </div>
      )}
    </DraggableBottomSheet>
  );
}
