import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function WordDetailsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = searchParams.get('location');

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-semibold text-sm truncate">Word Details</h2>
            <p className="text-[10px] text-muted-foreground">{location}</p>
          </div>
        </div>
      </div>
      
      <div className="p-10 text-center text-muted-foreground italic">
        This page will contain full linguistic details for word {location}.
      </div>
    </div>
  );
}
