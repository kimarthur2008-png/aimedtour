import type { PatientCase } from '@/hooks/useCases';

interface Props {
  patientCase: PatientCase;
}

export default function ReviewCard({ patientCase }: Props) {
  const { patientName, country, category, result, testimonial, imageUrl } = patientCase;

  return (
    <article
      className="bg-white rounded-2xl overflow-hidden flex flex-col"
      style={{ border: '1px solid rgba(0,0,0,0.06)' }}
    >
      {/* Фото */}
      <div className="relative w-full h-[220px] md:h-[240px] shrink-0">
        <img
          src={imageUrl || '/images/hero-bg.png'}
          alt={patientName}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(33,57,59,0.75) 0%, rgba(33,57,59,0.1) 45%, transparent 70%)',
          }}
        />

        {/* Бейдж: категория на десктопе, страна на мобилке */}
        <span
          className="absolute top-4 left-4 hidden md:inline-block text-caption px-3 py-1 rounded-full text-white"
          style={{ backgroundColor: 'rgba(33,57,59,0.85)' }}
        >
          {category}
        </span>
        <span
          className="absolute top-4 left-4 md:hidden text-caption px-3 py-1 rounded-full text-white"
          style={{ backgroundColor: 'rgba(33,57,59,0.85)' }}
        >
          {country}
        </span>

        <p className="absolute bottom-4 left-4 text-h3 text-white font-semibold">
          {patientName}
        </p>
      </div>

      {/* Текст */}
      <div className="flex flex-col gap-3 p-5 md:p-6 flex-1">
        <h2 className="text-h3 font-semibold leading-snug" style={{ color: '#3D616D' }}>
          {result}
        </h2>
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} className="pt-3">
          <p className="text-body" style={{ color: '#21393B', opacity: 0.7 }}>
            {testimonial}
          </p>
        </div>
      </div>
    </article>
  );
}
