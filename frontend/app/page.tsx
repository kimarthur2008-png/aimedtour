import Link from 'next/link';

const STATS = [
  { icon: '/icons/patients.svg',    value: '5,000+', label: 'Пациенты прошедшие лечение' },
  { icon: '/icons/global.svg',   value: '45+',    label: 'Страны с которыми мы сотрудничаем' },
  { icon: '/icons/experience.svg',  value: '15+',    label: 'Опыт работы' },
  { icon: '/icons/trust.svg',   value: '100%',   label: 'Сертифицированные партнеры JCI' },
];

const FEATURES = [
  {
    icon: '/icons/treatment.svg',
    title: 'Больницы мирового уровня',
    desc: 'Доступ к первоклассным медицинским учреждениям, аккредитованным JCI и KOIHA и оснащённым новейшим медицинским оборудованием.',
  },
  {
    icon: '/icons/all.svg',
    title: 'Все включено',
    desc: 'От встречи в аэропорту до размещения, процедур и экскурсий — мы позаботимся о каждой детали вашего путешествия.',
  },
  {
    icon: '/icons/patients.svg',
    title: 'Персональный координатор',
    desc: 'На протяжении всего лечения рядом с вами будет находиться специальный двуязычный медицинский переводчик и специалист, который будет работать с вами в индивидуальном порядке.',
  },
];

export default function HomePage() {
  return (
      <div className="flex flex-col">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section
            className="relative w-full overflow-hidden"
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
              className="relative z-10 flex flex-col gap-6 py-10 md:py-[80px] md:max-w-[57%] pl-[clamp(16px,8vw,120px)] pr-[clamp(24px,8vw,120px)]"
          >
            {/* Бейдж */}
            <div
                className="text-label inline-flex self-start px-5 py-2 bg-[#6B8B80]/30 text-primary-dark/70 rounded-full border border-primary-dark border-dashed"
            >
              Официальное агентство медицинского туризма Кореи
            </div>

            {/* Заголовок */}
            <h1 className="text-h1 text-primary font-bold leading-tight">
              Лечение мирового уровня.
              <br/>
              <span className="text-accent">
                Путешествие без лишних хлопот.
              </span>
            </h1>

            {/* Подзаголовок */}
            <p
                className="text-body text-primary-dark-80 leading-relaxed md:max-w-[480px]"
            >
              Оцените передовые медицинские технологии Южной Кореи с помощью нашего
              комплексного консьерж-сервиса. От ведущих больниц до роскошного восстановления.
            </p>

            {/* Кнопки */}
            <div className="flex flex-col gap-3 mt-2 md:flex-row md:gap-4 md:mt-4">
              <Link
                  href="/quiz"
                  className="px-6 py-4 rounded-2xl text-white text-[15px] font-semibold text-center transition-opacity hover:opacity-90 bg-primary"
              >
                Получите бесплатные рекомендации на основе ИИ
              </Link>
              <Link
                  href="/reviews"
                  className="px-6 py-4 rounded-2xl text-[15px] font-semibold text-center border-[1.5px] transition-colors hover:bg-white/50 border-primary text-primary bg-primary/3"
              >
                Посмотреть истории успеха
              </Link>
            </div>
          </div>

          {/* Фото — мобильный */}
          {/*<div className="md:hidden w-full h-[260px] overflow-hidden">*/}
          {/*  <img*/}
          {/*      src="/images/hero-bg.png"*/}
          {/*      alt="Клиника"*/}
          {/*      className="w-full h-full object-cover"*/}
          {/*  />*/}
          {/*</div>*/}
        </section>

        {/* ── СТАТИСТИКА ───────────────────────────────────────────────────── */}
        <section className="bg-primary px-[clamp(24px,8vw,120px)] py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-[1440px] mx-auto ">
            {STATS.map((s) => (
                <div key={s.value} className="flex flex-col items-center text-center gap-3">
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
        {/* ── ПОЧЕМУ МЫ ────────────────────────────────────────────────────────── */}
        <section className="py-16 md:py-24 bg-bg-light px-[clamp(24px,8vw,120px)]">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-caption mb-4 text-accent">
              Почему стоит выбрать нас?
            </p>
            <h2 className="text-h2-accent leading-tight mb-4 text-[#425D54]">
              Ваш Путь К Здоровью,<br />
              Идеально Организованный
            </h2>
            <p className="text-body leading-relaxed max-w-[600px] mx-auto text-primary-dark/60">
              Мы помогаем пациентам со всего мира воспользоваться преимуществами
              передовой медицинской инфраструктуры Кореи, обеспечивая беспрепятственное,
              безопасное и успешное выздоровление.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[1400px] mx-auto">
            {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl p-6 flex flex-col gap-4 bg-primary">
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
            Готовы сделать первый шаг к<br />улучшению здоровья?
          </h2>
          <p className="text-caption text-white opacity-70 mb-10 max-w-[560px] mx-auto">
            Расскажите нам о своих медицинских потребностях, и наш искусственный интеллект
            мгновенно подберет для вас лучшие больницы и специалистов в Южной Корее.
          </p>
          <Link
              href="/quiz"
              className="inline-block px-10 py-4 rounded-2xl text-[16px] font-semibold transition-opacity hover:opacity-90 bg-bg-light text-primary-dark"
          >
            Начните с бесплатного опросника
          </Link>
        </section>

      </div>
  );
}