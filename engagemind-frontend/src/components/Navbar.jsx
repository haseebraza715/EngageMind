import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiBell, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import axiosAuth from '../api/axiosAuth';
import Avatar from './UI/Avatar';
import Button from './UI/Button';
import Dropdown, { DropdownItem, DropdownDivider, DropdownHeader } from './UI/Dropdown';
import DarkModeToggle from './UI/DarkModeToggle';
import { cn } from '../lib/utils';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userData, setUserData] = useState({
    username: 'Guest',
    avatar: '',
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Fetch user data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axiosAuth.get('/auth/profile');
        setUserData({
          username: response.data.username,
          avatar: response.data.avatar,
        });
        setIsLoggedIn(true);
      } catch (err) {
        setIsLoggedIn(false);
      }
    };

    if (localStorage.getItem('token')) {
      fetchUserProfile();
    }
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Chat', path: '/chat' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-white/90 dark:bg-[#0f172a]/85 backdrop-blur-2xl border-neutral-200/60 dark:border-white/10 shadow-soft"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white font-bold text-lg shadow-brand group-hover:shadow-brand transition-all duration-300">
              E
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
              EngageMind
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive(link.path)
                      ? "text-primary-700 dark:text-primary-400 bg-primary-50/80 dark:bg-primary-900/20"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800" />

            <div className="flex items-center gap-2">
              <DarkModeToggle />

              {isLoggedIn ? (
                <>
                  <div className="relative">
                    <Button variant="ghost" size="sm" icon className="text-neutral-500 relative">
                      <FiBell className="w-5 h-5" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-neutral-900" />
                    </Button>
                  </div>

                  <Dropdown
                    trigger={
                      <button className="flex items-center gap-2 ml-1 transition-transform active:scale-95">
                        <Avatar
                          name={userData.username}
                          src={userData.avatar}
                          size="sm"
                          className="ring-2 ring-primary-500/20 shadow-lg"
                        />
                      </button>
                    }
                    align="end"
                    className="w-56"
                  >
                    <DropdownHeader>
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-900 dark:text-white">{userData.username}</span>
                        <span className="text-xs text-neutral-500 font-normal">Signed in</span>
                      </div>
                    </DropdownHeader>
                    <DropdownItem icon={<FiUser />} onClick={() => navigate('/profile')}>Profile</DropdownItem>
                    <DropdownItem icon={<FiSettings />} onClick={() => navigate('/settings')}>Settings</DropdownItem>
                    <DropdownDivider />
                    <DropdownItem icon={<FiLogOut />} danger onClick={handleLogout}>Log Out</DropdownItem>
                  </Dropdown>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">Log In</Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm" className="shadow-md shadow-primary-500/20">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <DarkModeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-[#0f172a] border-b border-neutral-200/70 dark:border-white/10 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "block px-4 py-3 rounded-xl text-base font-medium transition-colors",
                      isActive(link.path)
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                {isLoggedIn ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4">
                      <Avatar name={userData.username} src={userData.avatar} size="md" />
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{userData.username}</p>
                        <p className="text-sm text-neutral-500">Online</p>
                      </div>
                    </div>
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="secondary" className="w-full justify-start" icon={<FiUser />}>View Profile</Button>
                    </Link>
                    <Button variant="danger" className="w-full justify-start" icon={<FiLogOut />} onClick={handleLogout}>Log Out</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="secondary" className="w-full">Log In</Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="primary" className="w-full">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
