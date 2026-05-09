import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from 'lucide-react';

import { getPoSColor } from '@/utils/grammar-utils';
import { getApiUrl } from '@/utils/api';

interface GlossaryTerm {
  label: string;
  desc: string;
}

interface GlossaryData {
  groups: { id: string; name: string; tags: string[] }[];
  terms: Record<string, GlossaryTerm>;
}

export function GrammarGlossary() {
  const [data, setData] = React.useState<GlossaryData | null>(null);

  React.useEffect(() => {
    fetch(`${getApiUrl()}/api/morphology/glossary`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="p-1 hover:bg-primary/10 rounded-full transition-colors text-primary/60 hover:text-primary">
          <Info size={14} strokeWidth={2.5} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[75vh] overflow-y-auto sm:max-w-[420px] bg-[#FBF7F4] border-none rounded-[2rem] p-6 scrollbar-hide">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-display italic text-xl text-foreground">Grammar Glossary</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {data?.groups.map((group) => (
            <div key={group.id} className="space-y-3">
              <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] border-b border-primary/5 pb-1.5">
                {group.name}
              </h4>
              <div className="space-y-3">
                {group.tags.map((tag) => {
                  const term = data.terms[tag];
                  if (!term) return null;
                  const tagColor = getPoSColor(tag);
                  return (
                    <div key={tag} className="flex gap-3 items-start group">
                      <div 
                        className="min-w-[42px] h-[30px] rounded-lg shadow-sm flex items-center justify-center transition-transform group-hover:scale-105"
                        style={{ backgroundColor: tagColor }}
                      >
                        <span className="text-[9px] font-bold text-white px-0.5 text-center leading-tight uppercase">{tag}</span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-display font-semibold italic text-[14px] text-foreground leading-none">{term.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{term.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
