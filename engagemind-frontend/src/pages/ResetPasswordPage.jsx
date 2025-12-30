import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import axiosAuth from '../api/axiosAuth';
import { useToast } from '../components/UI/Toast';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast.error('Reset token is missing');
      navigate('/');
    }
  }, [location, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axiosAuth.post('/auth/reset-password', {
        token,
        newPassword,
      });

      toast.success(response.data.message || 'Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to reset password';
      toast.error(msg);
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
            <FiLock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">New Password</h1>
          <p className="text-neutral-500 text-sm">Create a new, secure password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            leftIcon={<FiLock className="text-neutral-400" />}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-neutral-400 hover:text-neutral-600 focus:outline-none">
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            }
          />

          <Button type="submit" variant="primary" className="w-full h-11" loading={isLoading}>
            Reset Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
