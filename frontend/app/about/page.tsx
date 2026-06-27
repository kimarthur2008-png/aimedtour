'use client';

import ValueCard from '@/components/about/ValueCard';
import TeamMember from '@/components/about/TeamMember';
import { ABOUT_TEAM } from '@/lib/aboutData';
import { useLanguage } from '@/context/LanguageContext';
import { Reveal } from '@/components/Reveal';

export default function AboutPage() {
  const { t } = useLanguage();

  const ABOUT_VALUES = [
    { title: t.about.v1Title, description: t.about.v1Desc, icon: 'shield' as const },
    { title: t.about.v2Title, description: t.about.v2Desc, icon: 'care'   as const },
    { title: t.about.v3Title, description: t.about.v3Desc, icon: 'transparency' as const },
  ];

  return (
    <div className="flex flex-col bg-[#C7D4D8] lg:bg-transparent">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#C7D4D8] lg:bg-[#90AEBC]/80">
        <div className="max-w-[1440px] mx-auto px-[clamp(16px,5vw,80px)] py-12 md:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 lg:gap-12">
            <div className="flex flex-col gap-6 lg:flex-1 lg:max-w-[75%]">
              <h1 className="text-h1 leading-tight">
                <span className="block" style={{ color: '#F7FAE8' }}>
                  {t.about.heroTitleLine1}
                </span>
                <span className="block" style={{ color: '#46707E' }}>
                  {t.about.heroTitleLine2}
                </span>
              </h1>

              <p className="text-body text-primary-dark/85">{t.about.heroP1}</p>
              <p className="text-body text-primary-dark/85">{t.about.heroP2}</p>

              <div className="flex gap-3 mt-2 items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0">
                  <img src="/icons/licence.svg" alt="" className="h-auto w-auto" />
                </div>
                <p className="text-caption">
                  <span className="block" style={{ color: '#F7FAE8', opacity: 0.8 }}>
                    {t.about.heroLicense1}
                  </span>
                  <span className="block" style={{ color: '#46707E', opacity: 0.8 }}>
                    {t.about.heroLicense2}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex justify-center w-full lg:flex-1 lg:justify-end">
              <div className="bg-white rounded-2xl p-6 md:p-10 w-full max-w-[480px] shadow-sm">
                <img src="/images/about/doctor.svg" alt="" className="w-full h-auto mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ценности ─────────────────────────────────────────────────────── */}
      <section className="bg-[#C7D4D8] lg:bg-[#E8EEF2]">
        <div className="max-w-[1440px] mx-auto px-[clamp(16px,5vw,80px)] py-14 md:py-20">
          <Reveal type="fade">
            <h2
              className="text-h2-accent text-center mb-10 md:mb-14"
              style={{ color: '#46888D' }}
            >
              {t.about.valuesHeading}
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {ABOUT_VALUES.map((v, i) => (
              <Reveal key={v.title} type="up" delay={i * 100}>
                <ValueCard title={v.title} description={v.description} icon={v.icon} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Команда ──────────────────────────────────────────────────────── */}
      <section className="bg-[#C7D4D8] lg:bg-[#A3B8C2]">
        <div className="max-w-[1440px] mx-auto px-[clamp(16px,5vw,80px)] py-14 md:py-20">
          <Reveal type="fade">
            <h2
              className="text-h2-accent text-center mb-10 md:mb-14"
              style={{ color: '#21393B' }}
            >
              {t.about.teamHeading}
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-12">
            {ABOUT_TEAM.map((m, i) => (
              <Reveal key={m.name} type="up" delay={i * 100}>
                <TeamMember name={m.name} role={m.role} image={m.image} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
