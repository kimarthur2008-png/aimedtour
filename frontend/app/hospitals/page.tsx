'use client';

import { useState } from 'react';
import { useHospitals } from '@/hooks/useHospitals';
import HospitalCard from '@/components/HospitalCard';
import { useLanguage } from '@/context/LanguageContext';
import { Reveal } from '@/components/Reveal';

const PAGE_SIZE = 9;

export default function HospitalsPage() {
    const { hospitals, loading, error } = useHospitals();
    const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
    const { t } = useLanguage();

    return (
        <div style={{ backgroundColor: '#C7D4D8', minHeight: '100vh' }}>
            <div className="max-w-[1440px] mx-auto px-[clamp(16px,5vw,80px)] py-12 md:py-16">

                {/* Заголовок */}
                <Reveal type="fade" className="mb-10 md:mb-14 flex flex-col items-center text-center">
                    <h1 className="text-h1 mb-3">
                        <span style={{ color: '#3D616D' }}>{t.hospitals.heroTitle}</span>
                    </h1>
                    <p className="text-body-acc max-w-[720px] mx-auto" style={{ color: '#3D616D', opacity: 0.7 }}>
                        {t.hospitals.heroDesc}
                    </p>
                </Reveal>

                {/* Скелетон */}
                {loading && (
                    <div className="flex flex-col gap-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl h-[280px] animate-pulse border border-black/6" />
                        ))}
                    </div>
                )}

                {error && (
                    <p className="text-body" style={{ color: '#e53e3e' }}>{error}</p>
                )}

                {/* Пустой список */}
                {!loading && !error && hospitals.length === 0 && (
                    <div className="text-center py-20" style={{ color: '#3D616D', opacity: 0.6 }}>
                        <p className="text-lg mb-1">{t.hospitals.empty}</p>
                        <p className="text-sm">{t.hospitals.emptySub}</p>
                    </div>
                )}

                {/* Карточки */}
                {!loading && !error && hospitals.length > 0 && (
                    <>
                        <div className="flex flex-col gap-5">
                            {hospitals.slice(0, displayCount).map((h, i) => (
                                <Reveal key={h.id} type="up" delay={Math.min(i, 2) * 80}>
                                    <HospitalCard hospital={h} />
                                </Reveal>
                            ))}
                        </div>

                        {hospitals.length > displayCount && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => setDisplayCount((n) => n + PAGE_SIZE)}
                                    className="px-6 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-white/40"
                                    style={{ borderColor: 'rgba(61,97,109,0.3)', color: '#3D616D' }}
                                >
                                    {t.hospitals.loadMore} ({hospitals.length - displayCount})
                                </button>
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}
