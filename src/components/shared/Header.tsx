import React from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';

interface HeaderProps {
  user: any;
  onLogout: () => void;
  role?: string;
}

export function Header({ user, onLogout, role }: HeaderProps) {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      try { localStorage.setItem('theme', 'dark'); } catch {}
    } else {
      root.classList.remove('dark');
      try { localStorage.setItem('theme', 'light'); } catch {}
    }

    try {
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark } }));
    } catch (e) {}
  }, [isDark]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') setIsDark(true);
      if (saved === 'light') setIsDark(false);
    } catch (e) {}
  }, []);

  return (
    <header className="w-full bg-gradient-to-r from-white/60 to-white/40 dark:from-black/60 dark:to-black/40 shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-semibold">DH</div>
          <div>
            <div className="text-lg font-medium">DH Learning</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{user?.name} {role ? `• ${role}` : ''}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
