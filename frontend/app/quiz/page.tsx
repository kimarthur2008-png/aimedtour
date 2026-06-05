'use client';

import { useEffect } from 'react';
import { useHospitals } from '@/hooks/useHospitals';
import { useWizard } from '@/hooks/useWizard';
import { useAuth } from '@/context/AuthContext';
import Wizard from '@/components/Wizard';
import WizardResult from '@/components/WizardResult';
import Link from 'next/link';

export default function QuizPage() {
    const { profile, loading: authLoading, refreshProfile } = useAuth();
    const { hospitals, loading: hospitalsLoading } = useHospitals();
    const wizard = useWizard(hospitals);

    useEffect(() => {
        if (wizard.isDone) refreshProfile();
    }, [wizard.isDone, refreshProfile]);

    const loading = authLoading || hospitalsLoading;

    // if (!authLoading && !profile) {
    //     return (
    //         <div className="min-h-page flex items-center justify-center px-4"
    //              style={{ background: '#C0CEB9' }}>
    //             <div className="bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
    //                 <img src="/icons/passwordauth.svg" alt="Lock Icon" className="w-12 h-12 mx-auto my-4" />
    //                 <h1 className="text-2xl font-bold text-gray-900 mb-2">Войдите в аккаунт</h1>
    //                 <p className="text-gray-500 text-sm mb-8">
    //                     Чтобы пройти опросник и получить персональные рекомендации клиник,
    //                     необходимо войти или создать аккаунт.
    //                 </p>
    //                 <div className="flex gap-3 justify-center">
    //                     <Link
    //                         href="/auth?tab=login"
    //                         className="px-6 py-2.5 rounded-xl bg-[#628473] text-white text-sm font-medium hover:bg-[#628473]/85 transition-colors transition-transform active:scale-95 touch-manipulation"
    //                     >
    //                         Войти
    //                     </Link>
    //                     <Link
    //                         href="/auth?tab=register"
    //                         className="px-6 py-2.5 rounded-xl border border-[#628473] text-sm font-medium text-[#628473] hover:bg-[#628473]/10 transition-colors transition-transform active:scale-95 touch-manipulation"
    //                     >
    //                         Зарегистрироваться
    //                     </Link>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

    if (loading) {
        return (
            <div className="min-h-page flex items-center justify-center"
                 style={{ background: '#C0CEB9' }}>
                <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
        );
    }

    if (wizard.isDone) {
        return (
            <div className="min-h-page py-12 px-4"
                 style={{ background: '#C0CEB9' }}>
                <div className="max-w-4xl mx-auto">
                    <WizardResult results={wizard.results!} onReset={wizard.reset} />
                </div>
            </div>
        );
    }

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