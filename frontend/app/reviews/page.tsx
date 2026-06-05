'use client';

import { useCases } from '@/hooks/useCases';
import ReviewCard from '@/components/ReviewCard';
import { useLanguage } from '@/context/LanguageContext';

export default function ReviewsPage() {
  const { cases, loading, error } = useCases();
  const { t } = useLanguage();

  return (
    <div style={{ backgroundColor: '#C7D4D8', minHeight: '100vh' }}>
      <div className="max-w-[1440px] mx-auto px-[clamp(16px,5vw,80px)] py-12 md:py-16">

        {/* Заголовок */}
        <div className="mb-10 md:mb-14 max-w-[1440px]">
          <h1 className="text-h1 mb-4 text-center" style={{ color: '#46888D' }}>
            {t.reviews.title}
          </h1>
          <p className="text-body-accent text-center" style={{ color: '#3D616D', opacity: 0.75 }}>
            {t.reviews.subtitle}
          </p>
        </div>

        {/* Скелетон */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl h-[420px] animate-pulse border border-black/5"
              />
            ))}
          </div>
        )}

        {error && (
          <p className="text-body" style={{ color: '#e53e3e' }}>{error}</p>
        )}

        {/* Сетка отзывов */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {cases.map((c) => (
              <ReviewCard key={c.id} patientCase={c} />
            ))}
          </div>
        )}

        {!loading && !error && cases.length === 0 && (
          <p className="text-body" style={{ color: '#3D616D', opacity: 0.7 }}>
            {t.reviews.comingSoon}
          </p>
        )}

      </div>
    </div>
  );
}
