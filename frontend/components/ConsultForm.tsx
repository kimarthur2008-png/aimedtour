'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useHospitals } from '@/hooks/useHospitals';
import type { MatchedHospital } from '@/hooks/useWizard';
import DateInputDMY from '@/components/DateInputDMY';

interface QuizResult {
  topHospitalIds:   string[];
  topHospitalNames: string[];
  matchPercents:    number[];
  savedAt:          string;
}

interface Props {
  topHospitals?: MatchedHospital[];
}

const COUNTRIES = ['Кыргызстан', 'Казахстан', 'Россия', 'Узбекистан', 'Таджикистан', 'Другое'];

export default function ConsultForm({ topHospitals: propTop }: Props) {
  const { profile } = useAuth();
  const { hospitals, loading: hospitalsLoading } = useHospitals();

  // Один объект — prefill из профиля при инициализации компонента
  const [fields, setFields] = useState({
    name:      profile?.fullName  ?? '',
    birthDate: profile?.birthDate ?? '',
    phone:     profile?.phone     ?? '',
    country:   profile?.country   ?? '',
    email:     profile?.email     ?? '',
    clinicId:  '',
    date:      '',
    message:   '',
  });

  // Заполняем поля из профиля когда он загрузится, не перезаписывая то, что уже ввёл пользователь
  useEffect(() => {
    if (!profile) return;
    setFields((prev) => ({
      ...prev,
      name:      prev.name      || profile.fullName  || '',
      birthDate: prev.birthDate || profile.birthDate || '',
      phone:     prev.phone     || profile.phone     || '',
      country:   prev.country   || profile.country   || '',
      email:     prev.email     || profile.email     || '',
    }));
  }, [profile]);

  const set =
      (key: keyof typeof fields) =>
          (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
              setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // quizResult читаем напрямую из profile — никакого setState внутри useEffect
  const savedQuiz = profile?.quizResult as QuizResult | undefined;

  // Топ-3: сначала пропс (только что прошли квиз), потом из профиля
  const topIds: string[] = propTop
      ? propTop.map((h) => h.id)
      : (savedQuiz?.topHospitalIds ?? []);

  const topPercents: Record<string, number> = propTop
      ? Object.fromEntries(propTop.map((h) => [h.id, h.matchPercent]))
      : Object.fromEntries(
          (savedQuiz?.topHospitalIds ?? []).map((id, i) => [id, savedQuiz?.matchPercents[i] ?? 0])
      );

  const topClinics   = hospitals.filter((h) => topIds.includes(h.id));
  const otherClinics = hospitals.filter((h) => !topIds.includes(h.id));

  async function handleSubmit() {
    if (!fields.name || !fields.email || !fields.clinicId || !fields.date) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const selectedClinic = hospitals.find((h) => h.id === fields.clinicId);
      await addDoc(collection(db, 'consultations'), {
        name:        fields.name,
        birthDate:   fields.birthDate,
        phone:       fields.phone,
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
      setFields((prev) => ({ ...prev, clinicId: '', date: '', message: '' }));
    } catch {
      setStatus('error');
    }
  }

  const inputCls =
      'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white';

  const hasQuizResults = topClinics.length > 0;

  return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-lg w-full mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Записаться на консультацию</h2>
        <p className="text-sm text-gray-400 mb-6">Менеджер свяжется с вами в течение 24 часов</p>

        <div className="flex flex-col gap-3">

          <input
              value={fields.name}
              onChange={set('name')}
              placeholder="Имя *"
              className={inputCls}
          />
          <DateInputDMY
              value={fields.birthDate}
              onChange={(v) => setFields((prev) => ({ ...prev, birthDate: v }))}
              icon="/icons/dateauth.svg"
          />
          <input
              value={fields.phone}
              onChange={set('phone')}
              placeholder="Телефон / WhatsApp"
              className={inputCls}
          />
          <select value={fields.country} onChange={set('country')} className={inputCls}>
            <option value="">Выберите страну</option>
            {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
              value={fields.email}
              onChange={set('email')}
              placeholder="Email *"
              type="email"
              className={inputCls}
          />

          {/* Выбор клиники */}
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Выберите клинику *</p>
            {hospitalsLoading ? (
                <p className="text-sm text-gray-400">Загрузка клиник...</p>
            ) : (
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {hasQuizResults && (
                      <>
                        <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide px-1">
                          🎯 Подобрано для вас
                        </p>
                        {topClinics.map((h) => (
                            <button
                                key={h.id}
                                type="button"
                                onClick={() => setFields((prev) => ({ ...prev, clinicId: h.id }))}
                                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors text-sm ${
                                    fields.clinicId === h.id
                                        ? 'border-teal-500 bg-teal-50'
                                        : 'border-teal-200 bg-teal-50/40 hover:border-teal-400'
                                }`}
                            >
                              <span className="font-medium text-gray-900">{h.name}</span>
                              <span className="ml-2 text-xs text-teal-600 font-semibold">
                        {topPercents[h.id]}% совпадение
                      </span>
                            </button>
                        ))}
                        {otherClinics.length > 0 && (
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-1 mt-1">
                              Другие клиники
                            </p>
                        )}
                      </>
                  )}
                  {otherClinics.map((h) => (
                      <button
                          key={h.id}
                          type="button"
                          onClick={() => setFields((prev) => ({ ...prev, clinicId: h.id }))}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${
                              fields.clinicId === h.id
                                  ? 'border-teal-500 bg-teal-50'
                                  : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <span className="font-medium text-gray-900">{h.name}</span>
                      </button>
                  ))}
                </div>
            )}
          </div>

          {/* Дата консультации */}
          <div className="mt-1">
            <p className="text-sm font-medium text-gray-700 mb-1">Желаемая дата консультации *</p>
            <input
                value={fields.date}
                onChange={set('date')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className={inputCls}
            />
          </div>

          <textarea
              value={fields.message}
              onChange={set('message')}
              placeholder="Дополнительная информация"
              rows={3}
              className={`${inputCls} resize-none`}
          />

          {status === 'error' && (
              <p className="text-red-500 text-xs">Заполните обязательные поля: имя, email, клиника, дата</p>
          )}
          {status === 'success' && (
              <p className="text-teal-600 text-sm font-medium">
                ✅ Заявка отправлена! Менеджер свяжется с вами в течение 24 часов.
              </p>
          )}

          <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              className="w-full py-3 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition-colors disabled:opacity-50 mt-1"
          >
            {status === 'loading' ? 'Отправляем...' : 'Отправить заявку'}
          </button>
        </div>
      </div>
  );
}