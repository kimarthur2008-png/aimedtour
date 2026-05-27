import Link from 'next/link';
import type { Hospital } from '@/hooks/useHospitals';

interface Props {
    hospital: Hospital;
}

export default function HospitalCard({ hospital }: Props) {
    return (
        <div
            className="bg-white rounded-2xl overflow-hidden flex flex-col md:flex-row"
            style={{ border: '1px solid rgba(0,0,0,0.06)', minHeight: '260px' }}
        >
            {/* Текстовая часть */}
            <div className="flex flex-col justify-between p-6 md:p-8 flex-1 gap-4">
                <div className="flex flex-col gap-3">
                    <h2 className="text-h2" style={{ color: '#21393B' }}>
                        {hospital.name}
                    </h2>
                    <p className="text-body" style={{ color: '#21393B', opacity: 0.65 }}>
                        {hospital.description}
                    </p>
                </div>

                {/* Специализации */}
                {hospital.specializations?.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <p className="text-label" style={{ color: '#21393B' }}>
                            Ключевые специальности
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {hospital.specializations.map((s) => (
                                <span
                                    key={s}
                                    className="text-caption px-3 py-1 rounded-full"
                                    style={{
                                        backgroundColor: 'rgba(76,109,124,0.1)',
                                        color: '#4C6D7C',
                                        border: '1px solid rgba(76,109,124,0.2)',
                                    }}
                                >
                  {s}
                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ссылка */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} className="pt-4">
                    <Link
                        href="/consult"
                        className="text-label flex items-center gap-1 hover:gap-2 transition-all"
                        style={{ color: '#4C6D7C' }}
                    >
                        Запишитесь на лечение в {hospital.name.split(' ')[0]}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6"/>
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Фото */}
            <div className="relative w-full md:w-[420px] h-[220px] md:h-auto shrink-0 order-first md:order-last overflow-hidden">
                {hospital.logoUrl ? (
                    <img
                        src={hospital.logoUrl}
                        alt={hospital.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    /* Заглушка если нет фото */
                    <div className="w-full h-full" style={{ backgroundColor: '#DAE3E8' }} />
                )}

                {/* Универсальный градиент: на мобилках снизу вверх, на десктопе слева направо */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(to top, #ffffff 0%, transparent 50%), linear-gradient(to right, #ffffff 0%, transparent 40%)'
                    }}
                    // Для чистого Tailwind без инлайн-стилей можно использовать классы:
                    // className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none"
                />
            </div>

        </div>
    );
}