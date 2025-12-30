import React, { useState, useMemo } from 'react';

import { FiPlus, FiTrash2, FiMessageSquare, FiSearch } from 'react-icons/fi';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { cn } from '../../lib/utils';

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onShowUploader,
  onDeleteConversation,
  loading,
  userData,
}) {
  const [searchQuery, setSearchQuery] = useState('');


  const safeConversations = useMemo(() =>
    Array.isArray(conversations) ? conversations : [],
    [conversations]
  );

  // ... existing filtering logic ...

  // Filter and Group Conversations
  const groupedConversations = useMemo(() => {
    const filtered = safeConversations.filter(c =>
      (c.title || c.conversation_id || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    filtered.forEach(conv => {
      const date = new Date(conv.updated_at * 1000);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) groups['Today'].push(conv);
      else if (diffDays === 1) groups['Yesterday'].push(conv);
      else if (diffDays <= 7) groups['Previous 7 Days'].push(conv);
      else groups['Older'].push(conv);
    });

    return groups;
  }, [safeConversations, searchQuery]);

  return (
    <div className="w-80 flex flex-col h-full glass border-r border-white/20 dark:border-white/5 relative z-20">

      {/* Header Actions */}
      <div className="p-4 space-y-4">
        <Button
          variant="primary"
          className="w-full justify-between shadow-lg shadow-primary-500/20"
          onClick={onNewConversation}
          rightIcon={<FiPlus />}
        >
          New Chat
        </Button>
        <div className="flex gap-2">
          <Input
            placeholder="Search conversations..."
            size="sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 bg-white/50 dark:bg-black/20 border-white/20 focus:bg-white dark:focus:bg-black/40"
            leftIcon={<FiSearch className="text-neutral-500" />}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-6 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-3 opacity-50">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Loading chats...</p>
          </div>
        ) : (
          Object.entries(groupedConversations).map(([group, items]) => (
            items.length > 0 && (
              <div key={group}>
                <h3 className="px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 mt-2 sticky top-0 bg-white/40 dark:bg-black/40 backdrop-blur-md py-1.5 rounded-lg z-10 mx-2">
                  {group}
                </h3>
                <div className="space-y-1">
                  {items.map(conv => (
                    <button
                      key={conv.conversation_id}
                      onClick={() => onSelectConversation(conv.conversation_id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all duration-200 group relative border border-transparent",
                        activeConversationId === conv.conversation_id
                          ? "bg-primary-100 dark:bg-primary-500/10 shadow-sm border-primary-200 dark:border-primary-500/20"
                          : "hover:bg-white/40 dark:hover:bg-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="pr-8">
                        <p className={cn(
                          "text-sm font-medium truncate mb-0.5",
                          activeConversationId === conv.conversation_id
                            ? "text-primary-900 dark:text-primary-300"
                            : "text-neutral-800 dark:text-neutral-200"
                        )}>
                          {conv.title || 'New Conversation'}
                        </p>
                        <p className="text-xs text-neutral-500 truncate group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                          {conv.messages?.length > 0
                            ? conv.messages[conv.messages.length - 1].text
                            : 'No active messages'}
                        </p>
                      </div>

                      {/* Delete Action (Direct Button) */}
                      <div className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20",
                        activeConversationId === conv.conversation_id && "opacity-100"
                      )}>
                        <div
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-500 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.conversation_id);
                          }}
                          title="Delete Conversation"
                        >
                          <FiTrash2 size={16} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          ))
        )}

        {!loading && Object.values(groupedConversations).every(g => g.length === 0) && (
          <div className="text-center p-8 text-neutral-400 mt-10">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageSquare className="w-6 h-6 opacity-30" />
            </div>
            <p className="text-sm font-medium">No conversations yet</p>
            <p className="text-xs mt-1 opacity-70">Start a new chat to begin</p>
          </div>
        )}
      </div>

      {/* Footer Stats & Profile */}
      <div className="p-4 border-t border-white/20 dark:border-white/5 bg-white/30 dark:bg-black/20 backdrop-blur-lg">
        <div className="flex items-center justify-between gap-3">
          <a href="/profile" className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-500 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
              {(userData?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="truncate max-w-[120px]">{userData?.username || 'Guest'}</span>
          </a>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="opacity-80">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
