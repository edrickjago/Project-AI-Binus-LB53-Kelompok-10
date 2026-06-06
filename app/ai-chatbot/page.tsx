'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function AiChatbotPage() {
  const { language, activeTransactions } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isId = language === 'id';

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmedText = textToSend.trim();
    if (!trimmedText) return;

    setError('');
    const userMsg: Message = {
      id: Math.random().toString(36).substring(2),
      role: 'user',
      content: trimmedText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          transactions: activeTransactions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isId ? 'Terjadi kesalahan sistem' : 'System error occurred'));
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2),
          role: 'assistant',
          content: data.reply,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      setError(err.message || (isId ? 'Gagal memproses pesan.' : 'Failed to process message.'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const clearChat = () => {
    if (window.confirm(isId ? 'Hapus seluruh riwayat obrolan?' : 'Clear all chat history?')) {
      setMessages([]);
      setError('');
    }
  };

  // Helper secure inline and block markdown parser
  const parseInlineMarkdown = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="chat-code">$1</code>')
      .replace(/(🚨|⚠️|❌|✅|💡)/g, '<span class="chat-icon-highlight">$1</span>');
  };

  const renderMarkdown = (text: string) => {
    if (!text) return '';

    const lines = text.split('\n');
    const resultHtml: string[] = [];
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    const flushList = () => {
      if (inList) {
        resultHtml.push(listType === 'ol' ? '</ol>' : '</ul>');
        inList = false;
        listType = null;
      }
    };

    const flushTable = () => {
      if (inTable) {
        const tableHtml = `
          <div class="chat-table-wrapper">
            <table class="chat-table">
              <thead>
                <tr>
                  ${tableHeaders.map((h) => `<th>${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${tableRows
                  .map(
                    (row) => `
                  <tr>
                    ${row.map((cell) => `<td>${cell}</td>`).join('')}
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
        resultHtml.push(tableHtml);
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Table parsing
      if (line.startsWith('|') && line.endsWith('|')) {
        flushList();
        const cells = line
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
          // Skip the separator row if it exists next
          if (i + 1 < lines.length && lines[i + 1].trim().includes('-')) {
            i++;
          }
        } else {
          tableRows.push(cells);
        }
        continue;
      } else {
        flushTable();
      }

      // List parsing
      const ulMatch = line.match(/^[\-\*]\s+(.*)/);
      const olMatch = line.match(/^\d+\.\s+(.*)/);

      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          flushList();
          resultHtml.push('<ul class="chat-list">');
          inList = true;
          listType = 'ul';
        }
        resultHtml.push(`<li>${parseInlineMarkdown(ulMatch[1])}</li>`);
        continue;
      } else if (olMatch) {
        if (!inList || listType !== 'ol') {
          flushList();
          resultHtml.push('<ol class="chat-list">');
          inList = true;
          listType = 'ol';
        }
        resultHtml.push(`<li>${parseInlineMarkdown(olMatch[1])}</li>`);
        continue;
      } else {
        flushList();
      }

      // Headings & paragraphs
      if (line.startsWith('### ')) {
        resultHtml.push(`<h4 class="chat-h4">${parseInlineMarkdown(line.slice(4))}</h4>`);
      } else if (line.startsWith('## ')) {
        resultHtml.push(`<h3 class="chat-h3">${parseInlineMarkdown(line.slice(3))}</h3>`);
      } else if (line.startsWith('# ')) {
        resultHtml.push(`<h2 class="chat-h2">${parseInlineMarkdown(line.slice(2))}</h2>`);
      } else if (line === '') {
        resultHtml.push('<div class="chat-space"></div>');
      } else {
        resultHtml.push(`<p class="chat-p">${parseInlineMarkdown(line)}</p>`);
      }
    }

    flushList();
    flushTable();

    return resultHtml.join('');
  };

  const presetPrompts = [
    {
      icon: '🔍',
      title: isId ? 'Mulai Deteksi Fraud' : 'Start Fraud Detection',
      desc: isId
        ? 'Audit mendalam pada cashflow untuk menemukan transaksi janggal/penipuan.'
        : 'Deep audit on cashflow to find irregular transactions or leaks.',
      prompt: isId
        ? 'Lakukan audit menyeluruh pada transaksi saya saat ini dan temukan jika ada indikasi fraud atau transaksi mencurigakan.'
        : 'Conduct a thorough audit on my transactions and find if there are any indications of fraud or suspicious activities.',
    },
    {
      icon: '❓',
      title: isId ? 'Cari Transaksi Gak Jelas' : 'Find Irregular Notes',
      desc: isId
        ? 'Cari deskripsi kosong, aneh, atau kategori yang tidak cocok.'
        : 'Find empty, weird notes or category mismatches.',
      prompt: isId
        ? 'Periksa apakah ada transaksi yang deskripsinya tidak jelas (kosong/karakter acak) atau kategorinya tidak cocok dengan catatannya.'
        : 'Check if there are transactions with unclear descriptions (empty/random characters) or mismatching categories.',
    },
    {
      icon: '🔁',
      title: isId ? 'Cek Transaksi Duplikat' : 'Detect Duplicate Input',
      desc: isId
        ? 'Deteksi input ganda yang tidak sengaja pada catatan keuangan.'
        : 'Find double-entry or accidental duplicate inputs.',
      prompt: isId
        ? 'Apakah ada transaksi duplikat atau input ganda yang berulang dalam catatan keuangan saya? Tolong daftarkan.'
        : 'Are there duplicate transactions or accidental double-entries in my record? Please list them.',
    },
    {
      icon: '📊',
      title: isId ? 'Analisis Kesehatan Arus Kas' : 'Analyze Cash Flow Health',
      desc: isId
        ? 'Berikan evaluasi keuangan dan saran taktis penghematan.'
        : 'Get a financial health analysis and saving advice.',
      prompt: isId
        ? 'Berikan evaluasi komprehensif mengenai kesehatan arus kas saya saat ini dan saran praktis untuk menghemat pengeluaran.'
        : 'Provide a comprehensive evaluation of my current cashflow health and practical savings recommendations.',
    },
  ];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .chat-p { margin-bottom: 8px; line-height: 1.6; font-size: 0.88rem; }
        .chat-list { margin-left: 20px; margin-bottom: 12px; font-size: 0.88rem; }
        .chat-list li { margin-bottom: 4px; }
        .chat-code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.82rem; border: 1px solid rgba(255,255,255,0.06); color: var(--accent-warning); }
        .chat-table-wrapper { overflow-x: auto; margin: 14px 0; border-radius: 12px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.25); }
        .chat-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .chat-table th { background: rgba(255,255,255,0.04); padding: 10px 12px; border-bottom: 1px solid var(--border-color); font-weight: 600; text-align: left; color: var(--text-secondary); }
        .chat-table td { padding: 10px 12px; border-bottom: 1px solid var(--border-color); color: var(--text-primary); }
        .chat-table tr:last-child td { border-bottom: none; }
        .chat-table tr:hover { background: rgba(255,255,255,0.02); }
        .chat-h3 { font-size: 1.05rem; font-weight: 600; margin-top: 16px; margin-bottom: 8px; color: var(--text-primary); }
        .chat-h4 { font-size: 0.95rem; font-weight: 600; margin-top: 12px; margin-bottom: 6px; color: var(--text-secondary); }
        .chat-icon-highlight { font-size: 1.1em; vertical-align: middle; }
        .chat-space { height: 10px; }

        /* Custom glow scrolling design */
        .chatbot-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 160px);
          position: relative;
        }

        .messages-list {
          flex: 1;
          overflow-y: auto;
          padding: 10px 4px 30px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .msg-bubble {
          max-width: 82%;
          padding: 14px 18px;
          border-radius: 18px;
          animation: bubble-fade-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: var(--glass-border);
          box-shadow: var(--shadow-md);
        }

        @keyframes bubble-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .msg-user {
          align-self: flex-end;
          background: var(--accent-secondary-dim);
          border-color: rgba(99, 102, 241, 0.25);
          color: var(--text-primary);
          border-bottom-right-radius: 4px;
        }

        .msg-assistant {
          align-self: flex-start;
          background: var(--bg-card);
          border-color: rgba(16, 185, 129, 0.2);
          box-shadow: 0 4px 16px var(--accent-primary-dim);
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
        }

        /* Pulsing thinking indicator */
        .typing-indicator {
          display: flex;
          gap: 5px;
          padding: 14px 20px;
          border-radius: 16px;
          background: var(--bg-card);
          border: var(--glass-border);
          width: fit-content;
          border-bottom-left-radius: 4px;
          box-shadow: var(--shadow-md);
          margin-bottom: 10px;
        }

        .typing-indicator span {
          width: 7px;
          height: 7px;
          background: var(--accent-primary);
          border-radius: 50%;
          animation: typing-pulse 1.4s infinite ease-in-out both;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typing-pulse {
          0%, 80%, 100% { transform: scale(0.3); opacity: 0.3; }
          40% { transform: scale(1.1); opacity: 1; }
        }

        /* Scrollbar aesthetics */
        .messages-list::-webkit-scrollbar {
          width: 6px;
        }
        .messages-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .messages-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
        }
        .messages-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.16);
        }
      `,
        }}
      />

      <div className="page-header animate-slide-up">
        <div>
          <h1 className="page-title">💬 {isId ? 'Asisten AI & Deteksi Fraud' : 'AI Chatbot & Fraud Detector'}</h1>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isId ? 'Audit transaksi dan deteksi fraud secara instan' : 'Audit transactions and spot fraud instantly'}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '20px',
                background: activeTransactions.length > 0 ? 'var(--accent-primary-dim)' : 'var(--accent-warning-dim)',
                color: activeTransactions.length > 0 ? 'var(--accent-primary)' : 'var(--accent-warning)',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: activeTransactions.length > 0 ? 'var(--accent-primary)' : 'var(--accent-warning)',
                  display: 'inline-block',
                  boxShadow:
                    activeTransactions.length > 0
                      ? '0 0 8px var(--accent-primary)'
                      : '0 0 8px var(--accent-warning)',
                  animation: 'pulse 2s infinite',
                }}
              />
              {activeTransactions.length} {isId ? 'Transaksi Terkoneksi' : 'Connected Transactions'}
            </span>
          </p>
        </div>
        {messages.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={clearChat}>
            🗑️ {isId ? 'Reset Chat' : 'Reset Chat'}
          </button>
        )}
      </div>

      <div className="page-content">
          <div className="chatbot-container">
            {/* Error Message */}
            {error && (
              <div
                className="animate-slide-up"
                style={{
                  background: 'var(--accent-danger-dim)',
                  border: '1px solid rgba(244,63,94,0.3)',
                  borderRadius: 14,
                  padding: '12px 16px',
                  marginBottom: 14,
                  color: 'var(--accent-danger)',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            {/* Message Thread */}
            <div className="messages-list">
              {messages.length === 0 ? (
                // Welcome / Empty State
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px 0' }}>
                  <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 24px' }} className="animate-slide-up">
                    <span style={{ fontSize: 52, display: 'block', marginBottom: 12 }}>🕵️‍♂️</span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>
                      {isId ? 'Selamat Datang di KasFlow Audit AI!' : 'Welcome to KasFlow Audit AI!'}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
                      {isId
                        ? 'Saya adalah asisten audit forensik Anda. Klik salah satu pintasan di bawah ini untuk memulai audit instan atau tanyakan apa saja tentang transaksi Anda.'
                        : 'I am your forensic auditing assistant. Click any shortcut below for an instant audit report, or ask me anything about your transaction history.'}
                    </p>
                  </div>

                  {/* Preset Action Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 12,
                      maxWidth: 800,
                      margin: '0 auto',
                      width: '100%',
                    }}
                    className="animate-slide-up delay-1"
                  >
                    {presetPrompts.map((item, idx) => (
                      <div
                        key={idx}
                        className="glass-panel"
                        onClick={() => handleSendMessage(item.prompt)}
                        style={{
                          cursor: 'pointer',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          transition: 'all 0.2s',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '10px',
                            background: 'var(--accent-primary-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.86rem', marginBottom: 3, color: 'var(--text-primary)' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Messages
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`msg-bubble ${msg.role === 'user' ? 'msg-user' : 'msg-assistant'}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <span>{msg.role === 'user' ? '👤 Anda' : '🤖 KasFlow Audit AI'}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.role === 'user' ? (
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: 1.5 }}>{msg.content}</p>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                    )}
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {loading && (
                <div className="typing-indicator msg-assistant">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <span>🤖 KasFlow Audit AI</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, height: 16, alignItems: 'center' }}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="glass-panel animate-slide-up" style={{ padding: 12, border: '1px solid var(--border-color)', marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    isId
                      ? 'Tanyakan sesuatu tentang cashflow Anda, atau ketik keluhan...'
                      : 'Ask something about your cashflow, or type a query...'
                  }
                  rows={1}
                  disabled={loading}
                  style={{
                    flex: 1,
                    resize: 'none',
                    background: 'rgba(0, 0, 0, 0.15)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 12,
                    padding: '11px 14px',
                    fontSize: '0.88rem',
                    maxHeight: 120,
                    overflowY: 'auto',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleSendMessage(input)}
                  disabled={loading || !input.trim()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 12,
                    height: 42,
                    fontSize: '0.88rem',
                  }}
                >
                  {loading ? '...' : isId ? 'Kirim 📤' : 'Send 📤'}
                </button>
              </div>
            </div>
          </div>
      </div>
    </>
  );
}
