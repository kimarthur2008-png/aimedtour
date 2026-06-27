import Link from 'next/link';
import type { Hospital } from '@/hooks/useHospitals';
import { useLanguage } from '@/context/LanguageContext';
import { translateSpec } from '@/lib/specs';

interface Props {
    hospital: Hospital;
}

export default function HospitalCard({ hospital }: Props) {
    const { lang } = useLanguage();
    return (
        <div
            className="bg-white rounded-2xl overflow-hidden flex flex-col md:flex-row"
            style={{ border: '1px solid rgba(0,0,0,0.06)' }}
        >
            {/* Текстовая часть */}
            <div className="flex flex-col justify-between p-6 md:p-8 flex-1 gap-4 min-w-0">
                <div className="flex flex-col gap-3">
                    <h2 className="text-h2 wrap-break-word" style={{ color: '#21393B' }}>
                        {hospital.name}
                    </h2>
                    <p className="text-body wrap-break-word" style={{ color: '#21393B', opacity: 0.65 }}>
                        {hospital.descriptionI18n?.[lang] || hospital.description}
                    </p>
                </div>

                {/* Сертификаты */}
                {hospital.certifications?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {hospital.certifications.map((c) => (
                            <span
                                key={c}
                                className="text-caption px-3 py-1 rounded-full"
                                style={{
                                    backgroundColor: 'rgba(61,97,109,0.12)',
                                    color: '#3D616D',
                                    border: '1px solid rgba(61,97,109,0.25)',
                                    fontWeight: 600,
                                }}
                            >
                                {c}
                            </span>
                        ))}
                    </div>
                )}

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
                  {translateSpec(s, lang)}
                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ссылка */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} className="pt-4">
                    <Link
                        href={`/hospital-page?id=${hospital.id}`}
                        className="text-label flex items-center gap-1 hover:gap-2 transition-all"
                        style={{ color: '#4C6D7C' }}
                    >
                        Узнать больше
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6"/>
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Фото */}
            <div
                className="relative w-full md:w-95 shrink-0 order-first md:order-last overflow-hidden"
                style={{ minHeight: '220px', borderLeft: '1px solid rgba(0,0,0,0.06)' }}
            >
                {hospital.logoUrl ? (
                    <img
                        src={hospital.logoUrl}
                        alt={hospital.name}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0" style={{ backgroundColor: '#DAE3E8' }} />
                )}
                {/* Мобилка: снизу вверх */}
                <div
                    className="absolute inset-0 pointer-events-none md:hidden"
                    style={{ background: 'linear-gradient(to top, #ffffff 0%, transparent 50%)' }}
                />
                {/* Десктоп: слева направо (плавный переход к тексту) */}
                <div
                    className="absolute inset-0 pointer-events-none hidden md:block"
                    style={{ background: 'linear-gradient(to right, #ffffff 0%, transparent 40%)' }}
                />
            </div>

        </div>
    );
}