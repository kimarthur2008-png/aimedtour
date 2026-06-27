'use client';

import { useEffect, useState, useMemo } from 'react';
import { useHospitals } from '@/hooks/useHospitals';
import { useWizard, type MatchedHospital } from '@/hooks/useWizard';
import { useAuth } from '@/context/AuthContext';
import Wizard from '@/components/Wizard';
import WizardResult from '@/components/WizardResult';
import Link from 'next/link';

export default function QuizPage() {
    const { profile, loading: authLoading, refreshProfile, patchProfile } = useAuth();
    const { hospitals, loading: hospitalsLoading } = useHospitals();
    const wizard = useWizard(hospitals);

    const [retaking, setRetaking] = useState(false);

    useEffect(() => {
        if (!wizard.isDone || !wizard.results) return;
        // Немедленно обновляем профиль в памяти (и localStorage-кэше),
        // чтобы при уходе со страницы и возврате quizResult был доступен без round-trip.
        patchProfile({
            quizResult: {
                topHospitalIds:   wizard.results.map((h) => h.id),
                topHospitalNames: wizard.results.map((h) => h.name),
                matchPercents:    wizard.results.map((h) => h.matchPercent),
                savedAt:          new Date().toISOString(),
            },
        });
        refreshProfile(); // фоновый Firestore-синк на случай рассинхрона
    }, [wizard.isDone]);

    const loading   = authLoading || hospitalsLoading;
    const savedQuiz = profile?.quizResult;

    const savedResults = useMemo<MatchedHospital[] | null>(() => {
        if (!savedQuiz || !hospitals.length) return null;
        return savedQuiz.topHospitalIds
            .map((id, i) => {
                const h = hospitals.find((h) => h.id === id);
                if (!h) return null;
                return { ...h, score: 0, matchPercent: savedQuiz.matchPercents[i] } as MatchedHospital;
            })
            .filter((x): x is MatchedHospital => x !== null);
    }, [savedQuiz, hospitals]);

    function handleRetake() {
        setRetaking(true);
        wizard.reset();
    }

    // ── Не авторизован ─────────────────────────────────────────────────────────
    if (!authLoading && !profile) {
        return (
            <div className="min-h-page flex items-center justify-center px-4"
                 style={{ background: '#C0CEB9' }}>
                <div className="bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
                    <img src="/icons/passwordauth.svg" alt="Lock Icon" className="w-12 h-12 mx-auto my-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Войдите в аккаунт</h1>
                    <p className="text-gray-500 text-sm mb-8">
                        Чтобы пройти опросник и получить персональные рекомендации клиник,
                        необходимо войти или создать аккаунт.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/auth?tab=login"
                            className="px-6 py-2.5 rounded-xl bg-[#628473] text-white text-sm font-medium hover:bg-[#628473]/85 transition-colors active:scale-95 touch-manipulation">
                            Войти
                        </Link>
                        <Link href="/auth?tab=register"
                            className="px-6 py-2.5 rounded-xl border border-[#628473] text-sm font-medium text-[#628473] hover:bg-[#628473]/10 transition-colors active:scale-95 touch-manipulation">
                            Зарегистрироваться
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Загрузка ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-page flex items-center justify-center"
                 style={{ background: '#C0CEB9' }}>
                <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
        );
    }

    // ── Свежие результаты после прохождения ────────────────────────────────────
    if (wizard.isDone) {
        return (
            <div className="min-h-page py-12 px-4" style={{ background: '#C0CEB9' }}>
                <div className="max-w-4xl mx-auto">
                    <WizardResult results={wizard.results!} onReset={wizard.reset} />
                </div>
            </div>
        );
    }

    // ── Сохранённые результаты (сразу при заходе) ──────────────────────────────
    if (savedQuiz && savedResults && !retaking) {
        return (
            <div className="min-h-page py-12 px-4" style={{ background: '#C0CEB9' }}>
                <div className="max-w-4xl mx-auto">
                    <WizardResult results={savedResults} onReset={handleRetake} savedAt={savedQuiz.savedAt} />
                </div>
            </div>
        );
    }

    // ── Квиз ──────────────────────────────────────────────────────────────────
    return (
        <Wizard
            step={wizard.step}
            totalSteps={wizard.totalSteps}
            currentStep={wizard.currentStep}
            answers={wizard.answers}
            isLastStep={wizard.isLastStep}
            onSelect={wizard.selectOption}
            onNext={wizard.next}
            onBack={wizard.back}
        />
    );
}
