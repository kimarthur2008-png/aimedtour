'use client';

import { useTourism } from '@/hooks/useTourism';
import { useLanguage } from '@/context/LanguageContext';
import { Reveal } from '@/components/Reveal';

const SECTION_ICONS: Record<string, string> = {
    sights:   '/icons/tourism/sights.svg',
    food:     '/icons/tourism/food.svg',
    shopping: '/icons/tourism/shopping.svg',
};

const DEFAULT_HERO_IMG = '/images/tourism-hero.jpg';

function TourCard({ item }: { item: { name: string; description: string; imageUrl: string } }) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col">
            <div className="h-[200px] bg-gray-100 overflow-hidden">
                {item.imageUrl ? (
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#DAE3E8] to-[#C7D4D8]" />
                )}
            </div>
            <div className="p-5 flex flex-col gap-2">
                <h3 className="text-h4" style={{ color: '#21393B' }}>{item.name}</h3>
                <p className="text-caption" style={{ color: '#21393B', opacity: 0.7 }}>{item.description}</p>
            </div>
        </div>
    );
}

function SectionBlock({
    type,
    items,
    label,
}: {
    type: 'sights' | 'food' | 'shopping';
    items: ReturnType<typeof useTourism>['items'];
    label: string;
}) {
    if (items.length === 0) return null;
    return (
        <section className="mb-14">
            <Reveal type="fade" className="flex items-center gap-3 mb-6">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: type === 'sights' ? '#E8F4F8' : type === 'food' ? '#FFF3E8' : '#F0EBF8' }}
                >
                    <img src={SECTION_ICONS[type]} alt="" className="w-5 h-5" />
                </div>
                <h2 className="text-h2" style={{ color: '#21393B' }}>{label}</h2>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((item, i) => (
                    <Reveal key={item.id} type="up" delay={Math.min(i % 3, 2) * 90}>
                        <TourCard item={item} />
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

export default function TripPage() {
    const { sights, food, shopping, hero, loading, error } = useTourism();
    const { t } = useLanguage();

    return (
        <div style={{ backgroundColor: '#C7D4D8', minHeight: '100vh' }}>

            {/* ── Герой ─────────────────────────────────────────────────── */}
            <div
                className="relative w-full h-[340px] md:h-[420px] flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: '#21393B' }}
            >
                {(hero?.heroImageUrl || DEFAULT_HERO_IMG) && (
                    <img
                        src="/images/hero-tour.png"
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur"
                    />
                )}
                <div className="relative z-10 text-center px-6 max-w-[700px]">
                    <h1 className="text-h1 text-white mb-4">
                        {t.trip.heroFallbackTitle.replace(t.trip.heroFallbackHighlight, '').trimEnd()}{' '}
                        <span style={{ color: '#21393B' }}>{t.trip.heroFallbackHighlight}</span>
                    </h1>
                    <p className="text-body text-white/80">
                        {t.trip.heroFallbackDesc}
                    </p>
                </div>
            </div>

            {/* ── Контент ───────────────────────────────────────────────── */}
            <div className="max-w-[1440px] mx-auto px-[clamp(16px,5vw,80px)] py-12 md:py-16">

                {loading && (
                    <div className="flex flex-col gap-14">
                        {[1, 2, 3].map((s) => (
                            <div key={s}>
                                <div className="h-8 w-64 bg-gray-200 rounded-xl animate-pulse mb-6" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-[280px] bg-gray-200 rounded-2xl animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <p className="text-body" style={{ color: '#e53e3e' }}>{error}</p>
                )}

                {!loading && !error && (
                    <>
                        <SectionBlock type="sights"   items={sights}   label={t.trip.sightsLabel}   />
                        <SectionBlock type="food"     items={food}     label={t.trip.foodLabel}     />
                        <SectionBlock type="shopping" items={shopping} label={t.trip.shoppingLabel} />

                        {sights.length === 0 && food.length === 0 && shopping.length === 0 && (
                            <p className="text-body text-center" style={{ color: '#21393B', opacity: 0.5 }}>
                                {t.trip.emptyContent}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
