'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  sendCoordinatorMessage,
  onCoordinatorChatUpdated,
  type CoordinatorChat,
} from '@/lib/firebase-chat';

export default function ChatPage() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [chat,        setChat]        = useState<CoordinatorChat | null>(null);
  const [input,       setInput]       = useState('');
  const [sending,     setSending]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) { router.replace('/auth'); return; }
    if (!user) return;
    return onCoordinatorChatUpdated(user.uid, setChat);
  }, [user, loading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7FAE8' }}>
        <div className="w-10 h-10 rounded-full border-[3px] animate-spin" style={{ borderColor: '#DAE3E8', borderTopColor: '#73907E' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F7FAE8' }}>

      {/* Шапка чата */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b" style={{ backgroundColor: '#2D4A3E', borderColor: '#1a3028' }}>
        <Link href="/profile" className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity" style={{ backgroundColor: '#73907E' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#73907E' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{t.profile.coordinator}</p>
          <p className="text-xs text-white/60">{chat?.coordinatorName ?? t.profile.toBeDetermined}</p>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3 max-w-2xl w-full mx-auto">
        {!chat || chat.messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-sm text-center opacity-40" style={{ color: '#21393B' }}>
              {t.profile.coordinatorDefault}
            </p>
          </div>
        ) : (
          chat.messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm"
                  style={{
                    backgroundColor: isUser ? '#21393B' : 'white',
                    color: isUser ? 'white' : '#21393B',
                    borderBottomRightRadius: isUser ? '4px' : undefined,
                    borderBottomLeftRadius:  !isUser ? '4px' : undefined,
                  }}
                >
                  <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</p>
                  <p className="text-[10px] mt-1 opacity-50 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Поле ввода */}
      <div className="sticky bottom-0 px-4 py-3 border-t max-w-2xl w-full mx-auto" style={{ borderColor: '#DAE3E8', backgroundColor: '#F7FAE8' }}>
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={t.profile.chatPh}
            rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm outline-none"
            style={{ border: '1.5px solid #DAE3E8', color: '#21393B', backgroundColor: 'white', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: '#21393B' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
}
