import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import Footer from '../components/Footer';
import Button from '../components/UI/Button';
import Accordion from '../components/UI/Accordion';
import Input from '../components/UI/Input';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const features = [
    {
      title: 'Context-Aware Conversations',
      description: 'Our AI remembers and builds upon previous interactions for more natural dialogue.',
      icon: '💬',
    },
    {
      title: 'Enterprise-Grade Security',
      description: 'End-to-end encryption and strict data privacy protocols keep your conversations safe.',
      icon: '🔒',
    },
    {
      title: 'Adaptive Learning',
      description: 'EngageMind evolves with each interaction to better understand your specific needs.',
      icon: '🧠',
    },
    {
      title: 'Multi-Modal Support',
      description: 'Seamlessly switch between text, code, and document analysis in one unified interface.',
      icon: '📄',
    },
    {
      title: 'Real-Time Collaboration',
      description: 'Share insights and collaborate on AI-generated content with your team instantly.',
      icon: '👥',
    },
    {
      title: 'Custom Knowledge Base',
      description: 'Train the AI on your own documents to get highly specific and relevant answers.',
      icon: '📚',
    },
  ];

  const faqs = [
    { title: 'How secure is my data?', content: 'We use industry-standard AES-256 encryption for all data at rest and in transit. Your conversations are private and only accessible by you.' },
    { title: 'Can I upload my own documents?', content: 'Yes! You can upload PDF, DOCX, and TXT files. Our AI analyzes them to provide context-aware answers based on your specific content.' },
    { title: 'Is there a free trial?', content: 'Absolutely. New users get a 14-day free trial of our Pro plan with full access to all features, no credit card required.' },
    { title: 'Do you offer an API?', content: 'Yes, we offer a robust API for enterprise customers who want to integrate EngageMind into their own applications.' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8fb] dark:bg-[#0b1220] transition-colors duration-300">

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-20 dark:opacity-10 pointer-events-none" />

        <div className="container-custom relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20"
          >
            <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
              <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl/tight lg:text-7xl/tight font-bold tracking-tight text-neutral-900 dark:text-white">
                AI that{' '}
                <span className="bg-gradient-to-r from-primary-600 via-teal-500 to-accent-500 dark:from-primary-400 dark:via-teal-400 dark:to-accent-400 bg-clip-text text-transparent">
                  thinks
                </span>
                <br />like you do.
              </motion.h1>

              <motion.p variants={itemVariants} className="text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Experience the next generation of conversational AI. Context-aware, secure, and built for productivity.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to={isAuthenticated ? '/chat' : '/register'}>
                  <Button size="lg" variant="primary" className="w-full sm:w-auto text-lg h-14 px-8 shadow-lg shadow-primary-500/25" rightIcon={<FiArrowRight />}>
                    {isAuthenticated ? 'Continue Chatting' : 'Start Free Trial'}
                  </Button>
                </Link>
                <Link to="/component-showcase">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8">
                    Explore Features
                  </Button>
                </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-sm text-neutral-500">
                <div className="flex items-center gap-2"><FiCheckCircle className="text-emerald-500" /> No credit card</div>
                <div className="flex items-center gap-2"><FiCheckCircle className="text-emerald-500" /> 14-day trial</div>
                <div className="flex items-center gap-2"><FiCheckCircle className="text-emerald-500" /> Cancel anytime</div>
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="lg:w-1/2 relative perspective-1000 group">
              {/* Backglow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-600 via-teal-500 to-accent-500 rounded-2xl blur-3xl opacity-20 -z-10 group-hover:opacity-30 transition-opacity duration-500" />

              {/* Main Mock Window */}
              <div className="relative z-10 glass-panel p-2 rounded-2xl shadow-2xl dark:shadow-primary-900/20 transform rotate-y-6 rotate-x-3 hover:rotate-0 transition-transform duration-700 ease-out border border-white/50 dark:border-white/10">
                <div className="bg-white dark:bg-[#0A0A0A] rounded-xl overflow-hidden aspect-[4/3] relative flex shadow-inner">

                  {/* Mock Sidebar */}
                  <div className="w-20 lg:w-48 bg-neutral-50 dark:bg-[#121212] border-r border-neutral-100 dark:border-neutral-800 p-3 flex flex-col gap-3">
                    <div className="h-8 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-md mb-4 animate-pulse hidden lg:block" />
                    <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-md mb-4 lg:hidden" />

                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-10 w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center gap-2 px-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 shrink-0" />
                        <div className="h-2 w-16 bg-neutral-100 dark:bg-neutral-800 rounded hidden lg:block" />
                      </div>
                    ))}
                  </div>

                  {/* Mock Chat Area */}
                  <div className="flex-1 relative flex flex-col p-4">
                    <div className="absolute inset-0 mesh-gradient opacity-10" />

                    {/* Messages */}
                    <div className="flex-1 space-y-4 pt-8">
                      {/* AI Message */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-primary-500/20">AI</div>
                        <div className="bg-white dark:bg-[#18181b] p-3 rounded-2xl rounded-tl-none border border-neutral-100 dark:border-neutral-800 shadow-sm max-w-[85%]">
                          <div className="h-2 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
                          <div className="h-2 w-48 bg-neutral-100 dark:bg-neutral-800 rounded" />
                        </div>
                      </div>

                      {/* User Message */}
                      <div className="flex gap-3 flex-row-reverse">
                        <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                        <div className="bg-primary-600 p-3 rounded-2xl rounded-tr-none shadow-md shadow-primary-500/10 text-white max-w-[85%]">
                          <div className="text-xs">Analyze this quarterly report 📊</div>
                        </div>
                      </div>

                      {/* AI Response (Typing) */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-teal-500 opacity-80" />
                        <div className="bg-white dark:bg-[#18181b] p-3 rounded-2xl rounded-tl-none border border-neutral-100 dark:border-neutral-800 shadow-sm flex gap-1 items-center h-8">
                          <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-100" />
                          <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>

                    {/* Floating Input Capsule */}
                    <div className="mt-auto relative z-10 px-4">
                      <div className="h-10 w-full bg-white dark:bg-[#18181b] rounded-full shadow-lg border border-neutral-100 dark:border-neutral-800 flex items-center px-4 justify-between">
                        <div className="h-2 w-24 bg-neutral-100 dark:bg-neutral-800 rounded" />
                        <div className="w-6 h-6 rounded-full bg-primary-500 shadow-md shadow-primary-500/30" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-10 border-y border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
        <div className="container-custom text-center">
          <p className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-8">Trusted by industry leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {['Acme Corp', 'GlobalTech', 'Nebula', 'Circle', 'FoxRun'].map(brand => (
              <span key={brand} className="text-xl font-bold font-display text-neutral-800 dark:text-neutral-200">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gradient-to-b from-white to-neutral-50 dark:from-[#0b1220] dark:to-[#0f172a]">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-primary-600 via-teal-500 to-accent-500 dark:from-primary-400 dark:via-teal-400 dark:to-accent-400 bg-clip-text text-transparent">
                excel
              </span>
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Powerful features designed to enhance your cognitive capabilities and streamline your digital interactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative p-6 rounded-2xl bg-white dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800/80 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300"
              >
                <div className="flex flex-col gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-teal-100 dark:from-primary-900/40 dark:to-teal-900/40 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-900/20">
        <div className="container-custom max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-neutral-900 dark:text-white">Frequently Asked Questions</h2>
          <Accordion items={faqs} variant="default" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container-custom">
          <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 text-center px-6 py-20 lg:p-20 shadow-2xl shadow-primary-500/10 border border-primary-100/60 dark:border-primary-900/20">
            <div className="absolute inset-0 mesh-gradient opacity-10 mix-blend-normal" />
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">Ready to transform your workflow?</h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">Join thousands of developers and professionals using EngageMind to power their daily conversations.</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Input placeholder="Enter your email" className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-primary-500/20 focus:border-primary-500 h-14 rounded-xl" />
                <Button className="h-14 px-8 bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-primary-500/25 text-lg border-none">
                  Get Started
                </Button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Free 14-day trial • Cancel anytime • No credit card</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
