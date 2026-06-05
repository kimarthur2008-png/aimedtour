'use client';

import ConsultForm from '@/components/ConsultForm';
import { useLanguage } from '@/context/LanguageContext';

export default function ConsultPage() {
    const { t } = useLanguage();
    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-gray-900">{t.consult.pageTitle}</h1>
                <p className="text-gray-500 mt-1">{t.consult.pageDesc}</p>
            </div>
            <ConsultForm />
        </div>
    );
}