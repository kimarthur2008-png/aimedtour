import Link from 'next/link';

const STATS = [
  { value: '1240+', label: 'пациентов' },
  { value: '28',    label: 'стран' },
  { value: '7',     label: 'лет опыта' },
  { value: '12',    label: 'клиник' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="">
        <img src="/images/hero-bg.svg" alt="Hero Background" className="absolute inset-0 w-full h-full object-cover -z-10" />
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Лечение в Корее — просто и надёжно
          </h1>
          <p className="text-teal-100 text-lg mb-8 max-w-xl mx-auto">
            Подбираем лучшую корейскую клинику под ваш диагноз, бюджет и требования. Полное сопровождение на русском языке.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/quiz"
              className="px-6 py-3 rounded-xl bg-white text-teal-700 font-semibold hover:bg-teal-50 transition-colors">
              Подобрать клинику →
            </Link>
            <Link href="/consult"
              className="px-6 py-3 rounded-xl border border-teal-400 text-white font-semibold hover:bg-teal-700 transition-colors">
              Записаться на консультацию
            </Link>
          </div>
        </div>
      </section>

      {/* Счётчики */}
      <section className="bg-white border-b border-gray-100 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-teal-600">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Шаги */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Как это работает</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Пройдите опрос', desc: 'Алгоритм за 5 шагов подберёт топ-3 клиники под ваши параметры' },
              { n: '02', title: 'Оставьте заявку', desc: 'Координатор свяжется с вами и уточнит детали' },
              { n: '03', title: 'Летите лечиться', desc: 'Мы организуем визу, трансфер и проживание рядом с клиникой' },
            ].map((step) => (
              <div key={step.n} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="text-3xl font-black text-teal-100 mb-3">{step.n}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-teal-50 py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Готовы начать?</h2>
        <p className="text-gray-500 mb-6">Пройдите бесплатный подбор клиники за 2 минуты</p>
        <Link href="/quiz"
          className="inline-block px-8 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors">
          Начать подбор →
        </Link>
      </section>
    </div>
  );
}
