'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  sendCoordinatorMessage,
  onCoordinatorChatUpdated,
  type CoordinatorChat,
} from '@/lib/firebase-chat';

const EXCLUDED = ['/profile', '/consultant-panel', '/chat'];

export default function FloatingChatWidget() {
  const pathname  = usePathname();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const p = t.profile;

  const router = useRouter();
  const [isOpen,  setIsOpen]  = useState(false);
  const [hovered, setHovered] = useState(false);
  const [chat,    setChat]    = useState<CoordinatorChat | null>(null);
  const [input,   setInput]   = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const excluded = EXCLUDED.some((path) => pathname.startsWith(path));

  useEffect(() => {
    if (!user) return;
    return onCoordinatorChatUpdated(user.uid, setChat);
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [chat?.messages?.length, isOpen]);

  async function handleSend() {
    if (!input.trim() || !user) return;
    setSending(true);
    try {
      await sendCoordinatorMessage(
        user.uid,
        profile?.fullName || profile?.nick || user.email || '',
        'user',
        profile?.fullName || profile?.nick || user.email || '',
        input.trim()
      );
      setInput('');
    } finally {
      setSending(false);
    }
  }

  if (excluded || !user || profile?.role === 'admin' || profile?.role === 'consultant') return null;

  const hasMessages = (chat?.messages?.length ?? 0) > 0;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* ── Mini chat window + its close button ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute bottom-16 right-0"
            style={{ width: '320px' }}
          >
            {/* Hide button — outside top-left corner of window */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -left-10 top-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md border transition-colors hover:bg-gray-50"
              style={{ backgroundColor: 'white', borderColor: '#DAE3E8', color: '#73907E' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg> 
            </button>

            {/* Window */}
            <div
              className="w-80 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
              style={{ height: '440px', border: '1px solid #DAE3E8' }}
            >
            {/* Header */}
            <div
              className="flex items-center gap-2.5 px-4 py-3 shrink-0"
              style={{ backgroundColor: '#2D4A3E' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#73907E' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold leading-tight">{p.chatWidgetTitle}</p>
                <p className="text-white/50 text-[11px] truncate">{chat?.coordinatorName ?? p.toBeDetermined}</p>
              </div>
              {/* Full-screen button */}
              <Link
                href="/chat"
                title={p.chatFullScreen}
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#73907E' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6m0 0v6m0-6L14 10M9 21H3m0 0v-6m0 6l7-7" />
                </svg>
              </Link>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2"
              style={{ backgroundColor: '#F7FAE8' }}
            >
              {!hasMessages ? (
                <div className="flex-1 flex items-center justify-center py-10">
                  <p className="text-xs text-center opacity-40 px-4" style={{ color: '#21393B' }}>
                    {p.coordinatorDefault}
                  </p>
                </div>
              ) : (
                chat!.messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[78%] px-3 py-2 rounded-2xl text-xs"
                        style={{
                          backgroundColor: isUser ? '#21393B' : 'white',
                          color: isUser ? 'white' : '#21393B',
                          borderBottomRightRadius: isUser ? '4px' : undefined,
                          borderBottomLeftRadius: !isUser ? '4px' : undefined,
                          boxShadow: isUser ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                        }}
                      >
                        <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</p>
                        <p className="text-[9px] mt-1 opacity-50 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              className="px-3 py-2.5 border-t shrink-0 flex gap-2 items-end"
              style={{ borderColor: '#DAE3E8', backgroundColor: 'white' }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder={p.chatPh}
                rows={1}
                className="flex-1 resize-none rounded-xl px-3 py-2 text-xs outline-none"
                style={{ border: '1.5px solid #DAE3E8', color: '#21393B', maxHeight: '64px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
                style={{ backgroundColor: '#21393B' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
            {/* ↑ input section */}
          </div>
          {/* ↑ window */}
        </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trigger button (standalone, bottom-right) ── */}
      <div className="flex justify-end">
        {/* Chat trigger button with hover-expand label */}
        <button
          onClick={() => {
            if (window.innerWidth < 1024) { router.push('/chat'); return; }
            setIsOpen((v) => !v);
          }}
          onMouseEnter={() => window.matchMedia('(hover: hover)').matches && setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative flex items-center h-12 rounded-full overflow-hidden ml-auto"
          style={{ backgroundColor: '#21393B', paddingLeft: '14px', paddingRight: '14px' }}
          
        >
          {/* New message dot */}
          {!isOpen && hasMessages && (
            <span
              className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ backgroundColor: '#4ade80', borderColor: '#21393B' }}
            />
          )}
          {/* Icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.78 9.78 0 01-4.463-1.059L3 21l2.059-4.537A7.963 7.963 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {/* Expandable label */}
          <span
            className="text-white text-sm font-medium whitespace-nowrap overflow-hidden"
            style={{
              maxWidth: hovered || isOpen ? '160px' : '0',
              opacity:  hovered || isOpen ? 1 : 0,
              marginLeft: hovered || isOpen ? '8px' : '0',
              transition: 'max-width 0.22s cubic-bezier(0.37, 0, 0.63, 1), opacity 0.18s cubic-bezier(0.37, 0, 0.63, 1), margin-left 0.22s cubic-bezier(0.37, 0, 0.63, 1)',
            }}
          >
            {p.chatWidget}
          </span>
        </button>
      </div>
    </div>
  );
}
