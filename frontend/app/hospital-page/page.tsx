'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useHospital } from '@/hooks/useHospitals';
import { useLanguage } from '@/context/LanguageContext';
import { translateSpec } from '@/lib/specs';

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.75S4.5 14.25 4.5 9a7.5 7.5 0 0115 0c0 5.25-7.5 12.75-7.5 12.75z" />
    <circle cx="12" cy="9" r="2.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 shrink-0">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12h19.5M12 3a15.3 15.3 0 014 9 15.3 15.3 0 01-4 9 15.3 15.3 0 01-4-9 15.3 15.3 0 014-9z" />
  </svg>
);

const ChevronLeft = ({ w = 20, h = 20 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = ({ w = 20, h = 20 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const HospitalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9" />
  </svg>
);

function HospitalPageInner() {
  const id = useSearchParams().get('id') ?? '';
  const { hospital, loading, error } = useHospital(id);
  const { t, lang } = useLanguage();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right');
  const [lightbox, setLightbox] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartX = useRef(0);
  const swipeMoved = useRef(false);

  function handleGalleryTouchStart(e: React.TouchEvent) {
    swipeStartX.current = e.touches[0].clientX;
    swipeMoved.current = false;
    longPressTimer.current = setTimeout(() => setLightbox(true), 500);
  }
  function handleGalleryTouchMove(e: React.TouchEvent) {
    const delta = Math.abs(e.touches[0].clientX - swipeStartX.current);
    if (delta > 10) {
      swipeMoved.current = true;
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    }
  }
  function handleGalleryTouchEnd(e: React.TouchEvent) {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!swipeMoved.current) return;
    const delta = e.changedTouches[0].clientX - swipeStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) nextPhoto();
      else prevPhoto();
    }
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F7FAE8', minHeight: '100vh' }}>
        <div className="max-w-[1200px] mx-auto px-[clamp(16px,5vw,80px)] py-12">
          <div className="h-6 w-48 rounded-lg bg-white/30 animate-pulse mb-10" />
          <div className="h-64 rounded-3xl bg-white/30 animate-pulse mb-6" />
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 h-80 rounded-3xl bg-white/30 animate-pulse" />
            <div className="lg:w-[300px] h-80 rounded-3xl bg-white/30 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div style={{ backgroundColor: '#F7FAE8', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-body wrap-break-word mb-4" style={{ color: '#21393B' }}>{error ?? t.hospitalPage.notFound}</p>
          <Link href="/hospitals" className="text-label px-5 py-2.5 rounded-xl text-white" style={{ backgroundColor: '#21393B' }}>
            {t.hospitalPage.backToCatalog}
          </Link>
        </div>
      </div>
    );
  }

  function prevPhoto() { setSlideDir('left');  setPhotoIdx(i => (i - 1 + galleryPhotos.length) % galleryPhotos.length); }
  function nextPhoto() { setSlideDir('right'); setPhotoIdx(i => (i + 1) % galleryPhotos.length); }

  const galleryPhotos = [
    ...(hospital.logoUrl ? [{ url: hospital.logoUrl, caption: 'Главный корпус' }] : []),
    ...(hospital.photos ?? []).map((url, i) => ({ url, caption: `Фото ${i + 1}` })),
  ];

  const hasFacts = hospital.founded || hospital.beds || hospital.doctors || (hospital.certifications?.length ?? 0) > 0;

  return (
    <div style={{ backgroundColor: '#F7FAE8', minHeight: '100vh' }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden flex items-center justify-center" style={{ minHeight: '400px' }}>
        {/* Фон: размытое фото */}
        {hospital.logoUrl
          ? <img src={hospital.logoUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ filter: 'blur(5px)', transform: 'scale(1.08)' }} />
          : <div className="absolute inset-0" style={{ backgroundColor: '#21393B' }} />
        }
        {/* Тёмный полупрозрачный оверлей */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.52)' }} />

        {/* Контент по центру */}
        <div className="relative w-full flex flex-col items-center text-center px-6 py-16">
          <h1 style={{ color: '#ffffff', fontWeight: 700, fontSize: 'clamp(28px, 5vw, 64px)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.1, wordBreak: 'break-word', maxWidth: '900px' }}>
            {hospital.name}
          </h1>

          {/* Разделитель */}
          <div className="mt-5 mb-4 w-full" style={{ height: '2px', backgroundColor: 'rgba(255,255,255)', maxWidth: '900px' }} />

          {/* Город и год */}
          <p style={{ color: '#ffffff', fontWeight: 400, fontSize: 'clamp(13px, 1.5vw, 16px)', opacity: 0.75 }}>
            {[hospital.address, hospital.founded ? t.hospitalPage.foundedSince.replace('{year}', hospital.founded) : null].filter(Boolean).join(' • ')}
          </p>
        </div>
      </div>

      {/* ── ОСНОВНОЙ КОНТЕНТ ──────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-[clamp(16px,5vw,80px)] py-14">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Левая колонка ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* О клинике */}
            <div>
              <h2 className="text-h3 mb-4" style={{ color: '#21393B' }}>{t.hospitalPage.about}</h2>
              <p className="text-body" style={{ color: '#21393B', opacity: 0.72, lineHeight: 1.75, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                {hospital.fullDescriptionI18n?.[lang] || hospital.descriptionI18n?.[lang] || hospital.fullDescription || hospital.description}
              </p>
            </div>

            {/* Специализации */}
            {(hospital.specializations?.length ?? 0) > 0 && (
              <div>
                <h2 className="text-h3 mb-5" style={{ color: '#21393B' }}>{t.hospitalPage.specializations}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hospital.specializations.map(s => (
                    <div key={s} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{ backgroundColor: 'rgba(76,109,124,0.08)', border: '1px solid rgba(76,109,124,0.16)' }}>
                      <span className="shrink-0 opacity-50" style={{ color: '#4C6D7C' }}><HospitalIcon /></span>
                      <span className="text-label wrap-break-word" style={{ color: '#21393B' }}>{translateSpec(s, lang)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Правый сайдбар ── */}
          <div className="w-full lg:w-[290px] shrink-0 flex flex-col gap-4">

            {/* CTA */}
            <div className="rounded-3xl p-6 flex flex-col gap-3" style={{ backgroundColor: '#21393B' }}>
              <div className="text-center">
                <p className="font-bold text-[15px] text-white">{t.hospitalPage.bookTreatment}</p>
                <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.hospitalPage.respondIn24h}</p>
              </div>
              <Link href="/consult"
                className="w-full py-3 rounded-2xl text-center text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#73907E' }}>
                {t.hospitalPage.submitRequest}
              </Link>
              <Link href="/chat"
                className="w-full py-3 rounded-2xl text-center text-[14px] font-medium transition-colors hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.75)' }}>
                {t.hospitalPage.askCoordinator}
              </Link>
            </div>

            {/* Основные факты */}
            {hasFacts && (
              <div className="bg-white rounded-3xl p-6" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                <p className="font-bold text-[15px] mb-4" style={{ color: '#21393B' }}>{t.hospitalPage.keyFacts}</p>
                <div className="flex flex-col divide-y" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  {[
                    hospital.founded && { label: t.hospitalPage.founded, value: hospital.founded },
                    hospital.beds    && { label: t.hospitalPage.beds,    value: hospital.beds.toLocaleString() },
                    hospital.doctors && { label: t.hospitalPage.doctors, value: hospital.doctors.toLocaleString() + '+' },
                  ].filter((r): r is { label: string; value: string } => Boolean(r)).map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4 py-2.5">
                      <span className="text-[13px]" style={{ color: '#21393B', opacity: 0.45 }}>{row.label}</span>
                      <span className="text-[13px] font-semibold text-right wrap-break-word" style={{ color: '#21393B' }}>{row.value}</span>
                    </div>
                  ))}

                  {(hospital.certifications?.length ?? 0) > 0 && (
                    <div className="flex items-start justify-between gap-4 py-2.5">
                      <span className="text-[13px]" style={{ color: '#21393B', opacity: 0.45 }}>{t.hospitalPage.accreditation}</span>
                      <span className="text-[13px] font-semibold text-right wrap-break-word" style={{ color: '#21393B' }}>
                        {hospital.certifications.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Контакты */}
            {(hospital.address || hospital.phone || hospital.email || hospital.website) && (
              <div className="bg-white rounded-3xl p-6 flex flex-col gap-3" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                <p className="font-bold text-[15px]" style={{ color: '#21393B' }}>{t.hospitalPage.contacts}</p>
                {hospital.address && (
                  <div className="flex items-start gap-2.5 text-[13px]" style={{ color: '#3D616D' }}>
                    <PinIcon /><span className="wrap-break-word">{hospital.address}</span>
                  </div>
                )}
                {hospital.phone && (
                  <div className="flex items-center gap-2.5 text-[13px]" style={{ color: '#3D616D' }}>
                    <PhoneIcon /><a href={`tel:${hospital.phone}`} className="hover:underline">{hospital.phone}</a>
                  </div>
                )}
                {hospital.email && (
                  <div className="flex items-center gap-2.5 text-[13px]" style={{ color: '#3D616D' }}>
                    <MailIcon /><a href={`mailto:${hospital.email}`} className="hover:underline wrap-break-word">{hospital.email}</a>
                  </div>
                )}
                {hospital.website && (
                  <div className="flex items-center gap-2.5 text-[13px]" style={{ color: '#3D616D' }}>
                    <GlobeIcon />
                    <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="hover:underline wrap-break-word">
                      {hospital.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ГАЛЕРЕЯ ───────────────────────────────────────────────────────── */}
      {galleryPhotos.length > 0 && (
        <div className="relative" style={{ height: 'clamp(200px, 55vw, 500px)' }}>
            <div className="absolute inset-0 overflow-hidden">
              <img
                key={photoIdx}
                src={galleryPhotos[photoIdx].url}
                alt={galleryPhotos[photoIdx].caption}
                className={`w-full h-full object-cover select-none ${slideDir === 'right' ? 'animate-slide-from-right' : 'animate-slide-from-left'}`}
                onTouchStart={handleGalleryTouchStart}
                onTouchMove={handleGalleryTouchMove}
                onTouchEnd={handleGalleryTouchEnd}
                onContextMenu={e => e.preventDefault()}
              />

              {/* Градиенты #F7FAE8 со всех сторон */}
              {/* <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, #F7FAE8 0%, transparent 35%)' }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top,    #F7FAE8 0%, transparent 35%)' }} /> */}
              {/* <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, #F7FAE8 0%, rgba(247,250,232,0.6) 20%, transparent 55%)' }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to left,  #F7FAE8 0%, rgba(247,250,232,0.6) 20%, transparent 55%)' }} /> */}

              {galleryPhotos.length > 1 && (
                <>
                  <button onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
                    style={{ color: 'white', border: '1.5px solid rgba(255,255,255,0.45)', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)', width: '52px', height: '52px' }}>
                    <ChevronLeft w={22} h={22} />
                  </button>
                  <button onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
                    style={{ color: 'white', border: '1.5px solid rgba(255,255,255,0.45)', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)', width: '52px', height: '52px' }}>
                    <ChevronRight w={22} h={22} />
                  </button>
                </>
              )}

              {/* Точки внутри галереи */}
              {galleryPhotos.length > 1 && (
                <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                  {galleryPhotos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIdx(i)}
                      className="rounded-full transition-all pointer-events-auto"
                      style={{
                        width: i === photoIdx ? '20px' : '8px',
                        height: '8px',
                        backgroundColor: i === photoIdx ? '#21393B' : 'rgba(33,57,59,0.25)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
        </div>
      )}

      {/* ── CTA БАННЕР ────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#2D4A3E' }}>
        <div className="max-w-[1200px] mx-auto px-[clamp(16px,5vw,80px)] py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <p className="text-h3 text-white">{t.hospitalPage.bookTreatment}</p>
            <p className="text-[14px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.hospitalPage.coordinatorIn24h}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/consult"
              className="px-7 py-3 rounded-2xl text-[14px] font-semibold text-white text-center transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#73907E' }}>
              {t.hospitalPage.submitRequest}
            </Link>
            <Link href="/chat"
              className="px-7 py-3 rounded-2xl text-[14px] font-medium text-center transition-colors hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.8)' }}>
              {t.hospitalPage.askCoordinator}
            </Link>
          </div>
        </div>
      </div>

      {/* ── ЛАЙТБОКС ──────────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 flex items-center justify-center"
            style={{ color: 'rgba(255,255,255,0.7)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}
            onClick={() => setLightbox(false)}
          >
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <img
            src={galleryPhotos[photoIdx].url}
            alt={galleryPhotos[photoIdx].caption}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: '90dvh' }}
            onClick={e => e.stopPropagation()}
          />

          {galleryPhotos.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prevPhoto(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'white', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.8))' }}
              >
                <ChevronLeft w={28} h={60} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); nextPhoto(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'white', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.8))' }}
              >
                <ChevronRight w={28} h={60} />
              </button>
            </>
          )}

          {galleryPhotos.length > 1 && (
            <div className="absolute bottom-5 flex gap-2">
              {galleryPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setPhotoIdx(i); }}
                  className="rounded-full transition-all"
                  style={{
                    width: i === photoIdx ? '20px' : '8px',
                    height: '8px',
                    backgroundColor: i === photoIdx ? 'white' : 'rgba(255,255,255,0.35)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default function HospitalPage() {
  return (
    <Suspense>
      <HospitalPageInner />
    </Suspense>
  );
}
