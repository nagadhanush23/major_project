import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaRobot, FaUser, FaTrash, FaCopy, FaCheck } from 'react-icons/fa';
import { aiAPI } from '../../services/api';
import '../dashboard/DashboardPage.css';

const AIChatPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI financial assistant. I can help you with:\n\n• Understanding your spending patterns\n• Budget planning advice\n• Investment recommendations\n• Savings strategies\n• Financial health analysis\n\nWhat would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
    }
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I\'m your AI financial assistant. I can help you with:\n\n• Understanding your spending patterns\n• Budget planning advice\n• Investment recommendations\n• Savings strategies\n• Financial health analysis\n\nWhat would you like to know?',
          timestamp: new Date()
        }
      ]);
      setConversationHistory([]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setConversationHistory(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiAPI.chatAssistant(input.trim(), conversationHistory);

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        suggestions: response.data.suggestions || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        suggestions: [],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i, arr) => {
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          return `<div class="chat-bullet">${line}</div>`;
        }
        // Headers
        if (line.trim().startsWith('###')) {
          return `<h3 class="chat-heading">${line.replace(/###\s*/, '')}</h3>`;
        }
        if (line.trim().startsWith('##')) {
          return `<h2 class="chat-heading">${line.replace(/##\s*/, '')}</h2>`;
        }
        if (line.trim().startsWith('#')) {
          return `<h1 class="chat-heading">${line.replace(/#\s*/, '')}</h1>`;
        }
        return line || '<br />';
      })
      .join('\n');
  };

  // Group messages by date
  const groupedMessages = [];
  let currentDate = null;

  messages.forEach((msg, index) => {
    const msgDate = formatDate(msg.timestamp);
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ type: 'date', content: msgDate });
    }
    groupedMessages.push({ ...msg, index });
  });

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>AI Financial Assistant</h1>
          <p className="page-subtitle">Get instant answers to your financial questions</p>
        </div>
        {messages.length > 1 && (
          <button className="btn-secondary" onClick={clearChat} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaTrash /> Clear Chat
          </button>
        )}
      </div>

      <div className="chat-container">
        <div className="chat-messages" ref={messagesContainerRef}>
          {groupedMessages.map((item, idx) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${idx}`} className="chat-date-divider">
                  <span>{item.content}</span>
                </div>
              );
            }

            const msg = item;
            const isUser = msg.role === 'user';

            return (
              <div key={msg.index} className={`chat-message ${msg.role}`}>
                <div className="chat-avatar">
                  {isUser ? <FaUser /> : <FaRobot />}
                </div>
                <div className="chat-content-wrapper">
                  <div className="chat-content">
                    <div
                      className="chat-text"
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="chat-suggestions">
                        {msg.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            className="suggestion-btn"
                            onClick={() => setInput(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="chat-message-footer">
                    <span className="chat-timestamp">{formatTime(msg.timestamp)}</span>
                    {!isUser && (
                      <button
                        className="chat-copy-btn"
                        onClick={() => copyToClipboard(msg.content, msg.index)}
                        title="Copy message"
                      >
                        {copiedIndex === msg.index ? <FaCheck /> : <FaCopy />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="chat-message assistant">
              <div className="chat-avatar">
                <FaRobot />
              </div>
              <div className="chat-content-wrapper">
                <div className="chat-content">
                  <div className="chat-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-form">
          <div className="chat-input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your finances..."
              className="chat-input"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button type="submit" className="chat-send-btn" disabled={loading || !input.trim()}>
              <FaPaperPlane />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIChatPage;


