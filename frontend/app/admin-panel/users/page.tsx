'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { setUserRole } from '@/lib/firebase-consultations';
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

const ROLES = ['user', 'consultant', 'admin'];

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
  const [saving,  setSaving]  = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserRecord)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleSaveRole(uid: string) {
    const newRole = pending[uid];
    if (!newRole) return;
    setSaving(uid);
    try {
      await setUserRole(uid, newRole);
      showToast(a.users.roleUpdated, 'success');
      setPending((p) => { const n = { ...p }; delete n[uid]; return n; });
    } catch {
      showToast(a.users.roleFailed, 'error');
    } finally {
      setSaving(null);
    }
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
              const selectedRole = pending[u.id] ?? currentRole;
              const isDirty = pending[u.id] !== undefined;
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

                  {/* Текущая роль */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${ROLE_COLORS[currentRole] ?? 'bg-gray-100 text-gray-700'}`}>
                    {currentRole}
                  </span>

                  {/* Смена роли */}
                  <select
                    value={selectedRole}
                    onChange={(e) => setPending((p) => ({ ...p, [u.id]: e.target.value }))}
                    disabled={isMe}
                    className="px-3 py-2 rounded-xl text-sm outline-none shrink-0"
                    style={{ border: '1.5px solid #DAE3E8', color: '#21393B', backgroundColor: isDirty ? '#FFF9E6' : 'transparent' }}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>

                  <button
                    disabled={!isDirty || saving === u.id || isMe}
                    onClick={() => handleSaveRole(u.id)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 disabled:opacity-30"
                    style={{ backgroundColor: isDirty ? '#21393B' : '#DAE3E8', color: isDirty ? '#F7FAE8' : '#21393B' }}
                  >
                    {saving === u.id ? '...' : a.users.save}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
