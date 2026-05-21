'use client';

import { useHospitals } from '@/hooks/useHospitals';
import HospitalCard from '@/components/HospitalCard';

export default function HospitalsPage() {
    const { hospitals, loading, error } = useHospitals();

    return (
        <div style={{ backgroundColor: '#C7D4D8', minHeight: '100vh' }}>
            <div className="max-w-[1440px] mx-auto px-[clamp(16px,5vw,80px)] py-12 md:py-16">

                {/* Заголовок */}
                <div className="mb-10 md:mb-14">
                    <h1 className="text-h1-hospital mb-3">
                        <span style={{ color: 'black' }}>Наши </span>
                        <span style={{ color: '#3D616D' }}>партнерские больницы</span>
                    </h1>
                    <p className="text-body-accent max-w-[620px]" style={{ color: '#3D616D', opacity: 0.7 }}>
                        Мы сотрудничаем исключительно с ведущими медицинскими учреждениями,
                        имеющими международную аккредитацию, чтобы гарантировать высочайший
                        уровень обслуживания и безопасности.
                    </p>
                </div>

                {/* Скелетон */}
                {loading && (
                    <div className="flex flex-col gap-5">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl h-[280px] animate-pulse border border-black-6"
                            />
                        ))}
                    </div>
                )}

                {error && (
                    <p className="text-body text-" style={{ color: '#e53e3e' }}>{error}</p>
                )}

                {/* Карточки */}
                {!loading && !error && (
                    <div className="flex flex-col gap-5">
                        {hospitals.map((h) => (
                            <HospitalCard key={h.id} hospital={h} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}