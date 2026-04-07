import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export default function ExplorePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 flex flex-col">
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
            Explore
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 py-20 opacity-60">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Compass size={32} className="text-muted-foreground" />
        </div>
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-center text-muted-foreground max-w-[250px]">
          We are working on bringing you a new way to explore the Quran.
        </p>
      </div>
    </div>
  );
}
