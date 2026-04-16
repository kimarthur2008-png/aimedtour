import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Hospital } from './useHospitals';

export interface WizardStep {
  id: string;
  q: string;
  sub: string;
  options: { icon: string; label: string }[];
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'category',
    q: 'Какое направление медицины вас интересует?',
    sub: 'Выберите наиболее подходящую область',
    options: [
      { icon: '🎗️', label: 'Онкология' },
      { icon: '❤️',  label: 'Кардиология' },
      { icon: '🦴',  label: 'Ортопедия' },
      { icon: '🧠',  label: 'Неврология' },
      { icon: '🔬',  label: 'Трансплантология' },
      { icon: '💉',  label: 'Пластическая хирургия' },
    ],
  },
  {
    id: 'urgency',
    q: 'Насколько срочно нужна помощь?',
    sub: 'Это влияет на приоритет подбора',
    options: [
      { icon: '🚨', label: 'Срочно (в течение месяца)' },
      { icon: '📅', label: 'В ближайшие 3 месяца' },
      { icon: '🗓️', label: 'В течение полугода' },
      { icon: '🤔', label: 'Пока изучаю варианты' },
    ],
  },
  {
    id: 'budget',
    q: 'Какой примерный бюджет на лечение?',
    sub: 'Без учёта перелёта и проживания',
    options: [
      { icon: '💵', label: 'До $5,000' },
      { icon: '💴', label: '$5,000 — $15,000' },
      { icon: '💶', label: '$15,000 — $30,000' },
      { icon: '💷', label: 'Свыше $30,000' },
    ],
  },
  {
    id: 'lang',
    q: 'Нужен ли переводчик / сопровождение?',
    sub: 'Мы обеспечиваем полное сопровождение',
    options: [
      { icon: '🌐', label: 'Да, нужен русскоязычный координатор' },
      { icon: '🗣️', label: 'Говорю по-английски — переводчик не нужен' },
      { icon: '✈️', label: 'Нужна помощь с визой и перелётом' },
      { icon: '🏠', label: 'Нужно помочь с жильём рядом с клиникой' },
    ],
  },
  {
    id: 'cert',
    q: 'Важна ли международная аккредитация?',
    sub: 'JCI — самый строгий международный стандарт',
    options: [
      { icon: '🏆', label: 'Только JCI-аккредитованные' },
      { icon: '✅', label: 'JCI или KOIHA — любая аккредитация' },
      { icon: '🎯', label: 'Главное — специализация, не сертификат' },
      { icon: '❓', label: 'Не знаю, что выбрать' },
    ],
  },
];

export type WizardAnswers = Record<string, string>;

export interface MatchedHospital extends Hospital {
  score: number;
  matchPercent: number;
}

/** Алгоритм подбора: взвешенный скоринг по специализации и сертификатам */
function scoreHospitals(hospitals: Hospital[], answers: WizardAnswers): MatchedHospital[] {
  const cat  = answers['category'] || '';
  const cert = answers['cert']     || '';

  const scored = hospitals.map((h) => {
    let score = 0;
    // +40 за совпадение специализации
    if ((h.specializations || []).some((s) =>
      s.toLowerCase().includes(cat.toLowerCase().split(' ')[0])
    )) score += 40;
    // +30 за JCI если пользователь выбрал JCI
    if (cert.includes('JCI')   && (h.certifications || []).includes('JCI'))   score += 30;
    // +20 за KOIHA
    if (cert.includes('KOIHA') && (h.certifications || []).includes('KOIHA')) score += 20;
    // +10 за любую аккредитацию
    if ((h.certifications || []).length > 0) score += 10;
    return { ...h, score, matchPercent: 0 };
  });

  scored.sort((a, b) => b.score - a.score);
  const top3 = scored.slice(0, 3);

  // Визуальный % совпадения (95 / 83 / 71 для топ-3)
  return top3.map((h, i) => ({ ...h, matchPercent: Math.min(95 - i * 12, 99) }));
}

export function useWizard(hospitals: Hospital[]) {
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [results, setResults] = useState<MatchedHospital[] | null>(null);

  const totalSteps = WIZARD_STEPS.length;
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
      // Сохраняем результат в Firestore если пользователь авторизован
      const currentUser = auth.currentUser;
      if (currentUser) {
        addDoc(collection(db, 'algorithmResults'), {
          userId:       currentUser.uid,
          answers,
          topHospitals: top3.map((h) => h.name),
          createdAt:    serverTimestamp(),
        }).catch(console.error);
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
    step,
    totalSteps,
    currentStep,
    answers,
    results,
    isDone,
    isLastStep,
    selectOption,
    next,
    back,
    reset,
  };
}
