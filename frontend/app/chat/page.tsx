'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  sendCoordinatorMessage,
  closeCoordinatorChat,
  startNewCoordinatorChat,
  onCoordinatorChatUpdated,
  onArchivedChatsUpdated,
  type CoordinatorChat,
  type ArchivedChat,
} from '@/lib/firebase-chat';

interface Consultation {
  id: string;
  clinicName?: string;
  status: string;
  stage?: number;
}

function stageFromStatus(status: string): number {
  if (status === 'done') return 7;
  if (status === 'in-progress') return 2;
  return 1;
}

const STAGE_LABELS = [
  'Консультация', 'Выбор клиники', 'Организация поездки',
  'Прибытие', 'Лечение', 'Восстановление', 'Завершено',
];

function initials(name: string | null | undefined, fallback = '?') {
  if (!name) return fallback;
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function Avatar({ photoURL, name, size = 10, bg = '#73907E', fallback = '?' }: {
  photoURL?: string | null; name?: string | null; size?: number; bg?: string; fallback?: string;
}) {
  const init = initials(name, fallback);
  const cls = `w-${size} h-${size} rounded-full flex items-center justify-center shrink-0 font-bold overflow-hidden`;
  if (photoURL) return (
    <div className={cls} style={{ backgroundColor: bg }}>
      <img src={photoURL} alt={name ?? ''} className="w-full h-full object-cover" />
    </div>
  );
  return <div className={cls} style={{ backgroundColor: bg, color: 'white' }}>{init}</div>;
}

function Sidebar({ chat, consult, stage, onBack, hideBack = false }: {
  chat: CoordinatorChat | null; consult: Consultation | null;
  stage: number; onBack: () => void; hideBack?: boolean;
}) {
  const coordName = chat?.coordinatorName ?? null;
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ backgroundColor: '#F7FAE8' }}>
      {!hideBack && (
        <div className="px-5 pt-5 pb-4 shrink-0 border-b" style={{ borderColor: '#DAE3E8' }}>
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-60" style={{ color: '#21393B' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Назад
          </button>
        </div>
      )}
      <div className="px-5 py-4 shrink-0 border-b" style={{ borderColor: '#DAE3E8' }}>
        <p className="text-[10px] font-semibold tracking-widest uppercase mb-3 opacity-50" style={{ color: '#21393B' }}>Координатор</p>
        <div className="flex items-center gap-3 min-w-0">
          <Avatar photoURL={chat?.coordinatorPhotoURL} name={coordName} size={10} fallback="КМ" />
          <div className="min-w-0">
            <p className="font-semibold text-sm wrap-break-word" style={{ color: '#21393B' }}>{coordName ?? 'Не назначен'}</p>
            {coordName && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <span className="text-xs text-green-600">Онлайн</span>
              </div>
            )}
          </div>
        </div>
        {consult?.clinicName && (
          <div className="mt-3 px-3 py-1 rounded-xl text-xs font-medium wrap-break-word" style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}>
            {consult.clinicName}
          </div>
        )}
      </div>

      {(() => {
        const pinned = chat?.messages.filter(m => (chat.pinnedMessages ?? []).includes(m.id)) ?? [];
        if (pinned.length === 0) return null;
        return (
          <div className="px-5 py-4 shrink-0 border-b" style={{ borderColor: '#DAE3E8' }}>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-3 opacity-50" style={{ color: '#21393B' }}>Закреплённые</p>
            <div className="flex flex-col gap-2">
              {pinned.map(msg => (
                <div key={msg.id} className="flex items-start gap-2">
                  <span className="text-[11px] mt-0.5">📌</span>
                  <p className="text-sm leading-snug" style={{ color: '#21393B' }}>{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="px-5 py-4 flex-1">
        <p className="text-[10px] font-semibold tracking-widest uppercase mb-4 opacity-50" style={{ color: '#21393B' }}>Этап лечения</p>
        <div className="flex flex-col">
          {STAGE_LABELS.map((label, i) => {
            const idx = i + 1;
            const isDone = idx < stage;
            const isCurrent = idx === stage;
            const isLast = i === STAGE_LABELS.length - 1;
            return (
              <div key={label} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                    style={{ backgroundColor: isDone ? '#73907E' : isCurrent ? '#21393B' : 'transparent', border: isDone || isCurrent ? 'none' : '1.5px solid #DAE3E8' }}>
                    {isDone && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    {isCurrent && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  {!isLast && <div className="w-px flex-1 my-1" style={{ backgroundColor: isDone ? '#73907E' : '#DAE3E8', minHeight: '20px' }} />}
                </div>
                <p className="pb-4 text-sm leading-tight pt-0.5" style={{ color: '#21393B', opacity: isCurrent ? 1 : isDone ? 0.6 : 0.3, fontWeight: isCurrent ? 600 : 400 }}>
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [chat,             setChat]             = useState<CoordinatorChat | null>(null);
  const [,                 setArchivedChats]    = useState<ArchivedChat[]>([]);
  const [input,            setInput]            = useState('');
  const [sending,          setSending]          = useState(false);
  const [closing,          setClosing]          = useState(false);
  const [startingNew,      setStartingNew]      = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [consult,          setConsult]          = useState<Consultation | null>(null);
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarVisible,   setSidebarVisible]   = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const sheetRef   = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragDeltaY = useRef(0);

  function openSidebar() {
    setSidebarOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setSidebarVisible(true)));
  }
  function closeSidebar() {
    setSidebarVisible(false);
    setTimeout(() => setSidebarOpen(false), 300);
  }
  function onDragStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY;
    dragDeltaY.current = 0;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }
  function onDragMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta < 0) return;
    dragDeltaY.current = delta;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`;
  }
  function onDragEnd() {
    if (dragDeltaY.current > 120) {
      closeSidebar();
    } else if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 300ms ease-out';
      sheetRef.current.style.transform = 'translateY(0)';
    }
  }

  useEffect(() => {
    if (!loading && !user) { router.replace('/auth'); return; }
    if (!user) return;
    return onCoordinatorChatUpdated(user.uid, setChat);
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    return onArchivedChatsUpdated(user.uid, setArchivedChats);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'consultations'), where('userId', '==', user.uid), limit(1))).then((snap) => {
      if (!snap.empty) setConsult({ id: snap.docs[0].id, ...snap.docs[0].data() } as Consultation);
    });
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  async function handleSend() {
    if (!input.trim() || !user) return;
    setSending(true);
    try {
      await sendCoordinatorMessage(user.uid, profile?.fullName || profile?.nick || user.email || '', 'user', profile?.fullName || profile?.nick || user.email || '', input.trim());
      setInput('');
    } finally { setSending(false); }
  }

  async function handleCloseChat() {
    if (!user) return;
    setClosing(true);
    try { await closeCoordinatorChat(user.uid); }
    finally { setClosing(false); setShowCloseConfirm(false); }
  }

  async function handleStartNewChat() {
    if (!user) return;
    setStartingNew(true);
    try { await startNewCoordinatorChat(user.uid, profile?.fullName || profile?.nick || user.email || ''); }
    finally { setStartingNew(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100dvh', backgroundColor: '#F7FAE8' }}>
        <div className="w-10 h-10 rounded-full border-[3px] animate-spin" style={{ borderTopColor: '#73907E', borderRightColor: '#DAE3E8', borderBottomColor: '#DAE3E8', borderLeftColor: '#DAE3E8' }} />
      </div>
    );
  }

  const stage         = consult ? (consult.stage ?? stageFromStatus(consult.status)) : 0;
  const coordName     = chat?.coordinatorName ?? null;
  const coordPhotoURL = chat?.coordinatorPhotoURL ?? null;
  const isClosed      = chat?.status === 'closed';

  return (
    <>
      <div className="flex" style={{ height: '100dvh' }}>

        {/* Левая колонка (desktop) */}
        <div className="hidden lg:block w-92 shrink-0 border-r h-full" style={{ borderColor: '#DAE3E8' }}>
          <Sidebar chat={chat} consult={consult} stage={stage} onBack={() => router.back()} />
        </div>

        {/* Мобильный сайдбар */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 transition-opacity duration-300" style={{ backgroundColor: sidebarVisible ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)' }} onClick={closeSidebar} />
            <div ref={sheetRef} className="relative rounded-t-[25px] overflow-hidden max-h-[85dvh] flex flex-col transition-transform duration-300 ease-out" style={{ backgroundColor: '#F7FAE8', transform: sidebarVisible ? 'translateY(0)' : 'translateY(100%)' }}>
              <div className="flex justify-center pt-4 pb-2 shrink-0 cursor-grab active:cursor-grabbing" onTouchStart={onDragStart} onTouchMove={onDragMove} onTouchEnd={onDragEnd}>
                <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: '#73907E', opacity: 0.4 }} />
              </div>
              <div className="overflow-y-auto flex-1">
                <Sidebar chat={chat} consult={consult} stage={stage} onBack={() => router.back()} hideBack />
              </div>
            </div>
          </div>
        )}

        {/* Правая колонка — чат */}
        <div className="flex-1 flex flex-col min-w-0 relative" style={{ backgroundColor: '#F7FAE8' }}>

          {/* Шапка — мобильная */}
          <div className="lg:hidden absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 pb-3" style={{ backgroundColor: '#2D4A3E', paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
            <button onClick={() => router.back()} className="shrink-0 flex items-center justify-center w-8 h-8">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <Avatar photoURL={coordPhotoURL} name={coordName} size={9} fallback="КМ" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm leading-tight">{coordName ?? t.profile.toBeDetermined}</p>
              {isClosed
                ? <span className="text-[10px] text-white/50">Чат завершён</span>
                : coordName && <div className="flex items-center gap-1.5 mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /><span className="text-xs text-white/60">Онлайн</span></div>
              }
            </div>
            {!isClosed && chat && chat.messages.length > 0 && (
              <button onClick={() => setShowCloseConfirm(true)} className="shrink-0 text-[11px] text-white/50 hover:text-white/80 transition-colors px-2">Завершить</button>
            )}
            <button onClick={openSidebar} className="shrink-0 flex items-center justify-center w-8 h-8">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-5 h-5"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>
            </button>
          </div>

          {/* Шапка — десктоп */}
          <div className="hidden lg:flex absolute top-0 left-0 right-0 z-10 px-4 py-3 items-center gap-3 border-b" style={{ backgroundColor: '#2D4A3E', borderColor: '#1a3028' }}>
            <Avatar photoURL={coordPhotoURL} name={coordName} size={9} fallback="КМ" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">{coordName ?? t.profile.toBeDetermined}</p>
              {isClosed
                ? <span className="text-[11px] text-white/50">Чат завершён</span>
                : consult?.clinicName && <p className="text-xs text-white/50 truncate">{consult.clinicName}</p>
              }
            </div>
            {!isClosed && chat && chat.messages.length > 0 && (
              <button onClick={() => setShowCloseConfirm(true)} className="text-xs px-3 py-1.5 rounded-xl transition-colors shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                Завершить чат
              </button>
            )}
            {consult?.clinicName && !isClosed && (
              <span className="text-xs font-medium px-3 py-1 rounded-full shrink-0" style={{ backgroundColor: '#73907E', color: 'white' }}>{consult.clinicName}</span>
            )}
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto">
            <div className="w-full px-6 md:px-12 lg:px-75 pt-24 pb-32 flex flex-col gap-3">
              {!chat || chat.messages.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-sm text-center opacity-40" style={{ color: '#21393B' }}>{t.profile.coordinatorDefault}</p>
                </div>
              ) : (
                chat.messages.map((msg, idx) => {
                  const isUser = msg.sender === 'user';
                  const nextMsg = chat.messages[idx + 1];
                  const isLastFromSender = !nextMsg || nextMsg.sender !== msg.sender;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && <div className="hidden lg:block mb-0.5 w-7 shrink-0">{isLastFromSender && <Avatar photoURL={coordPhotoURL} name={coordName} size={7} bg="#2D4A3E" fallback="КМ" />}</div>}
                      <div className="px-3.5 py-2.5 rounded-2xl text-sm" style={{ maxWidth: '400px', backgroundColor: isUser ? '#21393B' : 'white', color: isUser ? 'white' : '#21393B', borderBottomRightRadius: isUser ? '4px' : undefined, borderBottomLeftRadius: !isUser ? '4px' : undefined }}>
                        <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'normal' }}>{msg.text}</p>
                        <p className="text-[10px] mt-1 opacity-50 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {isUser && <div className="hidden lg:block mb-0.5 w-7 shrink-0">{isLastFromSender && <Avatar photoURL={null} name={profile?.fullName || profile?.nick} size={7} bg="#73907E" />}</div>}
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Тени */}
          <div className="hidden lg:block absolute top-0 left-0 right-0 h-16 z-5 pointer-events-none" style={{ background: 'linear-gradient(to bottom, #F7FAE8 40%, transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-26 z-5 pointer-events-none" style={{ background: 'linear-gradient(to top, #F7FAE8 40%, transparent)' }} />

          {/* Нижняя панель */}
          <div className="absolute bottom-0 left-0 right-0 z-10 py-4 px-6 md:px-12 lg:px-75">
            {isClosed ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <p className="text-xs text-center opacity-50" style={{ color: '#21393B' }}>Чат завершён — переписка доступна только для просмотра</p>
                <button onClick={handleStartNewChat} disabled={startingNew} className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#21393B' }}>
                  {startingNew ? 'Создаём чат...' : 'Начать новый чат'}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Написать координатору..."
                  rows={1}
                  className="flex-1 resize-none rounded-full px-4 py-3 text-sm outline-none"
                  style={{ border: '1.5px solid #DAE3E8', color: '#21393B', backgroundColor: 'white', maxHeight: '120px' }}
                />
                <button onClick={handleSend} disabled={!input.trim() || sending} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40" style={{ backgroundColor: '#21393B' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Диалог подтверждения */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-[16px] mb-2" style={{ color: '#21393B' }}>Завершить чат?</h3>
            <p className="text-sm mb-6 opacity-60" style={{ color: '#21393B' }}>Переписка будет сохранена и доступна для просмотра. Вы сможете начать новый чат в любой момент.</p>
            <div className="flex gap-3">
              <button onClick={handleCloseChat} disabled={closing} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#21393B' }}>
                {closing ? 'Завершаем...' : 'Завершить'}
              </button>
              <button onClick={() => setShowCloseConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
