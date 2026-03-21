import { Link, useLocation } from 'react-router-dom';
import { Bookmark, Home, Settings, FileText } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  // Hide BottomNav on detail screens
  const hiddenOn = ['/surah', '/explanation-builder', '/explanation-view'];
  if (hiddenOn.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/saved', icon: Bookmark, label: 'Saved' },
    { to: '/manage-explanations', icon: FileText, label: 'Manage' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-6">
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex min-w-24 flex-col items-center gap-1 rounded-2xl px-4 py-2 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
