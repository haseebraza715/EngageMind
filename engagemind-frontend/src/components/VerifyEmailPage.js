import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import axiosAuth from '../api/axiosAuth';
import Card from './UI/Card';
import Badge from './UI/Badge';
import LoadingSpinner from './LoadingSpinner';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);
  const hasVerifiedRef = useRef(false); // Tracks if verification has been attempted

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setError('No verification token provided');
        setVerifying(false);
        return;
      }

      // Prevent duplicate verification attempts
      if (hasVerifiedRef.current) return;
      hasVerifiedRef.current = true;

      try {
        const response = await axiosAuth.get(`/auth/verify-email?token=${token}`);
        toast.success(response.data.message || 'Email verified successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Verification failed';
        setError(errorMsg);
        toast.error(errorMsg, { position: 'top-right', autoClose: 3000 });
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();

    // No cleanup needed since hasVerifiedRef prevents re-execution
  }, [searchParams, navigate]); // Dependencies are fine as they don't change mid-execution

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-teal-50 to-accent-100 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-accent-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

        <Card variant="glass-strong" className="w-full max-w-md relative z-10 text-center">
          <div className="bg-gradient-to-r from-primary-500 to-teal-500 h-1 w-full absolute top-0 left-0 rounded-t-xl"></div>

          <div className="pt-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Email Verification</h2>

            {verifying ? (
              <div className="py-8">
                <LoadingSpinner size="lg" text="Verifying your email..." />
              </div>
            ) : error ? (
              <div className="py-6">
                <div className="flex justify-center mb-4">
                  <FiXCircle className="h-16 w-16 text-red-500" />
                </div>
                <Badge variant="danger" className="mb-4">
                  Verification Failed
                </Badge>
                <p className="text-gray-600 mb-6">{error}</p>
              </div>
            ) : (
              <div className="py-6">
                <div className="flex justify-center mb-4">
                  <FiCheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
                </div>
                <Badge variant="success" className="mb-4">
                  Verified
                </Badge>
                <p className="text-gray-600">
                  Email verified! Redirecting to login...
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <ToastContainer />
    </>
  );
}
