'use client';

import { use } from 'react';
import Link from 'next/link';
import { useHospital } from '@/hooks/useHospitals';
import { useLanguage } from '@/context/LanguageContext';

export default function HospitalPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { hospital, loading, error } = useHospital(id);
    const { t } = useLanguage();

    if (loading) {
        return (
            <div style={{ backgroundColor: '#C7D4D8', minHeight: '100vh' }}>
                <div className="max-w-[1440px] mx-auto px-[clamp(16px,5vw,80px)] py-12">
                    <div className="h-8 w-48 rounded-xl bg-white/40 animate-pulse mb-8" />
                    <div className="bg-white rounded-3xl h-[400px] animate-pulse" />
                </div>
            </div>
        );
    }

    if (error || !hospital) {
        return (
            <div style={{ backgroundColor: '#C7D4D8', minHeight: '100vh' }}>
                <div className="max-w-[1440px] mx-auto px-[clamp(16px,5vw,80px)] py-12 text-center">
                    <p className="text-body" style={{ color: '#e53e3e' }}>{error ?? t.hospitalPage.notFound}</p>
                    <Link href="/hospitals" className="text-label mt-4 inline-block" style={{ color: '#4C6D7C' }}>
                        {t.hospitalPage.backToCatalog}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#C7D4D8', minHeight: '100vh' }}>
            <div className="max-w-[1440px] mx-auto px-[clamp(16px,5vw,80px)] py-12 md:py-16">

                {/* Хлебные крошки */}
                <nav className="flex items-center gap-2 mb-8 text-caption" style={{ color: '#3D616D' }}>
                    <Link href="/" className="hover:underline opacity-70">{t.hospitalPage.breadHome}</Link>
                    <span className="opacity-40">/</span>
                    <Link href="/hospitals" className="hover:underline opacity-70">{t.hospitalPage.breadClinics}</Link>
                    <span className="opacity-40">/</span>
                    <span className="opacity-100 font-medium">{hospital.name}</span>
                </nav>

                {/* Hero — фото + основная инфо */}
                <div className="bg-white rounded-3xl overflow-hidden mb-6" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                    {/* Фото */}
                    {hospital.logoUrl && (
                        <div className="w-full h-[280px] md:h-[380px] overflow-hidden relative">
                            <img
                                src={hospital.logoUrl}
                                alt={hospital.name}
                                className="w-full h-full object-cover"
                            />
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.6) 0%, transparent 60%)' }}
                            />
                        </div>
                    )}

                    <div className="p-8 md:p-12">
                        {/* Сертификаты */}
                        {hospital.certifications?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
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

                        <h1 className="text-h1" style={{ color: '#21393B' }}>{hospital.name}</h1>

                        <p className="text-body-accent mt-4 max-w-[760px]" style={{ color: '#21393B', opacity: 0.7 }}>
                            {hospital.fullDescription ?? hospital.description}
                        </p>

                        {/* Статистика */}
                        {(hospital.beds || hospital.doctors || hospital.founded) && (
                            <div className="flex flex-wrap gap-8 mt-8 pt-8" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                                {hospital.founded && (
                                    <div>
                                        <p className="text-h3" style={{ color: '#21393B' }}>{hospital.founded}</p>
                                        <p className="text-caption mt-1" style={{ color: '#3D616D', opacity: 0.7 }}>{t.hospitalPage.founded}</p>
                                    </div>
                                )}
                                {hospital.beds && (
                                    <div>
                                        <p className="text-h3" style={{ color: '#21393B' }}>{hospital.beds.toLocaleString()}+</p>
                                        <p className="text-caption mt-1" style={{ color: '#3D616D', opacity: 0.7 }}>{t.hospitalPage.beds}</p>
                                    </div>
                                )}
                                {hospital.doctors && (
                                    <div>
                                        <p className="text-h3" style={{ color: '#21393B' }}>{hospital.doctors.toLocaleString()}+</p>
                                        <p className="text-caption mt-1" style={{ color: '#3D616D', opacity: 0.7 }}>{t.hospitalPage.doctors}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Нижний блок: специализации + контакты */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Специализации */}
                    <div className="md:col-span-2 bg-white rounded-3xl p-8" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                        <h2 className="text-h3 mb-5" style={{ color: '#21393B' }}>{t.hospitalPage.specializations}</h2>
                        <div className="flex flex-wrap gap-2">
                            {hospital.specializations?.map((s) => (
                                <span
                                    key={s}
                                    className="text-body px-4 py-2 rounded-full"
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

                    {/* Контакты + CTA */}
                    <div className="bg-white rounded-3xl p-8 flex flex-col gap-5" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                        <h2 className="text-h3" style={{ color: '#21393B' }}>{t.hospitalPage.contacts}</h2>

                        <div className="flex flex-col gap-3 text-caption flex-1" style={{ color: '#3D616D' }}>
                            {hospital.address && (
                                <div className="flex items-start gap-2">
                                    <img src="/icons/map.svg" className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
                                    <span>{hospital.address}</span>
                                </div>
                            )}
                            {hospital.phone && (
                                <div className="flex items-center gap-2">
                                    <img src="/icons/tel.svg" className="w-4 h-4 shrink-0 opacity-60" />
                                    <a href={`tel:${hospital.phone}`} className="hover:underline">{hospital.phone}</a>
                                </div>
                            )}
                            {hospital.email && (
                                <div className="flex items-center gap-2">
                                    <img src="/icons/email.svg" className="w-4 h-4 shrink-0 opacity-60" />
                                    <a href={`mailto:${hospital.email}`} className="hover:underline">{hospital.email}</a>
                                </div>
                            )}
                            {hospital.website && (
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 shrink-0 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                    </svg>
                                    <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                                        {hospital.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            )}
                            {!hospital.address && !hospital.phone && !hospital.email && !hospital.website && (
                                <p className="opacity-50">{t.hospitalPage.contactsTbd}</p>
                            )}
                        </div>

                        <Link
                            href="/consult"
                            className="w-full py-4 rounded-2xl text-btn-lg text-white text-center transition-opacity hover:opacity-90"
                            style={{ backgroundColor: '#73907E' }}
                        >
                            {t.hospitalPage.bookTreatment}
                        </Link>
                    </div>

                </div>

                {/* Галерея доп. фото */}
                {hospital.photos && hospital.photos.length > 0 && (
                    <div className="mt-6 bg-white rounded-3xl p-8" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                        <h2 className="text-h3 mb-5" style={{ color: '#21393B' }}>{t.hospitalPage.gallery}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {hospital.photos.map((url, i) => (
                                <div key={i} className="aspect-square rounded-2xl overflow-hidden">
                                    <img src={url} alt={`${hospital.name} фото ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
