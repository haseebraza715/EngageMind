import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiFileText, FiLock, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import Footer from '../components/Footer';
import Button from '../components/UI/Button';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('token'));
  }, []);

  const workItems = [
    {
      title: 'Authenticated chat',
      description: 'Users register, verify their email, log in, and return to saved conversations.',
      icon: <FiLock size={20} />,
    },
    {
      title: 'Document-grounded answers',
      description: 'Uploaded files are indexed for RAG, so the assistant can answer from user material.',
      icon: <FiFileText size={20} />,
    },
    {
      title: 'GPT-2 LoRA training',
      description: 'A background worker trains a per-user adapter and reports task status back to the UI.',
      icon: <FiRefreshCw size={20} />,
    },
    {
      title: 'Two chat modes',
      description: 'RAG is used for grounded document QA. GPT-2 LoRA mode uses the saved adapter.',
      icon: <FiMessageSquare size={20} />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8fb] dark:bg-[#0b1220] transition-colors duration-300">
      <main className="flex-1">
        <section className="pt-28 pb-16 md:pt-36 md:pb-20">
          <div className="container-custom grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center rounded-full border border-primary-200 dark:border-primary-800 bg-white/70 dark:bg-white/5 px-4 py-2 text-sm font-semibold text-primary-700 dark:text-primary-300">
                Thesis prototype
              </div>

              <div className="space-y-5">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-neutral-950 dark:text-white">
                  EngageMind
                </h1>
                <p className="max-w-2xl text-lg md:text-xl leading-relaxed text-neutral-700 dark:text-neutral-300">
                  A working chat application that combines authentication, persistent conversations,
                  document upload, RAG, and GPT-2 LoRA fine-tuning.
                </p>
                <p className="max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-400">
                  The main goal is simple: let a user upload their own material, ask grounded
                  questions, and then compare that flow with a trained GPT-2 LoRA chat mode.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={isAuthenticated ? '/chat' : '/register'}>
                  <Button size="lg" variant="primary" className="w-full sm:w-auto h-12 px-6" rightIcon={<FiArrowRight />}>
                    {isAuthenticated ? 'Open Chat' : 'Create Account'}
                  </Button>
                </Link>
                {isAuthenticated ? (
                  <Link to="/profile">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6">
                      View Profile
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6">
                      Log In
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#101827] shadow-xl shadow-neutral-200/50 dark:shadow-black/20 overflow-hidden">
              <div className="border-b border-neutral-200 dark:border-white/10 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">Demo conversation</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">RAG mode with uploaded notes</p>
                </div>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-xs font-semibold">
                  Local app
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-600 to-teal-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    AI
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-neutral-100 dark:border-white/10 bg-neutral-50 dark:bg-white/5 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200">
                    Upload a document and ask what the system should remember from it.
                  </div>
                </div>

                <div className="flex gap-3 flex-row-reverse">
                  <div className="h-8 w-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center shrink-0">
                    HR
                  </div>
                  <div className="rounded-2xl rounded-tr-sm bg-primary-600 px-4 py-3 text-sm text-white">
                    Summarize the architecture in this thesis document.
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-600 to-teal-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    AI
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-neutral-100 dark:border-white/10 bg-neutral-50 dark:bg-white/5 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200">
                    EngageMind uses a React frontend, Express authentication, Flask RAG and fine-tune APIs,
                    MongoDB, FAISS, Redis, Celery, PyTorch, and PEFT.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#101827] p-5 shadow-sm"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h2 className="text-base font-bold text-neutral-950 dark:text-white mb-2">{item.title}</h2>
                  <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
