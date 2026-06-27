'use client';

import { useState, useEffect, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useHospitals } from '@/hooks/useHospitals';
import type { MatchedHospital } from '@/hooks/useWizard';
import DateInputDMY from '@/components/DateInputDMY';
import Select, { components } from 'react-select';
import countries from 'i18n-iso-countries';
import ru from 'i18n-iso-countries/langs/ru.json';
import en from 'i18n-iso-countries/langs/en.json';
import ko from 'i18n-iso-countries/langs/ko.json';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

countries.registerLocale(ru);
countries.registerLocale(en);
countries.registerLocale(ko);

const countryOptionsByLang = {
  RU: Object.entries(countries.getNames('ru')).map(([code, name]) => ({ value: code, label: name as string })),
  EN: Object.entries(countries.getNames('en')).map(([code, name]) => ({ value: code, label: name as string })),
  KO: Object.entries(countries.getNames('ko')).map(([code, name]) => ({ value: code, label: name as string })),
};

const CountryValueContainer = ({ children, ...props }: any) => (
  <components.ValueContainer {...props}>
    <img src="/icons/countryauth.svg" className="w-5 h-5 shrink-0 mr-3" />
    {children}
  </components.ValueContainer>
);

const selectStyles = {
  control: (base: any) => ({
    ...base,
    border: '1.5px solid #DAE3E8',
    borderRadius: '16px',
    padding: '0 8px 0 12px',
    boxShadow: 'none',
    backgroundColor: 'transparent',
    minHeight: '54px',
    fontSize: 'clamp(15px, 0.8vw + 12px, 17px)',
    color: '#21393B',
    '&:hover': { borderColor: '#DAE3E8' },
  }),
  valueContainer: (base: any) => ({ ...base, display: 'flex', alignItems: 'center', padding: '0 0 0 4px' }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '16px',
    border: '1.5px solid #DAE3E8',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    fontSize: '14px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? 'rgba(76,109,124,0.1)' : 'white',
    color: '#21393B',
    cursor: 'pointer',
  }),
  placeholder: (base: any) => ({ ...base, color: '#21393B', opacity: 0.4 }),
  singleValue:  (base: any) => ({ ...base, color: '#21393B' }),
  input:        (base: any) => ({ ...base, color: '#21393B' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base: any) => ({ ...base, color: 'rgba(33,57,59,0.4)' }),
};

interface QuizResult {
  topHospitalIds:   string[];
  topHospitalNames: string[];
  matchPercents:    number[];
  savedAt:          string;
}

interface Props {
  topHospitals?: MatchedHospital[];
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label" style={{ color: '#21393B' }}>{label}</label>
      {children}
    </div>
  );
}

function InputField({ icon, ...props }: { icon?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={{ border: '1.5px solid #DAE3E8' }}>
      {icon && <img src={icon} className="w-5 h-5 shrink-0 pointer-events-none" />}
      <input
        {...props}
        className="flex-1 text-body outline-none bg-transparent"
        style={{ color: '#21393B' }}
      />
    </div>
  );
}

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 28 : -28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -28 : 28, opacity: 0 }),
};

export default function ConsultForm({ topHospitals: propTop }: Props) {
  const { profile } = useAuth();
  const { hospitals, loading: hospitalsLoading } = useHospitals();
  const { lang, t } = useLanguage();
  const countryOptions = countryOptionsByLang[lang];
  const c = t.consult;

  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [step, setStep]           = useState(0);
  const [direction, setDirection] = useState(1);
  const [status, setStatus]       = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError]         = useState('');

  const [fields, setFields] = useState({
    name:      profile?.fullName  ?? '',
    birthDate: profile?.birthDate ?? '',
    country:   profile?.country   ?? '',
    email:     profile?.email     ?? '',
    clinicId:  '',
    date:      '',
    message:   '',
  });

  useEffect(() => {
    if (!profile) return;
    startTransition(() => {
      setFields((prev) => ({
        ...prev,
        name:      prev.name      || profile.fullName  || '',
        birthDate: prev.birthDate || profile.birthDate || '',
        country:   prev.country   || profile.country   || '',
        email:     prev.email     || profile.email     || '',
      }));
    });
  }, [profile]);

  const set = (key: keyof typeof fields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const savedQuiz    = profile?.quizResult as QuizResult | undefined;
  const topIds       = propTop ? propTop.map((h) => h.id) : (savedQuiz?.topHospitalIds ?? []);
  const topPercents  = propTop
    ? Object.fromEntries(propTop.map((h) => [h.id, h.matchPercent]))
    : Object.fromEntries((savedQuiz?.topHospitalIds ?? []).map((id, i) => [id, savedQuiz?.matchPercents[i] ?? 0]));
  const topClinics   = hospitals
    .filter((h) => topIds.includes(h.id))
    .sort((a, b) => (topPercents[b.id] ?? 0) - (topPercents[a.id] ?? 0));
  const otherClinics = hospitals.filter((h) => !topIds.includes(h.id));

  function goNext() {
    setError('');
    if (step === 0) {
      if (!fields.name)      { setError(c.errName); return; }
      if (!fields.birthDate) { setError(c.errBirth); return; }
      if (!fields.country)   { setError(c.errCountry); return; }
      if (!fields.email)     { setError(c.errEmail); return; }
    }
    if (step === 1 && !fields.clinicId) { setError(c.errClinic); return; }
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setError('');
    setDirection(-1);
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    if (!fields.date) { setError(c.errDate); return; }
    setStatus('loading'); setError('');
    try {
      const selectedClinic = hospitals.find((h) => h.id === fields.clinicId);
      await addDoc(collection(db, 'consultations'), {
        name:        fields.name,
        birthDate:   fields.birthDate,
        country:     fields.country,
        email:       fields.email,
        clinicId:    fields.clinicId,
        clinicName:  selectedClinic?.name ?? '',
        consultDate: fields.date,
        message:     fields.message,
        status:      'new',
        createdAt:   serverTimestamp(),
        userId:      profile?.uid ?? null,
      });
      setStatus('success');
    } catch {
      setStatus('error');
      setError(c.errSubmit);
    }
  }

  const STEP_TITLES = [c.stepPersonal, c.stepClinic, c.stepDetails];

  return (
    <div className="min-h-page flex flex-col items-center justify-center px-6 py-12" style={{ backgroundColor: '#C0CEB9' }}>
      <h1 className="text-h2 font-bold mb-6 text-center" style={{ color: '#21393B' }}>
        {c.formTitle}
      </h1>

      {/* ── Мягкий барьер ──────────────────────────────────────── */}
      <AnimatePresence>
        {!nudgeDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.28 }}
            className="w-full max-w-140 mb-4 rounded-2xl p-5 flex gap-4"
            style={{ backgroundColor: '#E8F0EE', border: '1.5px solid #B8CFC8' }}
          >
            <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#73907E' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm mb-0.5" style={{ color: '#21393B' }}>{c.nudgeTitle}</p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#21393B', opacity: 0.7 }}>{c.nudgeDesc}</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/chat"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#4C6D7C' }}
                >
                  {c.nudgeChat}
                </Link>
                <button
                  onClick={() => setNudgeDismissed(true)}
                  className="px-4 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-black/5"
                  style={{ color: '#21393B', opacity: 0.6 }}
                >
                  {c.nudgeDismiss}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        className="w-full max-w-[560px] bg-white rounded-3xl p-8 md:p-10"
        style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}
        transition={{ layout: { type: 'spring', duration: 0.45, bounce: 0.18 } }}
      >
        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-6 text-center"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EDF2EE' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#73907E" strokeWidth={2.5} className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-h2 font-semibold" style={{ color: '#21393B' }}>{c.successTitle}</h2>
            <p className="text-body" style={{ color: '#21393B', opacity: 0.6 }}>
              {c.formDesc}
            </p>
          </motion.div>
        ) : (
          <>
            {/* Шаг-индикатор */}
            <div className="flex items-center gap-2 mb-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors duration-300"
                    style={{
                      backgroundColor: i < step ? '#73907E' : i === step ? '#21393B' : '#F0F2EE',
                      color:           i <= step ? 'white' : 'rgba(33,57,59,0.35)',
                    }}
                  >
                    {i < step
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : i + 1
                    }
                  </div>
                  {i < 2 && (
                    <div
                      className="flex-1 h-px transition-colors duration-300"
                      style={{ backgroundColor: i < step ? '#73907E' : '#DAE3E8' }}
                    />
                  )}
                </div>
              ))}
            </div>

            <motion.h2
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-h2 font-semibold mb-6"
              style={{ color: '#21393B' }}
            >
              {STEP_TITLES[step]}
            </motion.h2>

            {/* Контент шагов */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <AnimatePresence mode="popLayout" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="flex flex-col gap-4"
                >

                  {/* ── Шаг 1: Личные данные ── */}
                  {step === 0 && (
                    <>
                      <Field label={c.name}>
                        <InputField
                          icon="/icons/nameauth.svg"
                          placeholder={c.namePh}
                          value={fields.name}
                          onChange={set('name')}
                        />
                      </Field>
                      <Field label={c.birthDate}>
                        <DateInputDMY
                          value={fields.birthDate}
                          onChange={(v) => setFields((prev) => ({ ...prev, birthDate: v }))}
                          icon="/icons/dateauth.svg"
                        />
                      </Field>
                      <Field label={c.countryLabel}>
                        <Select
                          instanceId="consult-country"
                          options={countryOptions}
                          placeholder={c.countryPh}
                          components={{ ValueContainer: CountryValueContainer }}
                          value={countryOptions.find(o => o.label === fields.country) ?? null}
                          onChange={(opt) => setFields((prev) => ({ ...prev, country: opt?.label ?? '' }))}
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          menuPosition="fixed"
                          styles={{ ...selectStyles, menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                        />
                      </Field>
                      <Field label={c.email}>
                        <InputField
                          icon="/icons/emailauth.svg"
                          placeholder="you@example.com"
                          type="email"
                          value={fields.email}
                          onChange={set('email')}
                        />
                      </Field>
                    </>
                  )}

                  {/* ── Шаг 2: Выбор клиники ── */}
                  {step === 1 && (
                    <div className="flex flex-col gap-2">
                      {hospitalsLoading ? (
                        <div className="flex flex-col gap-2">
                          {[1,2,3].map((i) => <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ backgroundColor: '#F0F2EE' }} />)}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                          {topClinics.length > 0 && (
                            <>
                              <p className="text-xs font-semibold uppercase tracking-wide px-1 mb-1" style={{ color: '#73907E' }}>
                                {c.topMatches}
                              </p>
                              {topClinics.map((h) => (
                                <button
                                  key={h.id}
                                  type="button"
                                  onClick={() => setFields((prev) => ({ ...prev, clinicId: h.id }))}
                                  className="w-full text-left px-4 py-3 rounded-2xl transition-colors text-sm"
                                  style={{
                                    border: fields.clinicId === h.id ? '2px solid #21393B' : '1.5px solid #73907E40',
                                    backgroundColor: fields.clinicId === h.id ? '#21393B08' : '#73907E08',
                                  }}
                                >
                                  <span className="font-medium" style={{ color: '#21393B' }}>{h.name}</span>
                                  <span className="ml-2 text-xs font-semibold" style={{ color: '#73907E' }}>
                                    {topPercents[h.id]}% {c.matchPercent}
                                  </span>
                                </button>
                              ))}
                              {otherClinics.length > 0 && (
                                <p className="text-xs font-medium uppercase tracking-wide px-1 mt-2 mb-1" style={{ color: '#21393B', opacity: 0.35 }}>
                                  {c.otherClinics}
                                </p>
                              )}
                            </>
                          )}
                          {otherClinics.map((h) => (
                            <button
                              key={h.id}
                              type="button"
                              onClick={() => setFields((prev) => ({ ...prev, clinicId: h.id }))}
                              className="w-full text-left px-4 py-3 rounded-2xl transition-colors text-sm"
                              style={{
                                border: fields.clinicId === h.id ? '2px solid #21393B' : '1.5px solid #DAE3E8',
                                backgroundColor: fields.clinicId === h.id ? '#21393B08' : 'transparent',
                              }}
                            >
                              <span className="font-medium" style={{ color: '#21393B' }}>{h.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Шаг 3: Дата и детали ── */}
                  {step === 2 && (
                    <>
                      <Field label={c.consultDate}>
                        <InputField
                          icon="/icons/dateauth.svg"
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={fields.date}
                          onChange={set('date')}
                        />
                      </Field>
                      <Field label={c.message}>
                        <div className="rounded-2xl px-4 py-3.5" style={{ border: '1.5px solid #DAE3E8' }}>
                          <textarea
                            value={fields.message}
                            onChange={set('message')}
                            placeholder={c.messagePh}
                            rows={4}
                            className="w-full text-body outline-none bg-transparent resize-none"
                            style={{ color: '#21393B' }}
                          />
                        </div>
                      </Field>
                    </>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Ошибка */}
            {error && (
              <p className="text-caption mt-3" style={{ color: '#e53e3e' }}>{error}</p>
            )}

            {/* Кнопки навигации */}
            <div className={`flex gap-3 mt-6 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
              {step > 0 && (
                <button
                  onClick={goBack}
                  className="px-6 py-3.5 rounded-2xl text-btn transition-colors"
                  style={{ border: '1.5px solid #DAE3E8', color: '#21393B' }}
                >
                  {c.back}
                </button>
              )}
              {step < 2 ? (
                <button
                  onClick={goNext}
                  className="flex-1 py-3.5 rounded-2xl text-btn-lg text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#73907E' }}
                >
                  {c.next}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={status === 'loading'}
                  className="flex-1 py-3.5 rounded-2xl text-btn-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#21393B' }}
                >
                  {status === 'loading' ? c.submitting : c.submit}
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
