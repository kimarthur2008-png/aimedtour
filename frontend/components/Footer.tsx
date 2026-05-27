import Link from 'next/link';

const ABOUT_TEXT_MOBILE =
  'Ваш надёжный партнёр в медицинском лечении мирового уровня в Южной Корее. ' +
  'Подбор клиник, организация поездки и перевод — вы сосредотачиваетесь на выздоровлении.';

const ABOUT_TEXT_DESKTOP =
  'Ваш надёжный партнёр в области медицинского лечения мирового уровня в Южной Корее. ' +
  'Мы берём на себя все вопросы, связанные с выбором больниц, организацией поездки и переводом, ' +
  'чтобы вы могли сосредоточиться на выздоровлении.';

const NAV_LINKS = [
  { label: 'Главная',              href: '/'          },
  { label: 'Отзывы пациентов',     href: '/reviews'   },
  { label: 'Партнерские больницы', href: '/hospitals' },
  { label: 'Туризм и путешествие', href: '/trip'      },
  { label: 'О нас',                href: '/about'     },
  { label: 'FAQ',                  href: '/faq'       },
];

function NavLinkList({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {NAV_LINKS.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className="flex items-center gap-3 text-caption text-white/60 hover:text-white transition-colors group"
        >
          <svg
            className="w-3 h-3 text-[#8eb5c4] group-hover:text-white/80 transition-colors shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          {n.label}
        </Link>
      ))}
    </div>
  );
}

function ContactBlock() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3 text-caption text-white/60">
        <img src="/icons/map.svg" alt="" className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          ул. Тегеран, 123, район Каннам
          <br />
          Сеул, Южная Корея 06132
        </span>
      </div>
      <a
        href="tel:+82228475888"
        className="flex items-center gap-3 text-caption text-white/60 hover:text-white transition-colors"
      >
        <img src="/icons/tel.svg" alt="" className="w-4 h-4 shrink-0" />
        <span>02-2847-5888</span>
      </a>
      <a
        href="mailto:tendai401@naver.com"
        className="flex items-center gap-3 text-caption text-white/60 hover:text-white transition-colors"
      >
        <img src="/icons/email.svg" alt="" className="w-4 h-4 shrink-0" />
        <span>tendai401@naver.com</span>
      </a>
    </div>
  );
}

function BrandBlock({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="shrink-0 w-fit">
        <img src="/logo.svg" alt="Smart K-Medi" className="h-8 w-auto" />
      </Link>
      <p className="text-caption text-white/60 max-w-[420px]">{text}</p>
    </div>
  );
}

function IconButtons({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <a
        href="tel:+82228475888"
        className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Позвонить"
      >
        <img src="/icons/tel.svg" alt="" className="w-5 h-5" />
      </a>
      <a
        href="mailto:tendai401@naver.com"
        className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Написать на email"
      >
        <img src="/icons/email.svg" alt="" className="w-5 h-5" />
      </a>
      <a
        href="#"
        className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Адрес"
      >
        <img src="/icons/map.svg" alt="" className="w-5 h-5" />
      </a>
    </div>
  );
}

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#21393B' }}>
      <div className="max-w-[1440px] mx-auto px-[clamp(24px,8vw,120px)] py-10 md:py-20">

        {/* ── Мобилка (по макету) ─────────────────────────────────────── */}
        <div className="flex flex-col gap-8 md:hidden">
          <BrandBlock text={ABOUT_TEXT_MOBILE} />
          <IconButtons />

          <div className="flex flex-col gap-4">
            <h4 className="text-h3 text-white font-semibold">Быстрые ссылки</h4>
            <NavLinkList />
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-h3 text-white font-semibold">Связаться с нами</h4>
            <ContactBlock />
          </div>
        </div>

        {/* ── Десктоп ─────────────────────────────────────────────────── */}
        <div className="hidden md:grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2 flex flex-col gap-6">
            <BrandBlock text={ABOUT_TEXT_DESKTOP} />
            <IconButtons />
          </div>

          <div className="md:col-span-1">
            <NavLinkList />
          </div>

          <div className="md:col-span-1 flex flex-col gap-4">
            <h4 className="text-h3 text-white">Связаться с нами</h4>
            <ContactBlock />
          </div>
        </div>
      </div>

      {/* ── Нижняя полоса ───────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.25)' }}>
        <div className="max-w-[1440px] mx-auto px-[clamp(24px,8vw,120px)] py-6 md:py-5 flex flex-col items-center gap-4 md:flex-row md:justify-between md:gap-3">
          <p className="text-caption text-white/40 text-center">
            © 2026 KoreaMedTour. Все права защищены.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link
              href="/privacy"
              className="text-caption text-white/40 hover:text-white/70 transition-colors text-center"
            >
              Политика конфиденциальности
            </Link>
            <Link
              href="/terms"
              className="text-caption text-white/40 hover:text-white/70 transition-colors text-center"
            >
              Условия предоставления услуг
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
