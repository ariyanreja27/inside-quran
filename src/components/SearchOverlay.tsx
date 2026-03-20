import React, { useState, useEffect } from 'react';
import { Search, X, History, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch, SearchResult } from '@/hooks/useSearch';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const navigate = useNavigate();
  const { query, setQuery, results, isLoading, queryInfo, performAction } = useSearch();
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('recent-searches', []);

  // Clear query on open/close
  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen, setQuery]);

  const handleSearchSelect = (selectedQuery: string) => {
    setQuery(selectedQuery);
  };

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    if (query.trim()) {
      const updated = [query.trim(), ...recentSearches.filter(s => s !== query.trim())].slice(0, 5);
      setRecentSearches(updated);
    }
    navigate(`/surah/${result.surahNumber}?ayah=${result.ayahNumberInSurah}`);
    onClose();
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() 
            ? <span key={i} className="bg-primary/20 text-primary font-medium rounded-sm px-0.5">{part}</span>
            : part
        )}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex flex-col"
      >
        {/* Search Header */}
        <div className="p-4 flex items-center gap-3 bg-card border-b border-border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              autoFocus
              type="text"
              placeholder="Search surahs, ayahs, or keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performAction()}
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-muted/50 border-none text-base focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-sm font-medium text-muted-foreground hover:text-foreground px-2"
          >
            Cancel
          </button>
        </div>

        {/* Search Content */}
        <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
          {/* Coordinate/Number Search Hint */}
          {(queryInfo.type === 'coordinate' || queryInfo.type === 'surah_number') && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between group cursor-pointer"
              onClick={performAction}
            >
              <div>
                <p className="text-primary font-medium text-sm">Direct Navigation</p>
                <p className="text-muted-foreground text-[13px]">
                  Go to {queryInfo.type === 'coordinate' ? `Surah ${queryInfo.surah}, Ayah ${queryInfo.ayah}` : `Surah ${queryInfo.number}`}
                </p>
              </div>
              <ArrowRight className="text-primary group-hover:translate-x-1 transition-transform" size={20} />
            </motion.div>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearchSelect(s)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-card border border-border text-sm hover:border-primary/30 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                  >
                    <History size={14} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-muted-foreground text-sm">Searching the Quran...</p>
            </div>
          ) : results && results.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
                Search Results ({results.length})
              </h3>
              {results.map((res, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={`${res.surahNumber}-${res.ayahNumber}`}
                  onClick={() => handleResultClick(res)}
                  className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded text-center">
                        {res.surahNumber}:{res.ayahNumberInSurah}
                      </span>
                      <span className="font-display font-semibold text-sm text-foreground">
                        {res.surahName}
                      </span>
                    </div>
                    <ArrowRight className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" size={16} />
                  </div>
                  
                  {res.text && (
                    <p className="font-arabic text-lg text-foreground text-right mb-2 leading-loose" dir="rtl">
                      {highlightText(res.text, query)}
                    </p>
                  )}
                  
                  <p className="text-[14px] text-muted-foreground leading-relaxed line-clamp-3 italic">
                    {highlightText(res.translation, query)}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : query.length > 2 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search size={32} className="text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No results found</h3>
              <p className="text-muted-foreground text-sm">Try searching for a different surah, ayah, or keyword.</p>
            </div>
          ) : !query && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <Search size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Start typing to search the Quran</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
