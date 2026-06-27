'use client';

import type { MatchedHospital } from '@/hooks/useWizard';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  results:   MatchedHospital[];
  onReset:   () => void;
  savedAt?:  string;
}

const DATE_LOCALE: Record<string, string> = { RU: 'ru-RU', EN: 'en-US', KO: 'ko-KR' };

const HOSPITAL_SVG = (size = 'w-10 h-10') => (
  <svg className={size} fill="none" viewBox="0 0 24 24" stroke="#73907E" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9" />
  </svg>
);

export default function WizardResult({ results, onReset, savedAt }: Props) {
  const { t, lang } = useLanguage();
  const w = t.wizard;

  const dateLabel = savedAt
    ? new Date(savedAt).toLocaleDateString(DATE_LOCALE[lang] ?? 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="w-full">

      {/* ── Шапка ─────────────────────────────────────────────────────────── */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-white/50 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#21393B" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#21393B' }}>
          {w.resultsTitle}
        </h2>
        {dateLabel && (
          <p className="text-sm mt-1 opacity-50" style={{ color: '#21393B' }}>
            {w.resultsFrom} {dateLabel}
          </p>
        )}
      </div>

      {/* ── Карточки ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {results.map((h, i) => {
          const photo = h.photos?.[0] ?? h.logoUrl;
          const hasStats = h.priceFrom || h.recoveryDays || h.operationsCount;

          return (
            <div key={h.id} className="animate-slide-up bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div className="flex items-stretch">

                {/* Фото — только sm+ */}
                <div className="hidden sm:block w-44 shrink-0 bg-[#E8EDE9] min-h-50 relative">
                  {photo
                    ? <img src={photo} alt={h.name} className="absolute inset-0 w-full h-full object-cover" />
                    : <div className="absolute inset-0 flex items-center justify-center">{HOSPITAL_SVG()}</div>
                  }
                </div>

                {/* Контент */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3 min-w-0">

                  {/* ── MOBILE: иконка + процент ── */}
                  <div className="flex sm:hidden items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#E8EDE9' }}>
                      {photo
                        ? <img src={photo} alt="" className="w-full h-full object-cover" />
                        : HOSPITAL_SVG('w-5 h-5')
                      }
                    </div>
                    <div className="text-right">
                      {i === 0 && (
                        <span className="inline-block text-[10px] font-bold text-white rounded-full px-2 py-0.5 mb-0.5" style={{ backgroundColor: '#4CAF50' }}>
                          {w.bestChoice}
                        </span>
                      )}
                      <div className="text-[28px] font-extrabold leading-none" style={{ color: '#21393B' }}>{h.matchPercent}%</div>
                      <div className="text-[9px] uppercase tracking-widest opacity-50" style={{ color: '#21393B' }}>{w.aiMatch}</div>
                    </div>
                  </div>

                  {/* ── MOBILE: название ── */}
                  <div className="sm:hidden">
                    <h3 className="font-bold text-[15px] leading-snug wrap-break-word" style={{ color: '#21393B' }}>{h.name}</h3>
                    <LocationRow h={h} reviews={w.reviews} />
                  </div>

                  {/* ── DESKTOP: название | процент ── */}
                  <div className="hidden sm:flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base leading-snug wrap-break-word" style={{ color: '#21393B' }}>{h.name}</h3>
                      <LocationRow h={h} reviews={w.reviews} />
                    </div>
                    <div className="shrink-0 text-right">
                      {i === 0 && (
                        <span className="inline-block text-[10px] font-bold text-white rounded-full px-2 py-0.5 mb-0.5" style={{ backgroundColor: '#4CAF50' }}>
                          {w.bestChoice}
                        </span>
                      )}
                      <div className="text-3xl font-extrabold leading-none" style={{ color: '#21393B' }}>{h.matchPercent}%</div>
                      <div className="text-[9px] uppercase tracking-widest opacity-50" style={{ color: '#21393B' }}>{w.aiMatch}</div>
                    </div>
                  </div>

                  {/* ── Почему эта клиника ── */}
                  <div className="w-full rounded-xl px-3 py-2 text-xs leading-relaxed wrap-break-word" style={{ backgroundColor: '#EDF2EE' }}>
                    <span className="font-semibold" style={{ color: '#2D6A4F' }}>{w.whyClinic}</span>
                    <span style={{ color: '#21393B', opacity: 0.85 }}>{h.description}</span>
                  </div>

                  {/* ── Статистика ── */}
                  {hasStats && (
                    <div className="flex divide-x text-center" style={{ borderColor: '#DAE3E8' }}>
                      {h.priceFrom && (
                        <div className="flex-1 px-2 py-1">
                          <div className="font-bold text-sm" style={{ color: '#21393B' }}>${h.priceFrom.toLocaleString()}</div>
                          <div className="text-[9px] uppercase tracking-wide opacity-50 mt-0.5" style={{ color: '#21393B' }}>{w.priceFrom}</div>
                        </div>
                      )}
                      {h.recoveryDays && (
                        <div className="flex-1 px-2 py-1">
                          <div className="font-bold text-sm" style={{ color: '#21393B' }}>{h.recoveryDays}</div>
                          <div className="text-[9px] uppercase tracking-wide opacity-50 mt-0.5" style={{ color: '#21393B' }}>{w.recovery}</div>
                        </div>
                      )}
                      {h.operationsCount && (
                        <div className="flex-1 px-2 py-1">
                          <div className="font-bold text-sm" style={{ color: '#21393B' }}>{h.operationsCount}</div>
                          <div className="text-[9px] uppercase tracking-wide opacity-50 mt-0.5" style={{ color: '#21393B' }}>{w.operations}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Подробнее ── */}
                  <div className="mt-auto pt-1">
                    <Link
                      href={`/hospital-page?id=${h.id}`}
                      className="text-[13px] font-medium hover:underline underline-offset-2"
                      style={{ color: '#21393B' }}
                    >
                      {w.learnMore} →
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Нижние действия ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          href="/consult"
          className="flex-1 py-4 rounded-2xl text-center text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#21393B' }}
        >
          {w.fillForm}
        </Link>
        <Link
          href="/chat"
          className="flex-1 py-4 rounded-2xl text-center text-[14px] font-semibold border-2 transition-colors hover:bg-white/30"
          style={{ borderColor: '#21393B', color: '#21393B' }}
        >
          {w.coordinator}
        </Link>
        <button
          onClick={onReset}
          className="flex-1 py-4 rounded-2xl text-center text-[14px] font-semibold transition-colors hover:bg-white/30"
          style={{ border: '2px solid #21393B', color: '#21393B', opacity: 0.6 }}
        >
          {w.retake}
        </button>
      </div>

    </div>
  );
}

function LocationRow({ h, reviews }: { h: MatchedHospital; reviews: string }) {
  if (!h.address && h.certifications.length === 0 && h.rating == null) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 text-[11px]" style={{ color: '#21393B', opacity: 0.7 }}>
      {h.address && (
        <span className="flex items-center gap-0.5">
          📍 <span className="uppercase">{h.address}</span>
        </span>
      )}
      {h.certifications.map((c, ci) => (
        <span key={c} className="flex items-center gap-0.5">
          {(h.address || ci > 0) && <span className="opacity-40">|</span>}
          <span className="font-semibold uppercase">{c}</span>
        </span>
      ))}
      {h.rating != null && (
        <>
          <span className="opacity-40">|</span>
          <span>⭐ {h.rating}{h.reviewCount != null && ` (${h.reviewCount.toLocaleString()} ${reviews})`}</span>
        </>
      )}
    </div>
  );
}
