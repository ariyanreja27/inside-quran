import { Link, useLocation } from 'react-router-dom';
import { Bookmark, Home, Settings, FileText, Library } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  // Hide BottomNav on detail screens
  const hiddenOn = ['/surah', '/explanation-builder', '/tafsir-builder', '/note-builder'];
  if (hiddenOn.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/saved', icon: Bookmark, label: 'Saved' },
    { to: '/manage', icon: FileText, label: 'Manage' },
    { to: '/library', icon: Library, label: 'Library' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0)]">
      <div className="scrollbar-hide mx-auto flex h-16 max-w-lg items-center overflow-x-auto px-4">
        <div className="flex min-w-full items-center justify-between gap-1 sm:gap-2">
          {links.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex min-w-[4.5rem] flex-1 shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
