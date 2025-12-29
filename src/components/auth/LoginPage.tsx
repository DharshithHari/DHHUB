import { useState, useEffect } from 'react';
import { api, setSessionId } from '../../utils/api';
import { BookOpen, Sun, Moon } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      } else if (saved === 'light') {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    try {
      const next = !isDark;
      setIsDark(next);
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      try { window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark: next } })); } catch {}
    } catch (e) {
      // ignore
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(username, password, role);
      setSessionId(response.sessionId);
      onLogin(response.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center p-4 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-indigo-900/20'
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-10"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
      </button>

      <div className={`rounded-2xl shadow-xl w-full max-w-md p-8 transition-colors duration-300 ${
        isDark ? 'bg-gray-800/90 backdrop-blur-sm border border-gray-700' : 'bg-white'
      }`}>
        <div className="flex items-center justify-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-xl">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className={`text-center mb-2 transition-colors duration-300 ${
          isDark ? 'text-indigo-300' : 'text-indigo-900'
        }`}>DH Learning</h1>
        <p className={`text-center mb-8 transition-colors duration-300 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>Online Coding Tutoring Platform</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className={`block mb-2 transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['student', 'teacher', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-4 rounded-lg border-2 transition-all duration-300 ${
                    role === r
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-300'
                      : isDark
                      ? 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block mb-2 transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                isDark
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className={`block mb-2 transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                isDark
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className={`px-4 py-3 rounded-lg border transition-colors duration-300 ${
              isDark
                ? 'bg-red-900/30 text-red-300 border-red-800'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02]"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {role === 'admin' && (
          <div className={`mt-6 p-4 rounded-lg border transition-colors duration-300 ${
            isDark
              ? 'bg-gray-700/50 border-gray-600 text-gray-300'
              : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            <p className="text-sm">
              <strong>Welcome!!!</strong><br />
              Enter The Password Correctly<br />
              Wrong Attempts Will Lead To Account Suspension.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
