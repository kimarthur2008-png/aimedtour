'use client';

import { useState, useEffect } from 'react';
import type { SupportTicket } from '@/data/users';
import {
  createSupportTicket,
  addMessageToTicket,
  onUserTicketsUpdated,
} from '@/lib/firebase-support';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import Chat from '@/components/Chat';
import { TicketSkeleton } from '@/components/Skeleton';
import Link from 'next/link';

export default function SupportPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const s = t.support;

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newTicketData, setNewTicketData] = useState({ topic: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedTicket = tickets.find((tk) => tk.id === selectedTicketId) ?? tickets[0] ?? null;

  useEffect(() => {
    if (!user) {
      setTickets([]);
      setTicketsLoading(false);
      return;
    }
    setTicketsLoading(true);
    const unsubscribe = onUserTicketsUpdated(user.uid, (updated) => {
      setTickets(updated);
      setTicketsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreateTicket = async () => {
    if (!user) return;
    const topic = newTicketData.topic.trim();
    const description = newTicketData.description.trim();
    if (topic.length < 3 || description.length < 5) return;

    setSubmitting(true);
    try {
      const ticketId = await createSupportTicket(
        user.uid,
        user.displayName ?? user.email ?? 'Пользователь',
        user.email ?? '',
        topic,
        description
      );
      setSelectedTicketId(ticketId);
      setNewTicketData({ topic: '', description: '' });
      setShowNewTicket(false);
      showToast(s.ticketCreated, 'success');
    } catch {
      showToast(s.errCreate, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedTicket || !user) return;
    setSending(true);
    try {
      await addMessageToTicket(selectedTicket.id, 'user', text);
    } catch {
      showToast(s.errSend, 'error');
    } finally {
      setSending(false);
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
        <p className="text-gray-600 text-lg">{s.loginPrompt}</p>
        <Link
          href="/auth?tab=login"
          className="px-6 py-3 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors"
        >
          {s.login}
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:underline">{t.common.toHome}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-page bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{s.title}</h1>
            <p className="text-sm text-gray-500">{s.subtitle}</p>
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
        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 h-fit max-h-[600px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{s.myTickets}</h2>
              <button
                onClick={() => setShowNewTicket(true)}
                className="px-2 py-1 rounded text-xs font-medium bg-teal-600 text-white hover:bg-teal-700"
              >
                {s.newBtn}
              </button>
            </div>

            {ticketsLoading ? (
              <TicketSkeleton />
            ) : tickets.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">{s.noTickets}</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      (selectedTicketId ?? tickets[0]?.id) === ticket.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">{ticket.topic}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {ticket.consultantName || s.waiting}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{ticket.createdAt?.split('T')[0]}</p>
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded mt-2 ${
                        ticket.status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {ticket.status === 'open' ? s.statusOpen : s.statusClosed}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Area */}
          <div className="md:col-span-2">
            {showNewTicket && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{s.newTicketTitle}</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                      {s.topicLabel}
                    </label>
                    <input
                      id="topic"
                      type="text"
                      placeholder={s.topicPlaceholder}
                      value={newTicketData.topic}
                      onChange={(e) => setNewTicketData({ ...newTicketData, topic: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      {s.descLabel}
                    </label>
                    <textarea
                      id="description"
                      placeholder={s.descPlaceholder}
                      value={newTicketData.description}
                      onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none h-40"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateTicket}
                      disabled={submitting}
                      className="flex-1 px-4 py-3 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors disabled:opacity-60"
                    >
                      {submitting ? s.creating : s.createBtn}
                    </button>
                    <button
                      onClick={() => setShowNewTicket(false)}
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!showNewTicket && selectedTicket && (
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
                      {selectedTicket.status === 'open' ? s.statusOpen : s.statusClosed}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">{s.consultant}:</p>
                      <p className="font-medium text-gray-900">
                        {selectedTicket.consultantName || s.waiting}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">{s.created}:</p>
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
              </div>
            )}

            {!showNewTicket && !selectedTicket && !ticketsLoading && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center h-96 gap-4">
                <p className="text-gray-500">{s.noTickets}</p>
                <button
                  onClick={() => setShowNewTicket(true)}
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
                >
                  {s.newTicket}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
