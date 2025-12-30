import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCheckCircle } from 'react-icons/fi';
import Card from '../components/UI/Card';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);
      toast.success('Logged in with Google!', {
        position: 'top-right',
        autoClose: 2000,
      });

      // Countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/chat');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      toast.error('No token found. Try logging in again.', {
        position: 'top-right',
        autoClose: 3000,
      });
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#f7f8fb] dark:bg-[#0b1220] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-wash opacity-70 pointer-events-none" />
      {/* Subtle gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />

      <Card variant="glass-strong" className="w-full max-w-sm text-center relative z-10 overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1 w-full bg-brand-gradient" />

        <div className="p-8">
          {/* Animated checkmark */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <FiCheckCircle className="h-12 w-12 text-emerald-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Success!</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">
            Logging you in with Google...
          </p>

          <div className="text-5xl font-bold text-primary-500 mb-2">{countdown}</div>
          <p className="text-neutral-400 text-sm">Redirecting to chat...</p>
        </div>
      </Card>
    </div>
  );
}
