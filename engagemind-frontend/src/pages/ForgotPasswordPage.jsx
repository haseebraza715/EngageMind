import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import axiosAuth from '../api/axiosAuth';
import { useToast } from '../components/UI/Toast';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axiosAuth.post('/auth/forgot-password', { email });
      toast.success(res.data.message || 'If that email is registered, a reset link was sent.');
      setEmail('');
      setTimeout(() => navigate('/login'), 4000);
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] dark:bg-[#0b1220] flex items-center justify-center p-4 relative overflow-hidden">

      <div className="absolute inset-0 bg-brand-wash opacity-70 pointer-events-none" />
      <Card variant="elevated" className="w-full max-w-md p-8 relative z-10 overflow-hidden">
        <div className="h-1 w-full bg-brand-gradient absolute top-0 left-0" />
        <div className="text-center mb-8 mt-2">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FiMail size={24} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Forgot Password</h1>
          <p className="text-neutral-500 text-sm">Enter your email and we'll send you instructions to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<FiMail className="text-neutral-400" />}
          />

          <Button type="submit" variant="primary" className="w-full h-11" loading={isLoading}>
            Send Reset Link
          </Button>

          <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">
            <FiArrowLeft /> Back to Login
          </Link>
        </form>
      </Card>
    </div>
  );
}
