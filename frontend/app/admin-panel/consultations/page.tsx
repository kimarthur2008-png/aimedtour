'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateConsultationStatus, type ConsultationStatus } from '@/lib/firebase-consultations';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';

interface Consultation {
  id:               string;
  clinicName?:      string;
  consultDate?:     string;
  status:           ConsultationStatus;
  coordinatorName?: string;
  coordinatorId?:   string;
  createdAt?:       { seconds: number } | string;
}

const STATUS_COLORS: Record<ConsultationStatus, string> = {
  new:           'bg-blue-50 text-blue-700',
  'in-progress': 'bg-yellow-50 text-yellow-700',
  done:          'bg-green-50 text-green-700',
};

function formatDate(val: { seconds: number } | string | undefined): string {
  if (!val) return '—';
  if (typeof val === 'string') return val.split('T')[0];
  return new Date(val.seconds * 1000).toLocaleDateString('ru-RU');
}

export default function ConsultationsAdminPage() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const a = t.admin;

  const [items,    setItems]    = useState<Consultation[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [filter,   setFilter]   = useState<ConsultationStatus | 'all'>('all');

  useEffect(() => {
    const q = query(collection(db, 'consultations'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Consultation)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const statusLabels: Record<ConsultationStatus, string> = {
    new: a.consultations.statuses.new,
    'in-progress': a.consultations.statuses.inProgress,
    done: a.consultations.statuses.done,
  };

  async function handleStatusChange(id: string, status: ConsultationStatus) {
    setSaving(true);
    try {
      await updateConsultationStatus(id, status);
      showToast('✓', 'success');
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
    } catch {
      showToast('Error', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7FAE8' }}>
        <p className="text-gray-600">{a.accessDenied}</p>
      </div>
    );
  }

  const displayed = filter === 'all' ? items : items.filter((i) => i.status === filter);

  return (
    <div style={{ backgroundColor: '#F7FAE8', minHeight: '100vh' }}>
      <div className="max-w-[1200px] mx-auto px-[clamp(16px,5vw,60px)] py-10">

        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/admin-panel" className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
            style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}>{a.nav.tourism}</Link>
          <Link href="/admin-panel/hospitals" className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
            style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}>{a.nav.hospitals}</Link>
          <span className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#21393B', color: '#F7FAE8' }}>{a.nav.consultations}</span>
          <Link href="/admin-panel/users" className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
            style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}>{a.nav.users}</Link>
        </div>

        <h1 className="text-h2 mb-6" style={{ color: '#21393B' }}>{a.consultations.title}</h1>

        {/* Статистика */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {([
              { label: 'Всего', count: items.length, bg: '#21393B', fg: '#F7FAE8' },
              { label: statusLabels['new'],         count: items.filter(i => i.status === 'new').length,         bg: '#EFF6FF', fg: '#1d4ed8' },
              { label: statusLabels['in-progress'], count: items.filter(i => i.status === 'in-progress').length, bg: '#FFFBEB', fg: '#b45309' },
              { label: statusLabels['done'],        count: items.filter(i => i.status === 'done').length,        bg: '#F0FDF4', fg: '#15803d' },
            ] as const).map(({ label, count, bg, fg }) => (
              <div key={label} className="rounded-2xl px-5 py-4 flex flex-col gap-1" style={{ backgroundColor: bg }}>
                <p className="text-2xl font-bold" style={{ color: fg }}>{count}</p>
                <p className="text-xs opacity-70" style={{ color: fg }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'new', 'in-progress', 'done'] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
              style={filter === s ? { backgroundColor: '#21393B', color: '#F7FAE8' } : { backgroundColor: '#DAE3E8', color: '#21393B' }}>
              {s === 'all'
                ? `${a.consultations.filterAll} (${items.length})`
                : `${statusLabels[s]} (${items.filter(i => i.status === s).length})`}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          <div className="flex-1 flex flex-col gap-3">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-20 bg-white/60 rounded-2xl animate-pulse" />)
            ) : displayed.length === 0 ? (
              <p className="text-sm opacity-50" style={{ color: '#21393B' }}>{a.consultations.noItems}</p>
            ) : displayed.map((item) => (
              <button key={item.id} onClick={() => setSelected(item)}
                className="text-left bg-white rounded-2xl px-5 py-4 border-2 transition-all"
                style={{ borderColor: selected?.id === item.id ? '#21393B' : '#DAE3E8' }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#21393B' }}>
                      {item.clinicName ?? '—'}
                    </p>
                    <p className="text-xs opacity-50 truncate" style={{ color: '#21393B' }}>
                      {item.coordinatorName ? `Координатор: ${item.coordinatorName}` : 'Координатор не назначен'}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                    <span className="text-[11px] opacity-40" style={{ color: '#21393B' }}>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="w-[340px] shrink-0 bg-white rounded-2xl p-6 border border-[#DAE3E8] h-fit sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-base" style={{ color: '#21393B' }}>{a.consultations.details}</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>

              <div className="flex flex-col gap-2 text-sm mb-5">
                {[
                  [a.consultations.fields.clinic,      selected.clinicName],
                  [a.consultations.fields.date,        selected.consultDate],
                  [a.consultations.fields.coordinator, selected.coordinatorName],
                  [a.consultations.fields.created,     formatDate(selected.createdAt)],
                ].map(([label, val]) => val ? (
                  <div key={label} className="flex gap-2">
                    <span className="opacity-50 shrink-0 w-32" style={{ color: '#21393B' }}>{label}</span>
                    <span className="font-medium" style={{ color: '#21393B' }}>{val}</span>
                  </div>
                ) : null)}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold opacity-60 mb-1" style={{ color: '#21393B' }}>{a.consultations.changeStatus}</p>
                {(['new', 'in-progress', 'done'] as const).map((s) => (
                  <button key={s}
                    disabled={selected.status === s || saving}
                    onClick={() => handleStatusChange(selected.id, s)}
                    className="py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                    style={selected.status === s
                      ? { backgroundColor: '#21393B', color: '#F7FAE8' }
                      : { backgroundColor: '#DAE3E8', color: '#21393B' }}>
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
