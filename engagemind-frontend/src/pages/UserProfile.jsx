

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit, FiLogOut, FiGlobe, FiTwitter, FiGithub, FiLinkedin, FiMapPin, FiMail, FiCalendar, FiMessageSquare, FiCheckCircle } from 'react-icons/fi';
import axiosAuth from '../api/axiosAuth';
import Button from '../components/UI/Button';
import Avatar from '../components/UI/Avatar';

function UserProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosAuth.get('/auth/profile');
        const data = res.data;
        if (!data.bio) data.bio = 'No bio provided yet.';
        if (!data.joinDate) data.joinDate = new Date().toLocaleDateString();
        setProfile(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0b1220]">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0b1220] gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1220] pb-20 relative overflow-hidden">

      {/* Design Background Elements - Very subtle neutral mesh for light mode */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-neutral-100/50 dark:bg-neutral-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-neutral-100/50 dark:bg-neutral-900/20 rounded-full blur-3xl" />
      </div>

      {/* Hero Section - Neutral & Clean */}
      <div className="h-64 relative border-b border-neutral-100 dark:border-white/5">
        <div className="absolute inset-0 bg-neutral-50 dark:bg-[#0f172a]">
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#000000_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>

        {/* Back to Home Button - Updated to eliminate blue */}
        <div className="absolute top-6 left-6 z-20">
          <Button
            variant="secondary"
            className="backdrop-blur-md bg-white/80 dark:bg-black/50 border-neutral-200/60 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-black/70 shadow-sm gap-2"
            onClick={() => navigate('/')}
            leftIcon={<FiGlobe />}
          >
            Back to Home
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto relative -mt-32 z-10 px-4">

        {/* Profile Card Header - Premium Card */}
        <div className="bg-white dark:bg-[#111c31] border border-neutral-200/60 dark:border-white/5 shadow-xl shadow-neutral-200/40 dark:shadow-black/50 p-6 md:p-8 rounded-2xl mb-8 flex flex-col md:flex-row gap-8 items-center md:items-end">

          {/* Avatar Area */}
          <div className="relative shrink-0 -mt-24 md:-mt-20">
            <div className="p-1.5 bg-white dark:bg-[#111c31] rounded-full inline-block shadow-lg ring-1 ring-neutral-100 dark:ring-white/5">
              <Avatar
                src={profile.avatar}
                name={profile.username}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full text-4xl shadow-inner object-cover"
              />
            </div>
            {/* Status Indicator */}
            <div className="absolute bottom-3 right-3 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-[#111c31] rounded-full" title="Online" />
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left space-y-3 pb-2">
            <div>
              <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  {profile.username}
                </h1>
                <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 text-xs font-bold uppercase tracking-wider border border-neutral-200 dark:border-white/5">
                  {profile.role || 'Member'}
                </span>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 mt-1 font-medium text-lg">{profile.title || 'Data Science Enthusiast'}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-2">
                <FiMail size={16} className="text-neutral-400" /> {profile.email}
              </span>
              <span className="flex items-center gap-2">
                <FiMapPin size={16} className="text-neutral-400" /> Budapest, Hungary
              </span>
              <span className="flex items-center gap-2">
                <FiCalendar size={16} className="text-neutral-400" /> Joined {profile.joinDate}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 shrink-0">
            <Button variant="outline" onClick={() => navigate('/edit-profile')} className="border-neutral-300 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-700 dark:text-white px-5">
              <FiEdit className="mr-2" size={16} /> Edit Profile
            </Button>
            <Button variant="secondary" onClick={handleLogout} className="w-11 h-11 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30">
              <FiLogOut size={18} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Left Sidebar: About & Verification */}
          <div className="space-y-6">
            {/* About Card */}
            <div className="bg-white dark:bg-[#111c31] border border-neutral-200/60 dark:border-white/5 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-neutral-900 dark:bg-white rounded-full"></span>
                About
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-7">
                {profile.bio}
              </p>
            </div>

            {/* Verified Badge */}
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-2xl flex items-center gap-4 border border-emerald-100 dark:border-emerald-500/10">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0 shadow-sm border border-emerald-100 dark:border-transparent">
                <FiCheckCircle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 dark:text-emerald-400 text-sm">Verified Member</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-500/70 mt-0.5">Identity confirmed via Email</p>
              </div>
            </div>
          </div>

          {/* Right Content: Stats & Activity */}
          <div className="md:col-span-2 space-y-6">

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                icon={<FiMessageSquare />}
                label="Conversations"
                value="12"
                color="text-indigo-600 dark:text-indigo-400"
                bg="bg-indigo-50 dark:bg-indigo-500/10"
              />
              <StatCard
                icon={<FiCheckCircle />}
                label="Tasks Done"
                value="156"
                color="text-emerald-600 dark:text-emerald-400"
                bg="bg-emerald-50 dark:bg-emerald-500/10"
              />
              <StatCard
                icon={<FiGlobe />}
                label="Connections"
                value={profile.socialLinks ? Object.keys(profile.socialLinks).length : 0}
                color="text-orange-600 dark:text-orange-400"
                bg="bg-orange-50 dark:bg-orange-500/10"
              />
            </div>

            {/* Social Links Panel */}
            <div className="bg-white dark:bg-[#111c31] border border-neutral-200/60 dark:border-white/5 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-neutral-900 dark:text-white mb-5 flex items-center gap-2">
                <span className="w-1 h-5 bg-neutral-900 dark:bg-white rounded-full"></span>
                Social Connections
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.socialLinks && Object.entries(profile.socialLinks).map(([platform, url]) => (
                  url && (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 dark:border-white/5 bg-neutral-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-neutral-300 dark:hover:border-white/20 hover:shadow-md transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-black/20 border border-neutral-100 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:scale-110 group-hover:text-neutral-900 dark:group-hover:text-white transition-all shadow-sm">
                        <SocialIcon platform={platform} />
                      </div>
                      <div>
                        <h5 className="font-bold text-neutral-900 dark:text-white text-sm capitalize mb-0.5">{platform}</h5>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
                          View Profile
                        </span>
                      </div>
                    </a>
                  )
                ))}
                {(!profile.socialLinks || Object.keys(profile.socialLinks).length === 0) && (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-neutral-100 dark:border-white/5 rounded-xl bg-neutral-50/50 dark:bg-transparent">
                    <p className="text-neutral-500 text-sm mb-3">No social profiles connected yet.</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/edit-profile')}>Connect Information</Button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value, color, bg }) => (
  <div className="bg-white dark:bg-[#111c31] p-5 rounded-2xl border border-neutral-200/60 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group">
    <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-white leading-none mb-1">{value}</p>
      <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">{label}</p>
    </div>
  </div>
);

const SocialIcon = ({ platform }) => {
  switch (platform.toLowerCase()) {
    case 'twitter': return <FiTwitter />;
    case 'github': return <FiGithub />;
    case 'linkedin': return <FiLinkedin />;
    default: return <FiGlobe />;
  }
}

export default UserProfile;
