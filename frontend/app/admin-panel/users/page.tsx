'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CoordLoad {
  id:    string;
  total: number;
  active: number;
}
import { createConsultantInvite } from '@/lib/firebase-consultations';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';

interface UserRecord {
  id:         string;
  fullName?:  string;
  nick?:      string;
  email?:     string;
  role?:      string;
  createdAt?: { seconds: number } | string;
}

interface InviteRecord {
  id:        string;
  email:     string;
  used:      boolean;
  expiresAt: string;
  createdAt?: { seconds: number };
}

const ROLE_COLORS: Record<string, string> = {
  user:       'bg-gray-100 text-gray-700',
  consultant: 'bg-purple-50 text-purple-700',
  admin:      'bg-red-50 text-red-700',
};

export default function UsersAdminPage() {
  const { user: me, role: myRole } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const a = t.admin;

  const [users,   setUsers]   = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const [invites,      setInvites]      = useState<InviteRecord[]>([]);
  const [inviteEmail,  setInviteEmail]  = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteLink,   setInviteLink]   = useState<string | null>(null);
  const [copied,       setCopied]       = useState(false);
  const [coordLoads,   setCoordLoads]   = useState<Record<string, CoordLoad>>({});

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserRecord)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'consultantInvites'), where('used', '==', false));
    const unsub = onSnapshot(q, (snap) => {
      setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() } as InviteRecord)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'consultations'), (snap) => {
      const loads: Record<string, CoordLoad> = {};
      snap.docs.forEach((d) => {
        const cid: string | undefined = d.data().coordinatorId;
        if (!cid) return;
        if (!loads[cid]) loads[cid] = { id: cid, total: 0, active: 0 };
        loads[cid].total++;
        if (d.data().status !== 'done') loads[cid].active++;
      });
      setCoordLoads(loads);
    });
    return () => unsub();
  }, []);

  async function handleSendInvite() {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      showToast('Введите корректный email', 'error');
      return;
    }
    setInviteSending(true);
    setInviteLink(null);
    try {
      const url = await createConsultantInvite(inviteEmail.trim());
      setInviteLink(url);
      setInviteEmail('');
    } catch {
      showToast('Не удалось создать инвайт', 'error');
    } finally {
      setInviteSending(false);
    }
  }

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (myRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7FAE8' }}>
        <p className="text-gray-600">{a.accessDenied}</p>
      </div>
    );
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || (u.fullName ?? '').toLowerCase().includes(q) ||
      (u.nick ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q);
  });

  return (
    <div style={{ backgroundColor: '#F7FAE8', minHeight: '100vh' }}>
      <div className="max-w-[1200px] mx-auto px-[clamp(16px,5vw,60px)] py-10">

        {/* Навигация */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/admin-panel" className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
            style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}>{a.nav.tourism}</Link>
          <Link href="/admin-panel/hospitals" className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
            style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}>{a.nav.hospitals}</Link>
          <Link href="/admin-panel/consultations" className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
            style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}>{a.nav.consultations}</Link>
          <span className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#21393B', color: '#F7FAE8' }}>{a.nav.users}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-h2" style={{ color: '#21393B' }}>{a.users.title}</h1>
          <p className="text-sm opacity-50" style={{ color: '#21393B' }}>{a.users.total} {users.length}</p>
        </div>

        {/* Инвайт консультанта */}
        <div className="bg-white rounded-2xl p-5 mb-6 border" style={{ borderColor: '#DAE3E8' }}>
          <p className="font-semibold text-sm mb-3" style={{ color: '#21393B' }}>Пригласить консультанта</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendInvite(); }}
              placeholder="email@example.com"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }}
            />
            <button
              onClick={handleSendInvite}
              disabled={inviteSending}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white shrink-0 disabled:opacity-50"
              style={{ backgroundColor: '#21393B' }}
            >
              {inviteSending ? '...' : 'Отправить'}
            </button>
          </div>

          {inviteLink && (
            <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: '#EDF2EE', border: '1.5px solid #73907E' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#21393B' }}>Ссылка для регистрации — отправьте координатору:</p>
              <div className="flex gap-2 items-center">
                <p className="flex-1 text-xs break-all font-mono" style={{ color: '#21393B', opacity: 0.7 }}>{inviteLink}</p>
                <button
                  onClick={handleCopy}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                  style={{ backgroundColor: copied ? '#4CAF50' : '#21393B' }}
                >
                  {copied ? 'Скопировано!' : 'Копировать'}
                </button>
              </div>
            </div>
          )}

          {invites.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-xs opacity-50 font-medium" style={{ color: '#21393B' }}>Ожидают регистрации</p>
              {invites.map((inv) => {
                const expired = new Date(inv.expiresAt) < new Date();
                return (
                  <div key={inv.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl" style={{ backgroundColor: '#F7FAE8' }}>
                    <span className="text-sm truncate" style={{ color: '#21393B' }}>{inv.email}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${expired ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                      {expired ? 'истёк' : 'ожидает'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Нагрузка координаторов */}
        {(() => {
          const consultants = users.filter(u => u.role === 'consultant');
          if (consultants.length === 0) return null;
          return (
            <div className="bg-white rounded-2xl p-5 mb-6 border" style={{ borderColor: '#DAE3E8' }}>
              <p className="font-semibold text-sm mb-4" style={{ color: '#21393B' }}>Нагрузка координаторов</p>
              <div className="flex flex-col gap-3">
                {consultants.map(u => {
                  const load = coordLoads[u.id];
                  const active = load?.active ?? 0;
                  const total  = load?.total  ?? 0;
                  const color = active >= 10 ? '#dc2626' : active >= 5 ? '#d97706' : '#16a34a';
                  return (
                    <div key={u.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-white text-xs"
                        style={{ backgroundColor: '#73907E' }}>
                        {(u.fullName || u.nick || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#21393B' }}>{u.fullName || u.nick || '—'}</p>
                        <p className="text-xs opacity-50 truncate" style={{ color: '#21393B' }}>{u.email}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color }}>{active} акт.</p>
                          <p className="text-[11px] opacity-40" style={{ color: '#21393B' }}>всего {total}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Поиск */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={a.users.search}
          className="w-full mb-6 px-4 py-3 rounded-xl text-sm outline-none"
          style={{ border: '1.5px solid #DAE3E8', color: '#21393B', backgroundColor: 'white' }}
        />

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white/60 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((u) => {
              const currentRole = u.role ?? 'user';
              const isMe = u.id === me?.uid;

              return (
                <div key={u.id} className="bg-white rounded-2xl px-5 py-4 border flex items-center gap-4"
                  style={{ borderColor: '#DAE3E8' }}>
                  {/* Аватар */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-sm"
                    style={{ backgroundColor: '#73907E' }}>
                    {(u.fullName || u.nick || u.email || '?')[0].toUpperCase()}
                  </div>

                  {/* Инфо */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate" style={{ color: '#21393B' }}>
                        {u.fullName || u.nick || '—'}
                      </p>
                      {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-semibold">{a.users.you}</span>}
                    </div>
                    <p className="text-xs opacity-50 truncate" style={{ color: '#21393B' }}>{u.email}</p>
                  </div>

                  {/* Роль */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${ROLE_COLORS[currentRole] ?? 'bg-gray-100 text-gray-700'}`}>
                    {currentRole}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
