import React from 'react';
import { Link } from 'react-router-dom';
import { FiTwitter, FiGithub, FiLinkedin, FiInstagram } from 'react-icons/fi';
import Button from './UI/Button';
import Input from './UI/Input';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200/70 dark:border-white/10 bg-white dark:bg-[#0f172a] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white font-bold text-lg shadow-brand">
                E
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
                EngageMind
              </span>
            </Link>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs">
              Empowering developer conversations with advanced AI, seamless integration, and premium design.
            </p>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="ghost" icon className="p-2"><FiTwitter className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" icon className="p-2"><FiGithub className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" icon className="p-2"><FiLinkedin className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" icon className="p-2"><FiInstagram className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</Link></li>
              <li><Link to="/chat" className="text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Chat Interface</Link></li>
              <li><Link to="/component-showcase" className="text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">UI Library</Link></li>
              <li><Link to="/pricing" className="text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3 text-sm">
              <li><a href="/" className="text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Documentation</a></li>
              <li><a href="/" className="text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">API Reference</a></li>
              <li><a href="/" className="text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Community</a></li>
              <li><a href="/" className="text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
              Stay Updated
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Subscribe to our newsletter for the latest AI updates.
            </p>
            <div className="flex flex-col gap-3">
              <Input placeholder="Enter your email" className="bg-white dark:bg-neutral-800" />
              <Button variant="primary" className="w-full">Subscribe</Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            &copy; {new Date().getFullYear()} EngageMind AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-neutral-500">
            <a href="/" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="/" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Terms of Service</a>
            <a href="/" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
