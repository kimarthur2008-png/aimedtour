'use client';

import { useState, useEffect, useRef } from 'react';
import { type SupportTicket } from '@/data/users';
import {
  addMessageToTicket,
  closeTicket,
  onConsultantTicketsUpdated,
} from '@/lib/firebase-support';
import {
  sendCoordinatorMessage,
  onMyCoordinatorChatsUpdated,
  pinMessage,
  unpinMessage,
  type CoordinatorChat,
} from '@/lib/firebase-chat';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { getPatientConsultation, updateConsultationStage, confirmTreatmentComplete } from '@/lib/firebase-consultations';
import Chat from '@/components/Chat';
import { TicketSkeleton } from '@/components/Skeleton';
import Link from 'next/link';

const STAGE_LABELS = [
  'Консультация', 'Выбор клиники', 'Организация поездки',
  'Прибытие', 'Лечение', 'Восстановление', 'Завершено',
];

interface PatientConsult {
  id:          string;
  stage?:      number;
  status?:     string;
  clinicName?: string;
}

export default function ConsultantPanelPage() {
  const { user, role, loading } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const c = t.consultant;
  const [tab, setTab] = useState<'tickets' | 'chats'>('tickets');

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

  const [coordChats, setCoordChats] = useState<CoordinatorChat[]>([]);
  const [coordChatsLoading, setCoordChatsLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [coordInput, setCoordInput] = useState('');
  const [coordSending, setCoordSending] = useState(false);
  const coordEndRef = useRef<HTMLDivElement>(null);
  const [patientConsult, setPatientConsult] = useState<PatientConsult | null>(null);
  const [stageSaving, setStageSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;

  useEffect(() => {
    if (!user) {
      setTickets([]);
      setTicketsLoading(false);
      return;
    }
    setTicketsLoading(true);
    const unsubscribe = onConsultantTicketsUpdated(user.uid, (updated) => {
      setTickets(updated);
      setTicketsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) { setCoordChats([]); setCoordChatsLoading(false); return; }
    setCoordChatsLoading(true);
    const unsub = onMyCoordinatorChatsUpdated(user.uid, (chats) => {
      setCoordChats(chats);
      setCoordChatsLoading(false);
    });
    return () => unsub();
  }, [user]);


  useEffect(() => {
    coordEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChatId, coordChats]);

  const selectedChat = coordChats.find((chat) => chat.id === selectedChatId) ?? null;

  useEffect(() => {
    if (!selectedChat || !user) { setPatientConsult(null); return; }
    getPatientConsultation(selectedChat.userId, user.uid).then(setPatientConsult);
  }, [selectedChatId]);

  async function handleCoordSend() {
    if (!coordInput.trim() || !user || !selectedChat) return;
    setCoordSending(true);
    try {
      await sendCoordinatorMessage(
        selectedChat.userId,
        selectedChat.userName,
        'coordinator',
        user.displayName ?? user.email ?? 'Координатор',
        coordInput.trim()
      );
      setCoordInput('');
    } catch {
      showToast(t.common.error, 'error');
    } finally {
      setCoordSending(false);
    }
  }

  async function handleConfirmComplete() {
    if (!patientConsult) return;
    setCompleting(true);
    try {
      await confirmTreatmentComplete(patientConsult.id);
      setPatientConsult(prev => prev ? { ...prev, stage: 7, status: 'done' } : null);
      showToast('Лечение подтверждено', 'success');
    } catch {
      showToast(t.common.error, 'error');
    } finally {
      setCompleting(false);
    }
  }

  async function handleStageChange(stage: number) {
    if (!patientConsult) return;
    setStageSaving(true);
    try {
      await updateConsultationStage(patientConsult.id, stage);
      setPatientConsult(prev => prev ? { ...prev, stage } : null);
      showToast('Этап обновлён', 'success');
    } catch {
      showToast(t.common.error, 'error');
    } finally {
      setStageSaving(false);
    }
  }

  const handleSendMessage = async (text: string) => {
    if (!selectedTicket) return;
    setSending(true);
    try {
      await addMessageToTicket(selectedTicket.id, 'consultant', text);
    } catch {
      showToast(t.common.error, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    setClosing(true);
    try {
      await closeTicket(ticketId);
      showToast(c.tickets.closed, 'success');
    } catch {
      showToast(t.common.error, 'error');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-page bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t.common.loading}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-page bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600 text-lg">{c.loginTitle}</p>
        <Link
          href="/auth?tab=login"
          className="px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
        >
          {c.login}
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:underline">{t.common.toHome}</Link>
      </div>
    );
  }

  if (role !== 'consultant' && role !== 'admin') {
    return (
      <div className="min-h-page bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-2xl">🔒</p>
        <p className="text-gray-700 text-lg font-medium">{c.accessDenied}</p>
        <p className="text-gray-500 text-sm">{c.accessDeniedDesc}</p>
        <Link href="/" className="text-sm text-teal-600 hover:underline">{t.common.toHome}</Link>
      </div>
    );
  }

  const displayedTickets = showClosed ? tickets : tickets.filter((t) => t.status === 'open');

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const closedCount = tickets.filter((t) => t.status === 'closed').length;

  return (
    <div className="min-h-page bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{c.title}</h1>
            <p className="text-sm text-gray-500">
              {user.displayName ?? user.email}
            </p>
          </div>
          <Link
            href="/"
            className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t.common.toHome}
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl font-bold text-blue-600 mb-1">{openCount}</div>
            <div className="text-sm text-gray-600">{c.stats.open}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl font-bold text-green-600 mb-1">{closedCount}</div>
            <div className="text-sm text-gray-600">{c.stats.closed}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl font-bold text-purple-600 mb-1">{tickets.length}</div>
            <div className="text-sm text-gray-600">{c.stats.total}</div>
          </div>
        </div>

        {/* Переключатель вкладок */}
        <div className="flex gap-2 mb-6">
          {(['tickets', 'chats'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                tab === tabKey ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tabKey === 'tickets' ? `${c.tabs.tickets} (${openCount})` : `${c.tabs.coordination} (${coordChats.length})`}
            </button>
          ))}
        </div>

        {/* ── Вкладка: Тикеты ── */}
        <div className="grid md:grid-cols-3 gap-6" style={{ display: tab === 'tickets' ? undefined : 'none' }}>
          {/* Список тикетов */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 h-fit max-h-[600px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{c.tickets.title}</h2>
              <button
                onClick={() => setShowClosed(!showClosed)}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  showClosed
                    ? 'bg-gray-700 text-white border-gray-700'
                    : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {showClosed ? c.tickets.all : `${c.tickets.showClosed} (${closedCount})`}
              </button>
            </div>

            {ticketsLoading ? (
              <TicketSkeleton />
            ) : displayedTickets.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                {tickets.length === 0 ? c.tickets.noAssigned : c.tickets.noOpen}
              </p>
            ) : (
              <div className="space-y-2">
                {displayedTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedTicketId === ticket.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">{ticket.topic}</p>
                    <p className="text-xs text-gray-500 mt-1">{ticket.userName}</p>
                    <p className="text-xs text-gray-400 mt-1">{ticket.createdAt?.split('T')[0]}</p>
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded mt-2 ${
                        ticket.status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {ticket.status === 'open' ? c.tickets.open : c.tickets.closed}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="md:col-span-2">
            {selectedTicket ? (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedTicket.topic}</h3>
                      <p className="text-sm text-gray-600 mt-1">{selectedTicket.description}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        selectedTicket.status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {selectedTicket.status === 'open' ? c.tickets.open : c.tickets.closed}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                    <div>
                      <p className="text-gray-600">{c.tickets.patient}</p>
                      <p className="font-medium text-gray-900">{selectedTicket.userName}</p>
                      <p className="text-xs text-gray-500">{selectedTicket.userEmail}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{c.tickets.created}</p>
                      <p className="font-medium text-gray-900">{selectedTicket.createdAt?.split('T')[0]}</p>
                    </div>
                  </div>
                </div>

                <div className="h-96">
                  <Chat
                    ticketId={selectedTicket.id}
                    messages={selectedTicket.messages}
                    onSendMessage={handleSendMessage}
                    isReadOnly={selectedTicket.status === 'closed' || sending}
                  />
                </div>

                {selectedTicket.status === 'open' && (
                  <button
                    onClick={() => handleCloseTicket(selectedTicket.id)}
                    disabled={closing}
                    className="w-full px-4 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {closing ? c.tickets.closing : c.tickets.close}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center h-96">
                <p className="text-gray-500">{c.tickets.select}</p>
              </div>
            )}
          </div>
        </div>
        {/* ── Вкладка: Координация ── */}
        <div className="grid md:grid-cols-3 gap-6" style={{ display: tab === 'chats' ? undefined : 'none' }}>
          {/* Список чатов */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 h-fit max-h-[600px] overflow-y-auto">
            <h2 className="font-semibold text-gray-900 mb-4">{c.coordination.patients}</h2>

            {/* Пациенты */}
            {coordChatsLoading ? (
              <p className="text-sm text-gray-400 text-center py-4">{t.common.loading}</p>
            ) : coordChats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">{c.coordination.noChats}</p>
            ) : (
              <div className="space-y-2">
                  {coordChats.map((chat) => {
                    const last = chat.messages[chat.messages.length - 1];
                    return (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          selectedChatId === chat.id
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-900">{chat.userName}</p>
                          {chat.status === 'closed' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium shrink-0">завершён</span>
                          )}
                        </div>
                        {last && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {last.sender === 'user' ? '👤 ' : '🎯 '}{last.text}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </p>
                      </button>
                    );
                  })}
                </div>
            )}
          </div>

          {/* Чат */}
          <div className="md:col-span-2">
            {selectedChat ? (
              <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[560px]">
                {/* Шапка */}
                <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {selectedChat.userName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{selectedChat.userName}</p>
                    <p className="text-xs text-gray-500">{c.coordination.patientLabel}</p>
                  </div>
                  {patientConsult && (
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {patientConsult.status === 'done' ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                          ✓ Лечение завершено
                        </span>
                      ) : (
                        <>
                          <span className="text-xs text-gray-500">Этап:</span>
                          <select
                            value={patientConsult.stage ?? 1}
                            onChange={(e) => handleStageChange(Number(e.target.value))}
                            disabled={stageSaving}
                            className="text-xs px-2 py-1 rounded-lg border border-gray-200 outline-none disabled:opacity-50"
                            style={{ color: '#21393B' }}
                          >
                            {STAGE_LABELS.map((label, i) => (
                              <option key={i} value={i + 1}>{i + 1}. {label}</option>
                            ))}
                          </select>
                          {patientConsult.stage === 7 && (
                            <button
                              onClick={handleConfirmComplete}
                              disabled={completing}
                              className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white disabled:opacity-50 transition-opacity"
                              style={{ backgroundColor: '#059669' }}
                            >
                              {completing ? '...' : 'Подтвердить завершение'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Сообщения */}
                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                  {selectedChat.messages.map((msg) => {
                    const isCoord = msg.sender === 'coordinator';
                    const isPinned = (selectedChat.pinnedMessages ?? []).includes(msg.id);
                    return (
                      <div key={msg.id} className={`group flex items-end gap-1.5 ${isCoord ? 'justify-end' : 'justify-start'}`}>
                        {!isCoord && (
                          <button
                            onClick={() => isPinned ? unpinMessage(selectedChat.userId, msg.id) : pinMessage(selectedChat.userId, msg.id)}
                            title={isPinned ? 'Открепить' : 'Закрепить'}
                            className={`mb-1 w-6 h-6 rounded-full flex items-center justify-center transition-opacity shrink-0 ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
                            style={{ backgroundColor: isPinned ? '#e0e7ff' : '#f3f4f6' }}
                          >
                            <svg viewBox="0 0 24 24" fill={isPinned ? '#4f46e5' : 'none'} stroke={isPinned ? '#4f46e5' : '#6b7280'} strokeWidth={2} className="w-3 h-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        )}
                        <div
                          className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                            isCoord ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          } ${isPinned && !isCoord ? 'ring-2 ring-indigo-300' : ''}`}
                        >
                          {isPinned && !isCoord && (
                            <p className="text-[10px] font-semibold text-indigo-500 mb-1">📌 Закреплено</p>
                          )}
                          <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</p>
                          <p className={`text-[10px] mt-1 text-right ${isCoord ? 'text-teal-100' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {isCoord && (
                          <button
                            onClick={() => isPinned ? unpinMessage(selectedChat.userId, msg.id) : pinMessage(selectedChat.userId, msg.id)}
                            title={isPinned ? 'Открепить' : 'Закрепить'}
                            className={`mb-1 w-6 h-6 rounded-full flex items-center justify-center transition-opacity shrink-0 ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
                            style={{ backgroundColor: isPinned ? '#e0e7ff' : '#f3f4f6' }}
                          >
                            <svg viewBox="0 0 24 24" fill={isPinned ? '#4f46e5' : 'none'} stroke={isPinned ? '#4f46e5' : '#6b7280'} strokeWidth={2} className="w-3 h-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2V21l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div ref={coordEndRef} />
                </div>

                {/* Ввод */}
                {selectedChat.status === 'closed' ? (
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-center">
                    <p className="text-sm text-gray-400">Чат завершён пациентом — переписка закрыта</p>
                  </div>
                ) : (
                  <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
                    <textarea
                      value={coordInput}
                      onChange={(e) => setCoordInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCoordSend(); } }}
                      placeholder={c.coordination.inputPh}
                      rows={1}
                      className="flex-1 resize-none rounded-lg px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={{ maxHeight: '80px' }}
                    />
                    <button
                      onClick={handleCoordSend}
                      disabled={!coordInput.trim() || coordSending}
                      className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 self-end"
                    >
                      {coordSending ? '...' : c.coordination.send}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center h-96">
                <p className="text-gray-500">{c.coordination.select}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
