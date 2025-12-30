import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock, FiUser, FiArrowLeft } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';
import axiosAuth from '../api/axiosAuth';
import { useToast } from '../components/UI/Toast';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axiosAuth.post('/auth/login', {
        emailOrUsername,
        password,
      });

      const { token, message } = response.data;
      localStorage.setItem('token', token);

      toast.success(message || 'Welcome back!');
      navigate('/chat');
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Login failed. Please check your credentials.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5003/auth/google';
  };

  return (
    <div className="min-h-screen flex bg-[#f7f8fb] dark:bg-[#0b1220] relative overflow-hidden">

      <div className="absolute inset-0 bg-brand-wash opacity-70 pointer-events-none" />

      {/* Left Column - Branding/Illustration (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0b1220] overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-transparent to-transparent" />

        <div className="relative z-10 w-full flex flex-col justify-between p-16">
          <Link to="/" className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 backdrop-blur flex items-center justify-center font-bold">E</div>
            <span className="text-xl font-bold">EngageMind</span>
          </Link>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-white leading-tight">
              Unlock the power of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/70">Intelligent AI</span>
            </h1>
            <p className="text-lg text-neutral-400 max-w-md">
              Join thousands of developers and professionals who use EngageMind to accelerate their workflow and unlock creativity.
            </p>
          </div>

          <div className="flex gap-4 text-sm text-neutral-500">
            <span>© {new Date().getFullYear()} EngageMind AI</span>
            <span>Privacy Policy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 md:px-12 lg:px-24 xl:px-32 relative z-10">
        <Link to="/" className="absolute top-8 left-6 lg:hidden flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors">
          <FiArrowLeft /> Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto space-y-8 surface-card rounded-2xl p-8 md:p-10"
        >
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Welcome back</h2>
            <p className="text-neutral-500 dark:text-neutral-400">Enter your details to access your account.</p>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full relative h-12 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              onClick={handleGoogleLogin}
            >
              <FcGoogle className="w-5 h-5 absolute left-4" />
              Sign in with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white/90 dark:bg-[#0f172a] px-2 text-neutral-400">Or continue with</span></div>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <Input
              label="Email or Username"
              placeholder="Enter your email"
              leftIcon={<FiUser className="text-neutral-400" />}
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="h-12"
              required
            />
            <div className="space-y-1">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                leftIcon={<FiLock className="text-neutral-400" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-neutral-400 hover:text-neutral-600 focus:outline-none">
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
                required
              />
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">Forgot password?</Link>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full h-12 text-base" loading={isLoading}>
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500">
            Don't have an account? <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">Sign up for free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
