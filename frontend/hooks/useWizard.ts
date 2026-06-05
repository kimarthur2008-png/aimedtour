import { useState } from 'react';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Hospital } from './useHospitals';

const PH = '/icons/wizard/placeholder.svg';

// Основные варианты первого шага (показываются как карточки)
export const CATEGORY_PRIMARY = [
  { icon: '/icons/wizard/dentist.png', label: 'Стоматология' },
  { icon: '/icons/wizard/plastic-surgery.png', label: 'Пластическая хирургия' },
  { icon: '/icons/wizard/diagnosis.png', label: 'Диагностика' },
];

// Дополнительные варианты первого шага (в дропдауне «Другое»)
export const CATEGORY_OTHER = [
  { icon: '/icons/wizard/ivf.png', label: 'ЭКО / Роды' },
  { icon: '/icons/wizard/orthopedist.png', label: 'Ортопедия' },
  { icon: '/icons/wizard/cardiologist.png', label: 'Кардиология' },
  { icon: '/icons/wizard/neurologist.png', label: 'Неврология' },
  { icon: '/icons/wizard/ophthalmologist.png', label: 'Офтальмология' },
  { icon: '/icons/wizard/oncologist.png', label: 'Онкология' },
  { icon: '/icons/wizard/rehabilitation.png', label: 'Реабилитация' },
  { icon: '/icons/wizard/transplantation.png', label: 'Трансплантология' },
];

export interface WizardStep {
  id: string;
  q: string;
  sub: string;
  /** Только для шагов 2–5 */
  options?: { icon: string; label: string }[];
  /** Признак того, что этот шаг использует особый UI с дропдауном */
  isCategoryStep?: boolean;
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'category',
    q: 'Какую область здоровья вы хотели бы доверить корейским специалистам?',
    sub: 'Выберите направление или выберите из списка',
    isCategoryStep: true,
  },
  {
    id: 'budget',
    q: 'На какой ценовой сегмент медицинских учреждений вы ориентируетесь?',
    sub: 'Без учёта перелёта и проживания',
    options: [
      { icon: PH, label: 'До $5,000' },          // → /icons/wizard/budget-1.svg
      { icon: PH, label: '$5,000 — $15,000' },    // → /icons/wizard/budget-2.svg
      { icon: PH, label: '$15,000 — $30,000' },   // → /icons/wizard/budget-3.svg
      { icon: PH, label: 'Свыше $30,000' },       // → /icons/wizard/budget-4.svg
    ],
  },
  {
    id: 'lang',
    q: 'Нужен ли переводчик / сопровождение?',
    sub: 'Мы обеспечиваем полное сопровождение',
    options: [
      { icon: PH, label: 'Да, нужен русскоязычный координатор' },   // → /icons/wizard/coordinator.svg
      { icon: PH, label: 'Говорю по-английски — переводчик не нужен' }, // → /icons/wizard/english.svg
      { icon: PH, label: 'Нужна помощь с визой и перелётом' },        // → /icons/wizard/visa.svg
      { icon: PH, label: 'Нужно помочь с жильём рядом с клиникой' },  // → /icons/wizard/housing.svg
    ],
  },
  {
    id: 'cert',
    q: 'Важна ли международная аккредитация?',
    sub: 'JCI — самый строгий международный стандарт',
    options: [
      { icon: PH, label: 'Только JCI-аккредитованные' },             // → /icons/wizard/cert-jci.svg
      { icon: PH, label: 'JCI или KOIHA — любая аккредитация' },     // → /icons/wizard/cert-any.svg
      { icon: PH, label: 'Главное — специализация, не сертификат' }, // → /icons/wizard/cert-spec.svg
      { icon: PH, label: 'Не знаю, что выбрать' },                   // → /icons/wizard/cert-unknown.svg
    ],
  },
  {
    id: 'urgency',
    q: 'В какой период вы рассматриваете возможность визита в Корею?',
    sub: 'Это поможет нам подготовить оптимальное предложение',
    options: [
      { icon: PH, label: 'Срочно (в течение месяца)' },  // → /icons/wizard/urgency-now.svg
      { icon: PH, label: 'В ближайшие 3 месяца' },        // → /icons/wizard/urgency-3m.svg
      { icon: PH, label: 'В течение полугода' },          // → /icons/wizard/urgency-6m.svg
      { icon: PH, label: 'Пока изучаю варианты' },        // → /icons/wizard/urgency-explore.svg
    ],
  },
];

export type WizardAnswers = Record<string, string>;

export interface MatchedHospital extends Hospital {
  score: number;
  matchPercent: number;
}

// Маппинг выбора пользователя → специализации в Firestore
const CATEGORY_TO_SPEC: Record<string, string[]> = {
  'Стоматология':          ['Стоматология'],
  'Пластическая хирургия': ['Пластическая хирургия'],
  'Диагностика':           ['Диагностика'],
  'ЭКО / Роды':            ['Акушерство', 'Гинекология', 'ЭКО'],
  'Ортопедия':             ['Ортопедия'],
  'Кардиология':           ['Кардиология'],
  'Неврология':            ['Неврология', 'Нейрохирургия'],
  'Офтальмология':         ['Офтальмология'],
  'Онкология':             ['Онкология'],
  'Реабилитация':          ['Реабилитация'],
  'Трансплантология':      ['Трансплантология'],
};

const BUDGET_TO_TIER: Record<string, string[]> = {
  'До $5,000':          ['economy'],
  '$5,000 — $15,000':   ['economy', 'mid'],
  '$15,000 — $30,000':  ['mid', 'premium'],
  'Свыше $30,000':      ['premium', 'luxury'],
};

// специализация(50) + JCI(30) + KOIHA(20) + базовая аккредитация(10) + бюджет(20) + срочность(15) = 145
const MAX_SCORE = 145;

function scoreHospitals(hospitals: Hospital[], answers: WizardAnswers): MatchedHospital[] {
  const cat     = answers['category'] || '';
  const cert    = answers['cert']     || '';
  const budget  = answers['budget']   || '';
  const urgency = answers['urgency']  || '';

  const isUrgent     = urgency.includes('Срочно');
  const wantJCI      = cert.includes('JCI');
  const wantKOIHA    = cert.includes('KOIHA');
  const specVariants = CATEGORY_TO_SPEC[cat] || [];
  const budgetTiers  = BUDGET_TO_TIER[budget] || [];

  const scored = hospitals.map((h) => {
    let score = 0;

    const hasSpec = (h.specializations || []).some((s) =>
        specVariants.some((v) => s.toLowerCase().includes(v.toLowerCase()))
    );
    if (hasSpec) score += isUrgent ? Math.round(50 * 1.3) : 50;

    const certs = h.certifications || [];
    if (wantJCI   && certs.includes('JCI'))   score += 30;
    if (wantKOIHA && certs.includes('KOIHA')) score += 20;
    if (certs.length > 0)                     score += 10;

    const hospitalTier = (h as Hospital & { priceRange?: string }).priceRange;
    if (hospitalTier && budgetTiers.includes(hospitalTier)) score += 20;

    if (isUrgent) score += 15;

    return { ...h, score, matchPercent: 0 };
  });

  scored.sort((a, b) => b.score - a.score);
  const top3 = scored.slice(0, 3);

  return top3.map((h) => ({
    ...h,
    matchPercent: Math.min(Math.round((h.score / MAX_SCORE) * 100), 99),
  }));
}

export function useWizard(hospitals: Hospital[]) {
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [results, setResults] = useState<MatchedHospital[] | null>(null);

  const totalSteps  = WIZARD_STEPS.length;
  const currentStep = WIZARD_STEPS[step];
  const isLastStep  = step === totalSteps - 1;
  const isDone      = results !== null;

  function selectOption(stepId: string, label: string) {
    setAnswers((prev) => ({ ...prev, [stepId]: label }));
  }

  function next() {
    if (!answers[currentStep?.id]) return;
    if (isLastStep) {
      const top3 = scoreHospitals(hospitals, answers);
      setResults(top3);
      const currentUser = auth.currentUser;
      if (currentUser) {
        // История результатов
        addDoc(collection(db, 'algorithmResults'), {
          userId:       currentUser.uid,
          answers,
          topHospitals: top3.map((h) => h.name),
          scores:       top3.map((h) => ({ name: h.name, score: h.score, matchPercent: h.matchPercent })),
          createdAt:    serverTimestamp(),
        }).catch(console.error);

        // Последний результат — перезаписывается при каждом прохождении
        setDoc(doc(db, 'users', currentUser.uid), {
          quizResult: {
            topHospitalIds:   top3.map((h) => h.id),
            topHospitalNames: top3.map((h) => h.name),
            matchPercents:    top3.map((h) => h.matchPercent),
            savedAt:          new Date().toISOString(),
          },
        }, { merge: true }).catch(console.error);
      }
    } else {
      setStep((s) => s + 1);
    }
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setResults(null);
  }

  return {
    step, totalSteps, currentStep, answers, results,
    isDone, isLastStep, selectOption, next, back, reset,
  };
}