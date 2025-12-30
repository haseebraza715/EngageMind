import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import ChatPage from './components/Chat/ChatPage';
import { fetchConversations } from './components/Chat/chatApi';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/Homepage';
import RegisterPage from './pages/RegisterPage';
import UserProfile from './pages/UserProfile';
import LoadingSpinner from './components/LoadingSpinner';
import Layout from './components/Layout';
import VerifyEmailPage from './components/VerifyEmailPage';
import EditProfile from './pages/EditProfile';
import AuthSuccess from './pages/AuthSuccess';
import AccessDeniedCard from './pages/AccessDeniedCard';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ComponentShowcase from './pages/ComponentShowcase';
import { ToastProvider } from './components/UI/Toast';




const ProtectedRoute = ({ isLoading }) => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated && location.pathname === '/chat') {
    return (
      <AccessDeniedCard
        message="You must be registered to access the Chat feature."
        buttonText="Register Now"
        buttonLink="/register"
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};


function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedTheme = localStorage.getItem('darkMode');
    if (storedTheme === 'true') {
      document.documentElement.classList.add('dark');
    } else if (storedTheme === 'false') {
      document.documentElement.classList.remove('dark');
    }

    const loadInitialData = async () => {
      try {
        if (localStorage.getItem('token')) {
          // Try to fetch conversations, but don't block the app if it fails
          // The chat page will handle its own data loading
          try {
            await fetchConversations();
          } catch (conversationError) {
            // RAG server might not be running - that's okay, chat will handle it
            console.warn('Could not load conversations on startup:', conversationError.message);
            // Don't set error state - let the chat page handle its own errors
          }
        }
      } catch (err) {
        // Only set error for critical failures
        console.error('Critical error loading initial data:', err);
        // Don't block the app - let individual pages handle their own errors
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  return (
    <ToastProvider position="top-right">
      <Router>
        <div className="min-h-screen bg-[#f7f8fb] dark:bg-[#0b1220] transition-colors duration-300 font-sans">
          <Routes>
            {/* Public Routes with Layout */}
            <Route
              element={
                <Layout>
                  <Outlet />
                </Layout>
              }
            >
              <Route path="/" element={<HomePage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/auth-success" element={<AuthSuccess />} />
              <Route path="/access-denied" element={<AccessDeniedCard />} />
              <Route path="/component-showcase" element={<ComponentShowcase />} />
            </Route>

            {/* Auth Routes (No Layout) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute isLoading={isLoading} />}>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
