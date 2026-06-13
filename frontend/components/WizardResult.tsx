import type { MatchedHospital } from '@/hooks/useWizard';
import Link from 'next/link';

interface Props {
  results: MatchedHospital[];
  onReset: () => void;
}

const HOSPITAL_SVG = (size = 'w-10 h-10') => (
  <svg className={size} fill="none" viewBox="0 0 24 24" stroke="#73907E" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9" />
  </svg>
);

export default function WizardResult({ results, onReset }: Props) {
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
          Ваши матчи с ИИ готовы
        </h2>
      </div>

      {/* ── Карточки ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {results.map((h, i) => {
          const photo = h.photos?.[0] ?? h.logoUrl;
          const hasStats = h.priceFrom || h.recoveryDays || h.operationsCount;

          return (
            <div key={h.id} className="animate-slide-up bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div className="flex">

                {/* Фото — только sm+ */}
                <div className="hidden sm:flex w-44 shrink-0 bg-[#E8EDE9] items-center justify-center">
                  {photo
                    ? <img src={photo} alt={h.name} className="w-full h-full object-cover min-h-50" />
                    : <div className="min-h-50 flex items-center justify-center w-full">{HOSPITAL_SVG()}</div>
                  }
                </div>

                {/* Контент */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3">

                  {/* ── MOBILE: иконка + процент ── */}
                  <div className="flex sm:hidden items-start justify-between gap-2">
                    {/* маленькая иконка / фото */}
                    <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#E8EDE9' }}>
                      {photo
                        ? <img src={photo} alt="" className="w-full h-full object-cover" />
                        : HOSPITAL_SVG('w-5 h-5')
                      }
                    </div>
                    {/* бейдж + % */}
                    <div className="text-right">
                      {i === 0 && (
                        <span className="inline-block text-[10px] font-bold text-white rounded-full px-2 py-0.5 mb-0.5" style={{ backgroundColor: '#4CAF50' }}>
                          ⚡ ЛУЧШИЙ ВЫБОР
                        </span>
                      )}
                      <div className="text-[28px] font-extrabold leading-none" style={{ color: '#21393B' }}>{h.matchPercent}%</div>
                      <div className="text-[9px] uppercase tracking-widest opacity-50" style={{ color: '#21393B' }}>AI совпадение</div>
                    </div>
                  </div>

                  {/* ── MOBILE: название + локация ── */}
                  <div className="sm:hidden">
                    <h3 className="font-bold text-[15px] leading-snug" style={{ color: '#21393B' }}>{h.name}</h3>
                    <LocationRow h={h} />
                  </div>

                  {/* ── DESKTOP: название + локация | процент ── */}
                  <div className="hidden sm:flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base leading-snug" style={{ color: '#21393B' }}>{h.name}</h3>
                      <LocationRow h={h} />
                    </div>
                    <div className="shrink-0 text-right">
                      {i === 0 && (
                        <span className="inline-block text-[10px] font-bold text-white rounded-full px-2 py-0.5 mb-0.5" style={{ backgroundColor: '#4CAF50' }}>
                          ⚡ ЛУЧШИЙ ВЫБОР
                        </span>
                      )}
                      <div className="text-3xl font-extrabold leading-none" style={{ color: '#21393B' }}>{h.matchPercent}%</div>
                      <div className="text-[9px] uppercase tracking-widest opacity-50" style={{ color: '#21393B' }}>AI совпадение</div>
                    </div>
                  </div>

                  {/* ── Почему эта клиника ── */}
                  <div className="rounded-xl px-3 py-2 text-xs leading-relaxed" style={{ backgroundColor: '#EDF2EE' }}>
                    <span className="font-semibold" style={{ color: '#2D6A4F' }}>Почему эта клиника: </span>
                    <span style={{ color: '#21393B', opacity: 0.85 }}>{h.description}</span>
                  </div>

                  {/* ── Статистика ── */}
                  {hasStats && (
                    <div className="flex divide-x text-center" style={{ borderColor: '#DAE3E8' }}>
                      {h.priceFrom && (
                        <div className="flex-1 px-2 py-1">
                          <div className="font-bold text-sm" style={{ color: '#21393B' }}>${h.priceFrom.toLocaleString()}</div>
                          <div className="text-[9px] uppercase tracking-wide opacity-50 mt-0.5" style={{ color: '#21393B' }}>Цена от</div>
                        </div>
                      )}
                      {h.recoveryDays && (
                        <div className="flex-1 px-2 py-1">
                          <div className="font-bold text-sm" style={{ color: '#21393B' }}>{h.recoveryDays}</div>
                          <div className="text-[9px] uppercase tracking-wide opacity-50 mt-0.5" style={{ color: '#21393B' }}>Восстановление</div>
                        </div>
                      )}
                      {h.operationsCount && (
                        <div className="flex-1 px-2 py-1">
                          <div className="font-bold text-sm" style={{ color: '#21393B' }}>{h.operationsCount}</div>
                          <div className="text-[9px] uppercase tracking-wide opacity-50 mt-0.5" style={{ color: '#21393B' }}>Операций</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Кнопки ── */}
                  <div className="flex items-center gap-3 mt-auto pt-1">
                    <Link
                      href="/consult"
                      className="flex-1 py-2.5 rounded-xl text-center text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: '#21393B' }}
                    >
                      Записаться на консультацию
                    </Link>
                    <Link
                      href={`/hospital-page?id=${h.id}`}
                      className="text-[13px] font-medium whitespace-nowrap hover:underline underline-offset-2"
                      style={{ color: '#21393B' }}
                    >
                      Подробнее
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Нижние кнопки ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          href="/consult"
          className="flex-1 py-4 rounded-2xl text-center text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#21393B' }}
        >
          Записаться на консультацию
        </Link>
        <Link
          href="/chat"
          className="flex-1 py-4 rounded-2xl text-center text-[14px] font-semibold border-2 transition-colors hover:bg-white/30"
          style={{ borderColor: '#21393B', color: '#21393B' }}
        >
          Общайтесь с координатором
        </Link>
      </div>

    </div>
  );
}

function LocationRow({ h }: { h: MatchedHospital }) {
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
          <span>⭐ {h.rating}{h.reviewCount != null && ` (${h.reviewCount.toLocaleString()} отзывов)`}</span>
        </>
      )}
    </div>
  );
}
