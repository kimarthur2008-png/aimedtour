import Link from 'next/link';

const NAV_LINKS = [
    { label: 'Главная',              href: '/'          },
    { label: 'Отзывы пациентов',     href: '/reviews'   },
    { label: 'Партнерские больницы', href: '/hospitals' },
    { label: 'Туризм и путешествие', href: '/trip'      },
    { label: 'О нас',                href: '/about'     },
    { label: 'FAQ',                  href: '/faq'       },
];

export default function Footer() {
    return (
        <footer style={{ backgroundColor: '#21393B' }}>

            {/* ── Основная часть ─────────────────────────────────────────── */}
            <div className="max-w-[1440px] mx-auto px-[clamp(24px,8vw,120px)] py-16 md:py-20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                    {/* Колонка 1 — широкая: лого + описание + иконки */}
                    <div className="md:col-span-2 flex flex-col gap-6">
                        {/* ЛОГОТИП: <img src="/logo.svg" className="h-8 w-auto" /> */}
                        <div className="h-8 w-32 rounded bg-white/10" />

                        <p className="text-caption text-white/60">
                            Ваш надёжный партнёр в области медицинского лечения мирового
                            уровня в Южной Корее. Мы берём на себя все вопросы, связанные с
                            выбором больниц, организацией поездки и переводом, чтобы вы
                            могли сосредоточиться на выздоровлении.
                        </p>

                        <div className="flex items-center gap-3">

                            <a href="tel:+8228475888"
                            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                            <img src="/icons/tel.svg" className="w-5 h-5" />
                        </a>

                        <a href="mailto:tendai401@naver.com"
                        className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                        <img src="/icons/email.svg" className="w-5 h-5" />
                    </a>

                    <a href="#"
                    className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                    <img src="/icons/map.svg" className="w-5 h-5" />
                </a>
            </div>
        </div>

    {/* Колонка 2 — навигация */}
    <div className="md:col-span-1 flex flex-col gap-3 ">
        {NAV_LINKS.map((n) => (
            <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-3 text-caption text-white/60 hover:text-white transition-colors group"
            >
                <svg
                    className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors shrink-0"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
                    <path d="m9 18 6-6-6-6"/>
                </svg>
                {n.label}
            </Link>
        ))}
    </div>

    {/* Колонка 3 — контакты */}
    <div className="md:col-span-1 flex flex-col gap-4 ">
        <h4 className="text-h3 text-white">Связаться с нами</h4>

        <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 text-caption text-white/60">
                <img src="/icons/map.svg" className="w-4 h-4 mt-0.5 shrink-0" />
                <span>ул. Тегеран, 123, район Каннам<br />Сеул, Южная Корея 06132</span>
            </div>
            <div className="flex items-center gap-3 text-caption text-white/60">
                <img src="/icons/tel.svg" className="w-4 h-4 shrink-0" />
                <span>02-2847-5888</span>
            </div>
            <div className="flex items-center gap-3 text-caption text-white/60">
                <img src="/icons/email.svg" className="w-4 h-4 shrink-0" />
                <span>tendai401@naver.com</span>
            </div>
        </div>
    </div>

</div>
</div>

    {/* ── Нижняя полоса ──────────────────────────────────────────── */}
    <div style={{ borderTop: '1px solid rgba(255,255,255, 0.5)' }}>
        <div className="max-w-[1440px] mx-auto px-[clamp(24px,8vw,120px)] py-5 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-caption text-white/40">
                © 2026 KoreaMedTour. Все права защищены.
            </p>
            <div className="flex items-center gap-6">
                <Link href="/privacy" className="text-caption text-white/40 hover:text-white/70 transition-colors">
                    Политика конфиденциальности
                </Link>
                <Link href="/terms" className="text-caption text-white/40 hover:text-white/70 transition-colors">
                    Условия предоставления услуг
                </Link>
            </div>
        </div>
    </div>

</footer>
);
}