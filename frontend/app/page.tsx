'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();

  const STATS = [
    { icon: '/icons/patients.svg',    value: '5,000+', label: t.home.stat1Label },
    { icon: '/icons/global.svg',      value: '45+',    label: t.home.stat2Label },
    { icon: '/icons/experience.svg',  value: '15+',    label: t.home.stat3Label },
    { icon: '/icons/trust.svg',       value: '100%',   label: t.home.stat4Label },
  ];

  const FEATURES = [
    { icon: '/icons/treatment.svg', title: t.home.f1Title, desc: t.home.f1Desc },
    { icon: '/icons/all.svg',       title: t.home.f2Title, desc: t.home.f2Desc },
    { icon: '/icons/patients.svg',  title: t.home.f3Title, desc: t.home.f3Desc },
  ];

  return (
      <div className="flex flex-col">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section
            className="relative w-full overflow-hidden flex items-center"
            style={{ backgroundColor: '#F7FAE8', minHeight: '807px' }}
        >
          {/* Фото — десктоп */}
          <div className="absolute right-0 top-0 h-full w-[50%] hidden md:block">
            <img
                src="/images/hero-bg.png"
                alt="Клиника"
                className="w-full h-full object-cover"
            />
            <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to right, #F7FAE8 0%, #F7FAE8 20%, transparent 60%)' }}
            />
          </div>

          {/* Контент */}
          <div
              className="relative z-10 flex flex-col gap-6 py-10 md:py-0 md:max-w-[57%] pl-[clamp(16px,8vw,120px)] pr-[clamp(24px,8vw,120px)]"
          >
            {/* Бейдж */}
            <div
                className="text-label inline-flex self-start px-5 py-2 bg-[#6B8B80]/30 text-primary-dark/70 rounded-full border border-primary-dark border-dashed"
            >
              {t.home.badge}
            </div>

            {/* Заголовок */}
            <h1 className="text-h1 text-primary font-bold leading-tight">
              {t.home.titleLine1}
              <br/>
              <span className="text-accent">
                {t.home.titleLine2}
              </span>
            </h1>

            {/* Подзаголовок */}
            <p
                className="text-body text-primary-dark-80 leading-relaxed md:max-w-[480px]"
            >
              {t.home.descFull}
            </p>

            {/* Кнопки */}
            <div className="flex flex-col gap-3 mt-2 md:flex-row md:gap-4 md:mt-4">
              <Link
                  href="/quiz"
                  className="px-6 py-4 rounded-2xl text-white text-[15px] font-semibold text-center transition-opacity hover:opacity-90 bg-primary"
              >
                {t.home.btnAI}
              </Link>
              <Link
                  href="/reviews"
                  className="px-6 py-4 rounded-2xl text-[15px] font-semibold text-center border-[1.5px] transition-colors hover:bg-white/50 border-primary text-primary bg-primary/3"
              >
                {t.home.btnReviews}
              </Link>
            </div>
          </div>
        </section>

        {/* ── СТАТИСТИКА ───────────────────────────────────────────────────── */}
        <section className="bg-primary px-[clamp(24px,8vw,120px)] py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-[1440px] mx-auto ">
            {STATS.map((s) => (
                <div key={s.value} className="animate-slide-up flex flex-col items-center text-center gap-3">
                  <div
                      className="flex items-center justify-center rounded-2xl bg-white w-[92px] h-[88px]"
                  >
                    <img src={s.icon} style={{ width: '47px', height: '47px' }} />
                  </div>
                  <div className="text-h2 text-white">{s.value}</div>
                  <div className="text-caption text-white opacity-70">{s.label}</div>
                </div>
            ))}
          </div>
        </section>

        {/* ── ПОЧЕМУ МЫ ────────────────────────────────────────────────────── */}
        <section className="py-16 md:py-24 bg-bg-light px-[clamp(24px,8vw,120px)]">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-caption mb-4 text-accent">
              {t.home.whyBadge}
            </p>
            <h2 className="text-h2-accent leading-tight mb-4 text-[#425D54]">
              {t.home.whyTitle}
            </h2>
            <p className="text-body leading-relaxed max-w-[600px] mx-auto text-primary-dark/60">
              {t.home.whyDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[1400px] mx-auto">
            {FEATURES.map((f) => (
                <div key={f.title} className="animate-slide-up rounded-2xl p-6 flex flex-col gap-4 bg-primary">
                  <div className="rounded-2xl w-[52px] h-[52px] bg-white flex items-center justify-center">
                    <img src={f.icon} className="w-[28px] h-[28px]" />
                  </div>
                  <h3 className="text-h3 text-white">{f.title}</h3>
                  <p className="text-caption text-white/70">{f.desc}</p>
                </div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="py-20 px-6 text-center bg-primary">
          <h2 className="text-h2-accent text-white mb-4">
            {t.home.ctaTitleFull}
          </h2>
          <p className="text-caption text-white opacity-70 mb-10 max-w-[560px] mx-auto">
            {t.home.ctaDescFull}
          </p>
          <Link
              href="/quiz"
              className="inline-block px-10 py-4 rounded-2xl text-[16px] font-semibold transition-opacity hover:opacity-90 bg-bg-light text-primary-dark"
          >
            {t.home.ctaBtnFull}
          </Link>
        </section>

      </div>
  );
}
