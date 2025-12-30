import React from 'react';
import { FiLock, FiUserPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const AccessDeniedCard = ({
  message = "Join the community to unlock powerful AI conversations.",
  buttonText = "Create Free Account",
  buttonLink = "/register"
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] w-full relative overflow-hidden bg-[#f7f8fb] dark:bg-[#0b1220] transition-colors duration-300">
      <div className="absolute inset-0 bg-brand-wash opacity-70 pointer-events-none" />
      <div className="mesh-gradient absolute inset-0 pointer-events-none opacity-30" />

      <Card variant="elevated" className="max-w-md w-full text-center relative z-10 overflow-hidden">
        <div className="pt-8 pb-4">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-primary-500/20 rounded-full animate-ping opacity-20" />
              <FiLock className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">Unlock Chat</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed px-4">{message}</p>

          <div className="space-y-3">
            <Button
              onClick={() => navigate(buttonLink)}
              variant="primary"
              size="lg"
              className="w-full shadow-xl shadow-primary-500/20"
              rightIcon={<FiUserPlus />}
            >
              {buttonText}
            </Button>

            <button
              onClick={() => navigate('/login')}
              className="text-sm text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400 transition-colors"
            >
              Already have an account? <span className="underline">Sign in</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AccessDeniedCard;
