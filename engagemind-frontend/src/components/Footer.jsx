import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const syncAuthState = () => setIsAuthenticated(!!localStorage.getItem('token'));
    syncAuthState();
    window.addEventListener('storage', syncAuthState);
    window.addEventListener('auth-state-change', syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener('auth-state-change', syncAuthState);
    };
  }, []);

  return (
    <footer className="border-t border-neutral-200/70 dark:border-white/10 bg-white dark:bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between gap-4">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white font-bold text-lg">
              E
            </div>
            <span className="text-lg font-bold text-neutral-900 dark:text-white">EngageMind</span>
          </Link>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-xl">
            Thesis prototype for authenticated chat, document-grounded RAG, and GPT-2 LoRA fine-tuning.
          </p>
        </div>

        <div className="flex items-center gap-5 text-sm text-neutral-500 dark:text-neutral-400">
          <Link to="/chat" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Chat
          </Link>
          {isAuthenticated ? (
            <Link to="/profile" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Profile
            </Link>
          ) : (
            <>
              <Link to="/login" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Log In
              </Link>
              <Link to="/register" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
