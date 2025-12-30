import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import DocumentUploader from "./DocumentUploader";
import {
  createConversation,
  fetchConversations,
  deleteConversation,
} from "./chatApi";
import { FiMenu, FiMessageSquare, FiTrendingUp, FiCpu } from "react-icons/fi";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../UI/Button";

export default function ChatContainer({ userData }) {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await fetchConversations();
        setConversations(Array.isArray(data) ? data : []);
        if (data && data.length > 0 && !activeConversationId) {
          setActiveConversationId(data[0].conversation_id);
        }
      } catch (error) {
        if (error.message?.includes('Authentication required') || error.message?.includes('401')) {
          toast.error("Please log in to access chat features.");
          return;
        }
        if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Network Error')) {
          toast.warning("Chat server is not running. Please start the RAG pipeline service.");
        } else {
          toast.error("Failed to load conversations");
        }
        console.error('Error loading conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleNewConversation = async (name = "") => {
    try {
      setLoading(true);
      const response = await createConversation(name);
      const newId = response.conversation_id;
      setActiveConversationId(newId);
      setConversations((prev) => [
        ...prev,
        {
          conversation_id: newId,
          updated_at: Math.floor(Date.now() / 1000),
          created_at: Math.floor(Date.now() / 1000),
          messages: [],
        },
      ]);

      if (newId.startsWith('local_')) {
        toast.warning("Chat server is offline. Conversation created locally only.");
      } else {
        toast.success("New conversation created");
      }

      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch (error) {
      toast.error("Failed to create conversation");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    setShowDeleteConfirm(conversationId);
  };

  const confirmDelete = async (conversationId) => {
    try {
      await deleteConversation(conversationId);
      setConversations((prev) =>
        prev.filter((conv) => conv.conversation_id !== conversationId)
      );
      if (activeConversationId === conversationId) {
        setActiveConversationId(
          conversations.length > 1
            ? conversations.find((c) => c.conversation_id !== conversationId)
              .conversation_id
            : null
        );
      }
      toast.success("Conversation deleted");
    } catch (error) {
      toast.error("Failed to delete conversation");
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleShowUploader = () => {
    setShowUploader(true);
  };

  const handleRefreshConversations = async () => {
    try {
      setLoading(true);
      const data = await fetchConversations();
      setConversations(data);
    } catch (error) {
      toast.error("Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full relative">

      {/* Mobile Sidebar Toggle Overlay */}
      <AnimatePresence>
        {sidebarOpen && window.innerWidth < 768 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className={`fixed md:relative z-30 h-full w-80 shrink-0 ${sidebarOpen ? "block" : "hidden md:block"}`}
        style={{ left: 0 }}
      >
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={() => handleNewConversation()}
          onShowUploader={handleShowUploader}
          onDeleteConversation={handleDeleteConversation}
          loading={loading}
          onRefreshConversations={handleRefreshConversations}
          userData={userData}
        />
      </motion.div>

      {/* Toggle Button (Desktop/Mobile) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed z-20 bottom-6 left-6 md:absolute md:bottom-auto md:top-4 md:left-4 p-3 rounded-full shadow-lg bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:scale-105 transition-all ${sidebarOpen ? 'md:hidden' : 'block'}`}
      >
        <FiMenu size={20} />
      </button>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {activeConversationId ? (
          <ChatWindow
            conversationId={activeConversationId}
            userData={userData}
            onShowUploader={handleShowUploader}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            {/* ... preserved content ... */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl w-full"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-teal-600 rounded-3xl mx-auto shadow-2xl shadow-primary-500/30 flex items-center justify-center mb-8 rotate-3 transform hover:rotate-6 transition-transform">
                <span className="text-4xl text-white font-bold">E</span>
              </div>

              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 mb-4">
                Welcome to EngageMind
              </h1>
              <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-10 max-w-lg mx-auto leading-relaxed">
                Your AI-powered workspace for intelligent conversations, document analysis, and code generation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 px-4">
                <QuickAction title="New Chat" icon={<FiMessageSquare />} onClick={() => handleNewConversation()} />
                <QuickAction title="Analyze Data" icon={<FiTrendingUp />} onClick={() => handleShowUploader()} delay={0.1} />
                <QuickAction title="Code Assist" icon={<FiCpu />} onClick={() => toast.info("Feature coming soon")} delay={0.2} />
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Uploader & Confirm Modal logic stays similar... */}
      {showUploader && (
        <DocumentUploader onClose={() => setShowUploader(false)} onUploadSuccess={() => { toast.success("Uploaded!"); setShowUploader(false); }} />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 w-full max-w-md rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <FiTrendingUp className="rotate-180" size={24} /> {/* Using existing icon import as trash placeholder or just basic */}
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Delete Chat?</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => confirmDelete(showDeleteConfirm)}>Delete Permanently</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const QuickAction = ({ title, icon, onClick, delay = 0 }) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    onClick={onClick}
    className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-xl transition-all group"
  >
    <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center text-neutral-600 dark:text-neutral-300 mb-3 group-hover:scale-110 transition-transform">
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <span className="font-medium text-neutral-700 dark:text-neutral-200">{title}</span>
  </motion.button>
);
