import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatContainer from './ChatContainer';
import axiosAuth from '../../api/axiosAuth';

function ChatPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    username: 'Guest',
    avatar: null,
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await axiosAuth.get('/auth/profile');
        setUserData({
          username: response.data.username,
          avatar: response.data.avatar,
        });
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        navigate('/login');
      }
    };

    fetchUserProfile();
  }, [navigate]);

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#f7f8fb] dark:bg-[#0b1220]">
      <div className="absolute inset-0 bg-brand-wash opacity-70 pointer-events-none" />
      <div className="h-full w-full flex relative z-10">
        <ChatContainer userData={userData} />
      </div>
    </div>
  );
}

export default ChatPage;