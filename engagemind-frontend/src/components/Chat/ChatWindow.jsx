import React, { useEffect, useState, useRef, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom'; // Unused
import ReactMarkdown from 'react-markdown';
import { FiRefreshCw, FiSend, FiPaperclip, FiCopy, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchConversationMessages, sendFineTuneMessage, sendMessage } from './chatApi';
import Avatar from '../UI/Avatar';
import Button from '../UI/Button';
import { Textarea } from '../UI/Input';
import Tooltip from '../UI/Tooltip';
import { cn } from '../../lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ChatWindow({
  conversationId,
  userData,
  onShowUploader,
  chatMode = 'rag',
  onModeChange,
  fineTuneAvailable = false,
  fineTuneStatusLoading = false,
  fineTuneModelStatus = null,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const convo = await fetchConversationMessages(conversationId);
      setMessages(convo.messages || []);
    } catch (err) {
      console.error('Failed to load. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      sender: 'user',
      text: input.trim(),
      timestamp: Math.floor(Date.now() / 1000),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const sendFn = chatMode === 'gpt2-lora' ? sendFineTuneMessage : sendMessage;
      const response = await sendFn(conversationId, userMessage.text);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: response.answer,
          timestamp: Math.floor(Date.now() / 1000),
        },
      ]);
    } catch (err) {
      const fallbackMessage = err?.message || "I'm sorry, I couldn't reach the server. Please check your connection.";
      // Revert optimism if needed or show error
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: fallbackMessage,
        timestamp: Math.floor(Date.now() / 1000),
        error: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const gpt2Disabled = !fineTuneAvailable || fineTuneStatusLoading;
  const gpt2Tooltip = fineTuneStatusLoading
    ? 'Checking GPT-2 LoRA availability...'
    : (fineTuneModelStatus?.reason || 'Train a GPT-2 LoRA adapter to enable this mode.');

  const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <button
        onClick={handleCopy}
        className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
        title="Copy to clipboard"
      >
        {copied ? <FiCheck size={14} className="text-green-400" /> : <FiCopy size={14} />}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#f7f8fb] to-white dark:from-[#0b1220] dark:to-[#0f172a] relative">

      {/* Header */}
      <header className="sticky top-0 z-10 px-4 md:px-6 py-3 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-lg border-b border-neutral-200/60 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 p-0 border border-neutral-200/60 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-white/70 dark:hover:bg-white/10"
            >
              <FiArrowLeft size={16} />
            </Button>
          </Link>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            E
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 dark:text-white text-sm">EngageMind</h2>
            <span className="text-[10px] text-primary-600 dark:text-primary-400 font-medium">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 p-1 text-[11px] font-semibold">
            <button
              onClick={() => onModeChange && onModeChange('rag')}
              className={cn(
                "px-2.5 py-1 rounded-full transition-colors",
                chatMode === 'rag'
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
              )}
            >
              RAG
            </button>
            <Tooltip content={gpt2Disabled ? gpt2Tooltip : 'Use your GPT-2 LoRA adapter'}>
              <span>
                <button
                  onClick={() => onModeChange && onModeChange('gpt2-lora')}
                  disabled={gpt2Disabled}
                  className={cn(
                    "px-2.5 py-1 rounded-full transition-colors",
                    chatMode === 'gpt2-lora'
                      ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200",
                    gpt2Disabled && "opacity-60 cursor-not-allowed"
                  )}
                >
                  GPT-2 LoRA
                </button>
              </span>
            </Tooltip>
          </div>
          <Tooltip content="Refresh">
            <Button size="sm" variant="ghost" icon onClick={loadMessages} loading={loading}>
              <FiRefreshCw size={16} />
            </Button>
          </Tooltip>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 scroll-smooth">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-[70%] text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-teal-400 flex items-center justify-center text-white text-3xl shadow-lg ring-4 ring-white dark:ring-neutral-800">
              E
            </div>
            <h3 className="text-2xl font-bold text-neutral-800 dark:text-white">Welcome back, {userData?.username || 'Guest'}!</h3>
            <p className="max-w-xs text-sm font-medium text-neutral-600 dark:text-neutral-400 leading-relaxed">I'm ready to help you with code, analysis, or creative writing. Just type below.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-4xl mx-auto",
                msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 mt-1">
                {msg.sender === 'user' ? (
                  <Avatar name={userData?.username || 'You'} src={userData?.avatar} size="sm" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-primary-500/20">
                    AI
                  </div>
                )}
              </div>

              {/* Bubble */}
              <div className={cn(
                "relative p-4 rounded-2xl max-w-[85%] sm:max-w-[75%]",
                msg.sender === 'user'
                  ? "bg-gradient-to-br from-primary-500 to-teal-600 text-white rounded-tr-sm shadow-md shadow-primary-500/20"
                  : "bg-white dark:bg-neutral-800/80 border border-neutral-100 dark:border-neutral-700/40 text-neutral-700 dark:text-neutral-200 rounded-tl-sm shadow-sm"
              )}>
                {msg.sender === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <div className="relative group rounded-lg overflow-hidden my-4">
                              <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={String(children).replace(/\n$/, '')} />
                              </div>
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ margin: 0, borderRadius: 0 }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className={cn("bg-neutral-100 dark:bg-neutral-900 px-1 py-0.5 rounded font-mono text-sm text-primary-600 dark:text-primary-400", className)} {...props}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                    {msg.error && <p className="text-red-500 text-xs mt-2 italic">Error sending message</p>}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">AI</div>
            <div className="bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/50 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center h-12">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce delay-100" />
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce delay-200" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Redesigned for Premium Feel */}
      <div className="shrink-0 px-4 pb-6 pt-2 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0b1220] dark:via-[#0b1220] dark:to-transparent z-10">
        <div className="max-w-5xl mx-auto">
          {/* Main Input Container */}
          <div className="relative group rounded-3xl bg-neutral-50/50 dark:bg-[#1a2333] shadow-xl shadow-neutral-100/50 dark:shadow-black/20 flex items-end gap-2 p-3 transition-all duration-300 hover:shadow-2xl hover:bg-white dark:hover:bg-[#1f2b3e]">

            {/* Attach button */}
            <button
              onClick={onShowUploader}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:text-neutral-500 dark:hover:text-primary-300 dark:hover:bg-primary-900/20 transition-all duration-200"
              title="Upload contents"
            >
              <FiPaperclip size={20} />
            </button>

            {/* Text input */}
            <div className="flex-1 min-w-0 py-2">
              <Textarea
                minRows={1}
                maxRows={8}
                autoResize
                placeholder="Message EngageMind..."
                className="!border-0 !border-transparent !ring-0 !ring-offset-0 !shadow-none !outline-none !bg-transparent focus:!border-transparent focus:!ring-0 focus:!ring-offset-0 focus:!shadow-none focus:!outline-none p-0 text-base text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-none w-full leading-relaxed max-h-[200px]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            </div>

            {/* Send button */}
            <button
              disabled={!input.trim() || isTyping}
              onClick={handleSend}
              className={cn(
                "shrink-0 w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 shadow-sm",
                input.trim() && !isTyping
                  ? "bg-primary-600 text-white hover:bg-primary-500 hover:scale-105 hover:shadow-xl hover:shadow-primary-500/30"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 cursor-not-allowed shadow-none"
              )}
            >
              {isTyping ? (
                <FiRefreshCw size={18} className="animate-spin" />
              ) : (
                <FiSend size={18} className={cn("ml-0.5", input.trim() && "text-white")} />
              )}
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-[11px] text-neutral-400 dark:text-neutral-600 mt-2.5 font-medium tracking-wide">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
