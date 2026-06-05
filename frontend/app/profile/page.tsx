'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const STAGE_ICONS = [
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
];

interface Consultation {
  id:          string;
  clinicName:  string;
  specialty?:  string;
  consultDate: string;
  status:      string;
  stage?:      number;
  coordinator?: { name: string; phone: string };
}

function stageFromStatus(status: string): number {
  if (status === 'done') return 7;
  if (status === 'in-progress') return 2;
  return 1;
}

export default function ProfilePage() {
  const { user, profile, role, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const STAGES = t.profile.stageLabels.map((label, i) => ({
    label,
    desc: t.profile.stageDescs[i],
    icon: STAGE_ICONS[i],
  }));

  const [consult,        setConsult]       = useState<Consultation | null>(null);
  const [consultLoading, setConsultLoading] = useState(true);

  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editFullName,  setEditFullName]  = useState('');
  const [editCountry,   setEditCountry]   = useState('');
  const [editCity,      setEditCity]      = useState('');
  const [editPhone,     setEditPhone]     = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');

  useEffect(() => {
    if (!user) { setConsultLoading(false); return; }
    const q = query(
      collection(db, 'consultations'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    getDocs(q)
      .then((snap) => {
        if (!snap.empty) {
          const d = snap.docs[0];
          setConsult({ id: d.id, ...d.data() } as Consultation);
        }
        setConsultLoading(false);
      })
      .catch(() => setConsultLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: '#C0CEB9' }}>
        <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#C0CEB9' }}>
        <p className="text-[#21393B] text-lg font-medium">{t.profile.notLoggedIn}</p>
        <Link href="/auth?tab=login" className="px-6 py-3 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: '#21393B' }}>
          {t.profile.login}
        </Link>
      </div>
    );
  }

  const initial = (profile?.fullName || profile?.nick || user.email || '?')[0].toUpperCase();
  const stage   = consult ? (consult.stage ?? stageFromStatus(consult.status)) : 0;

  function startEdit() {
    setEditFullName(profile?.fullName  ?? '');
    setEditCountry(profile?.country    ?? '');
    setEditCity(profile?.city          ?? '');
    setEditPhone(profile?.phone        ?? '');
    setEditBirthDate(profile?.birthDate ?? '');
    setSaveError('');
    setEditing(true);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true); setSaveError('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        fullName:  editFullName,
        country:   editCountry,
        city:      editCity,
        phone:     editPhone,
        birthDate: editBirthDate,
      });
      await refreshProfile();
      setEditing(false);
    } catch {
      setSaveError(t.profile.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    router.push('/');
  }

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: '#C0CEB9' }}>

      {/* ── Профиль-шапка ─────────────────────────────────── */}
      <div className="px-4 pt-6 pb-4 max-w-5xl mx-auto">
        <div className="bg-white/60 backdrop-blur rounded-3xl px-5 py-4 flex items-center gap-4">
          {/* Аватар */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl font-bold text-white"
               style={{ backgroundColor: '#73907E' }}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs opacity-60" style={{ color: '#21393B' }}>{t.profile.welcome}</p>
            <p className="font-bold text-base leading-tight truncate" style={{ color: '#21393B' }}>
              {profile?.fullName || profile?.nick || 'Пользователь'}
            </p>
            <p className="text-xs opacity-60 truncate" style={{ color: '#21393B' }}>
              {profile?.email || user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-white/50"
            style={{ borderColor: '#21393B', color: '#21393B' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t.profile.logout}
          </button>
        </div>
      </div>

      {/* ── Основной контент ──────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* ── Левая колонка: карточки ─────────────────── */}
          <div className="flex flex-col gap-4 lg:w-[340px] shrink-0">

            {/* Текущий этап */}
            <InfoCard
              iconColor="#73907E"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              title={t.profile.currentStage}
            >
              {consultLoading ? (
                <div className="h-5 w-36 bg-gray-100 rounded animate-pulse" />
              ) : consult ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[15px]" style={{ color: '#21393B' }}>
                    {STAGES[(stage || 1) - 1]?.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#DAE3E8', color: '#21393B' }}>
                    {stage}/7
                  </span>
                </div>
              ) : (
                <p className="text-sm opacity-50" style={{ color: '#21393B' }}>{t.profile.noActiveRequest}</p>
              )}
            </InfoCard>

            {/* Назначенная больница */}
            <InfoCard
              iconColor="#73907E"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9" />
                </svg>
              }
              title={t.profile.assignedHospital}
            >
              {consultLoading ? (
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
              ) : consult ? (
                <>
                  <p className="font-bold text-[15px]" style={{ color: '#21393B' }}>{consult.clinicName}</p>
                  {consult.specialty && (
                    <p className="text-sm opacity-60" style={{ color: '#21393B' }}>{consult.specialty}</p>
                  )}
                </>
              ) : (
                <p className="text-sm opacity-50" style={{ color: '#21393B' }}>{t.profile.notAssigned}</p>
              )}
            </InfoCard>

            {/* Координатор */}
            <InfoCard
              iconColor="#73907E"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              title={t.profile.coordinator}
            >
              {consultLoading ? (
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              ) : consult?.coordinator ? (
                <>
                  <p className="font-semibold text-[15px]" style={{ color: '#21393B' }}>{consult.coordinator.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <img src="/icons/phoneauth.svg" alt="" className="w-3.5 h-3.5 opacity-60" />
                    <p className="text-sm opacity-70" style={{ color: '#21393B' }}>{consult.coordinator.phone}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm opacity-50" style={{ color: '#21393B' }}>{t.profile.toBeDetermined}</p>
              )}
            </InfoCard>

            {/* Следующий приём */}
            <InfoCard
              iconColor="#73907E"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              title={t.profile.nextAppointment}
            >
              {consultLoading ? (
                <div className="h-8 w-28 bg-gray-100 rounded animate-pulse" />
              ) : consult?.consultDate ? (
                <p className="text-2xl font-bold" style={{ color: '#21393B' }}>{consult.consultDate}</p>
              ) : (
                <p className="text-sm opacity-50" style={{ color: '#21393B' }}>{t.profile.notAssigned}</p>
              )}
            </InfoCard>

            {/* Редактировать профиль */}
            {!editing ? (
              <button
                onClick={startEdit}
                className="w-full py-3 rounded-2xl text-sm font-medium border transition-colors hover:bg-white/40"
                style={{ borderColor: '#21393B', color: '#21393B' }}
              >
                {t.profile.editProfile}
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
                <p className="font-semibold text-sm" style={{ color: '#21393B' }}>{t.profile.editingProfile}</p>
                {[
                  { label: t.profile.fullName,  value: editFullName,  set: setEditFullName },
                  { label: t.profile.country,   value: editCountry,   set: setEditCountry },
                  { label: t.profile.city,      value: editCity,      set: setEditCity },
                  { label: t.profile.phone,     value: editPhone,     set: setEditPhone },
                  { label: t.profile.birthDate, value: editBirthDate, set: setEditBirthDate },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="text-xs opacity-60 mb-1 block" style={{ color: '#21393B' }}>{label}</label>
                    <input
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none"
                      style={{ borderColor: '#DAE3E8', color: '#21393B' }}
                    />
                  </div>
                ))}
                {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: '#73907E' }}
                  >
                    {saving ? t.profile.saving : t.profile.save}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm border transition-colors"
                    style={{ borderColor: '#DAE3E8', color: '#21393B' }}
                  >
                    {t.profile.cancel}
                  </button>
                </div>
              </div>
            )}

            {role === 'admin' && (
              <Link
                href="/admin-panel"
                className="flex items-center justify-between w-full bg-white/60 rounded-2xl px-5 py-4 hover:bg-white/80 transition-colors"
              >
                <span className="font-semibold text-sm" style={{ color: '#21393B' }}>{t.profile.adminPanel}</span>
                <span style={{ color: '#21393B' }}>→</span>
              </Link>
            )}
            {role === 'consultant' && (
              <Link
                href="/consultant-panel"
                className="flex items-center justify-between w-full bg-white/60 rounded-2xl px-5 py-4 hover:bg-white/80 transition-colors"
              >
                <span className="font-semibold text-sm" style={{ color: '#21393B' }}>{t.profile.consultPanel}</span>
                <span style={{ color: '#21393B' }}>→</span>
              </Link>
            )}
          </div>

          {/* ── Правая колонка: таймлайн ─────────────────── */}
          <div className="flex-1 flex flex-col gap-5">
            <div className="bg-white rounded-3xl p-6">
              <div className="flex flex-col gap-0">
                {STAGES.map((s, i) => {
                  const idx      = i + 1;
                  const isCurrent  = idx === stage;
                  const isDone     = idx < stage;
                  const isFuture   = idx > stage;
                  const isLast     = i === STAGES.length - 1;

                  return (
                    <div key={i} className="flex gap-4">
                      {/* Линия + кружок */}
                      <div className="flex flex-col items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
                          style={{
                            backgroundColor: isDone ? '#73907E' : isCurrent ? '#21393B' : 'transparent',
                            border: isFuture ? '2px solid #DAE3E8' : 'none',
                            color:  isDone || isCurrent ? 'white' : '#B0BEC5',
                          }}
                        >
                          {isDone ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : s.icon}
                        </div>
                        {!isLast && (
                          <div className="w-0.5 flex-1 my-1" style={{ backgroundColor: isDone ? '#73907E' : '#DAE3E8', minHeight: '24px' }} />
                        )}
                      </div>

                      {/* Контент */}
                      <div className={`pb-5 flex-1 min-w-0 ${isLast ? 'pb-0' : ''}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: isFuture ? '#21393B' : '#21393B', opacity: isFuture ? 0.4 : 1 }}
                          >
                            {s.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: '#4CAF50' }}>
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: '#21393B', opacity: isFuture ? 0.35 : 0.6 }}>
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Баннер координатора ──────────────────── */}
            <div className="rounded-3xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap" style={{ backgroundColor: '#2D4A3E' }}>
              <div>
                <p className="font-semibold text-white text-sm">{t.profile.needHelp}</p>
                <p className="text-xs mt-0.5 text-white/70">
                  {consult?.coordinator
                    ? `${t.profile.coordinator} ${consult.coordinator.name} ${t.profile.coordinatorAvailable}`
                    : t.profile.coordinatorDefault}
                </p>
              </div>
              <Link
                href="/consult"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/90 border border-white/30 hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                <img src="/icons/phoneauth.svg" alt="" className="w-4 h-4 opacity-80" />
                {t.profile.coordinatorCall}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon, iconColor, title, children,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 flex items-center justify-center" style={{ color: iconColor }}>
          {icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: iconColor }}>
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}
