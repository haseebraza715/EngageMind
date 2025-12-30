// src/components/Chat/ChatList.jsx
import React, { useEffect, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { fetchConversations } from './chatApi';

export default function ChatList({ onSelectConversation, activeConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConversations();
      setConversations(data || []);
    } catch (err) {
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    // Removed polling for better UX; use manual refresh instead
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-white flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recent Chats</h3>
        <button
          onClick={loadConversations}
          disabled={loading}
          className={`p-2 rounded-full transition-colors duration-200 ${
            loading ? 'text-gray-400 cursor-not-allowed' : 'text-teal-600 hover:bg-teal-100'
          }`}
          title="Refresh Conversations"
        >
          <FiRefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading && !conversations.length && (
          <div className="p-6 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
            <span className="mt-3 block text-sm">Loading conversations...</span>
          </div>
        )}
        {error && (
          <div className="p-4 text-center text-red-600">
            <p className="text-sm">{error}</p>
            <button
              onClick={loadConversations}
              className="mt-2 text-teal-600 hover:underline text-sm"
            >
              Retry
            </button>
          </div>
        )}
        {!loading && !error && conversations.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">No conversations yet.</p>
            <p className="text-sm mt-1">Start a new one to begin chatting!</p>
          </div>
        )}
        {!loading && !error && conversations.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {conversations.map((conv) => (
              <li
                key={conv.conversation_id}
                onClick={() => onSelectConversation(conv.conversation_id)}
                className={`cursor-pointer p-4 transition-all duration-200 hover:bg-gray-50 ${
                  conv.conversation_id === activeConversationId
                    ? 'bg-teal-50 border-l-4 border-teal-500'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-medium text-gray-800 truncate text-sm"
                      title={conv.title || conv.conversation_id} // Show title, fallback to ID
                    >
                      {conv.title || conv.conversation_id || 'New Conversation'}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-1">
                      {conv.messages?.length > 0
                        ? conv.messages[conv.messages.length - 1].text.slice(0, 30) + '...'
                        : 'No messages yet'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 ml-4 shrink-0">
                    {formatDate(conv.updated_at)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
        <span className="text-xs text-gray-600 font-medium">
          {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
        </span>
      </div>
    </div>
  );
}